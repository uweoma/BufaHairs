import { OrderStatus, Prisma } from '@prisma/client';
import { prisma } from '../config/prisma';
import { ApiError } from '../utils/ApiError';
import { logger } from '../config/logger';
import { generateOrderNumber, generateToken } from '../utils/tokens';
import { effectiveUnitPrice, variantLabel } from '../utils/pricing';
import { orderInclude, serializeOrder, serializeOrderSummary } from '../serializers/order.serializer';
import * as addressService from './address.service';
import * as shippingService from './shipping.service';
import { evaluateCoupon, type CouponLine } from './coupon.service';
import type { CreateOrderInput } from '../validators/order.validator';

const cartItemInclude = {
  product: {
    include: { images: { orderBy: [{ isPrimary: 'desc' }, { sortOrder: 'asc' }], take: 1 } },
  },
  variant: true,
} satisfies Prisma.CartItemInclude;

type Db = Prisma.TransactionClient;

/** Restores reserved stock for an order's items (used on cancel / failed payment). */
export async function restoreStock(tx: Db, orderId: string) {
  const items = await tx.orderItem.findMany({ where: { orderId } });
  for (const it of items) {
    if (it.variantId) {
      await tx.productVariant.update({
        where: { id: it.variantId },
        data: { stock: { increment: it.quantity } },
      });
    } else if (it.productId) {
      await tx.product.update({
        where: { id: it.productId },
        data: { stock: { increment: it.quantity } },
      });
    }
  }
}

export async function createOrder(userId: string, input: CreateOrderInput) {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) throw ApiError.unauthorized();

  // 1. Load the cart (authoritative source of items + prices).
  const cartItems = await prisma.cartItem.findMany({
    where: { cart: { userId } },
    include: cartItemInclude,
    orderBy: { createdAt: 'asc' },
  });
  if (cartItems.length === 0) throw ApiError.badRequest('Your cart is empty');

  // 2. Resolve the shipping address (saved or inline).
  const addr = input.addressId
    ? await addressService.getOwnedAddress(userId, input.addressId)
    : input.address!;

  // 3. Build immutable line snapshots + subtotal (recomputed server-side).
  const itemSnapshots = cartItems.map((it) => {
    const unitPrice = effectiveUnitPrice(it.product, it.variant);
    return {
      productId: it.productId,
      variantId: it.variantId,
      productName: it.product.name,
      productSlug: it.product.slug,
      variantLabel: variantLabel(it.variant),
      sku: it.variant?.sku ?? it.product.sku,
      imageUrl: it.product.images[0]?.url ?? null,
      unitPrice,
      quantity: it.quantity,
      lineTotal: unitPrice * it.quantity,
    };
  });
  const subtotal = itemSnapshots.reduce((sum, s) => sum + s.lineTotal, 0);

  // 4. Coupon (backend-authoritative discount).
  let discountTotal = 0;
  let couponId: string | null = null;
  let couponCode: string | null = null;
  if (input.couponCode) {
    const lines: CouponLine[] = cartItems.map((it) => ({
      productId: it.productId,
      categoryId: it.product.categoryId,
      lineTotal: effectiveUnitPrice(it.product, it.variant) * it.quantity,
    }));
    const evaluation = await evaluateCoupon(input.couponCode, userId, lines, subtotal);
    discountTotal = evaluation.discount;
    couponId = evaluation.couponId;
    couponCode = evaluation.code;
  }

  // 5. Shipping (backend-authoritative, validated against destination zone).
  const shipping = await shippingService.priceSelection({
    rateId: input.shippingRateId,
    country: addr.country,
    state: addr.state,
    subtotal,
  });

  // 6. Totals.
  const total = subtotal - discountTotal + shipping.shippingCost;
  if (total < 0) throw ApiError.badRequest('Order total cannot be negative');

  // Reservation list for the transaction.
  const reservations = cartItems.map((it) => ({
    productId: it.productId,
    variantId: it.variantId,
    quantity: it.quantity,
    productName: it.product.name,
  }));

  // 7. Create the order in a transaction, reserving inventory atomically.
  const runAttempt = () => {
    const orderNumber = generateOrderNumber();
    const reference = `${orderNumber}-${generateToken(4).toUpperCase()}`;
    return prisma.$transaction(async (tx) => {
      // Reserve stock with a conditional decrement — the WHERE stock >= qty guard
      // means a row can never go negative even under concurrent checkouts.
      for (const r of reservations) {
        if (r.variantId) {
          const res = await tx.productVariant.updateMany({
            where: { id: r.variantId, isActive: true, stock: { gte: r.quantity } },
            data: { stock: { decrement: r.quantity } },
          });
          if (res.count === 0) {
            throw ApiError.badRequest(`Insufficient stock for ${r.productName}`);
          }
        } else if (r.productId) {
          const res = await tx.product.updateMany({
            where: { id: r.productId, isActive: true, deletedAt: null, stock: { gte: r.quantity } },
            data: { stock: { decrement: r.quantity } },
          });
          if (res.count === 0) {
            throw ApiError.badRequest(`Insufficient stock for ${r.productName}`);
          }
        }
      }

      const order = await tx.order.create({
        data: {
          orderNumber,
          userId,
          status: OrderStatus.PENDING,
          email: user.email,
          phone: addr.phone,
          fullName: addr.fullName,
          addressLine1: addr.addressLine1,
          addressLine2: addr.addressLine2 ?? null,
          city: addr.city,
          state: addr.state,
          country: addr.country,
          postalCode: addr.postalCode ?? null,
          subtotal,
          discountTotal,
          shippingTotal: shipping.shippingCost,
          total,
          couponId,
          couponCode,
          shippingMethod: shipping.shippingMethod,
          shippingZone: shipping.shippingZone,
          deliveryNotes: input.note ?? null,
          items: { create: itemSnapshots },
          payment: {
            create: {
              provider: 'PAYSTACK',
              reference,
              status: 'PENDING',
              amount: total,
              currency: 'NGN',
            },
          },
        },
        include: orderInclude,
      });

      // Items are now reserved on the order — empty the cart.
      await tx.cartItem.deleteMany({ where: { cart: { userId } } });
      return order;
    });
  };

  let created;
  for (let attempt = 0; attempt < 3; attempt += 1) {
    try {
      created = await runAttempt();
      break;
    } catch (err) {
      // Retry only on the rare orderNumber/reference unique collision.
      if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2002') {
        logger.warn('Order number/reference collision, retrying', { attempt });
        continue;
      }
      throw err;
    }
  }
  if (!created) throw ApiError.internal('Could not create order, please try again');

  // Persist the inline address after the order commits (best-effort).
  if (!input.addressId && input.saveAddress && input.address) {
    try {
      await addressService.createAddress(userId, input.address);
    } catch (err) {
      logger.warn('Failed to save checkout address', err);
    }
  }

  return serializeOrder(created);
}

export async function listOrders(
  userId: string,
  opts: { page: number; limit: number; skip: number; status?: OrderStatus },
) {
  const where: Prisma.OrderWhereInput = { userId, ...(opts.status ? { status: opts.status } : {}) };
  const [orders, total] = await Promise.all([
    prisma.order.findMany({
      where,
      include: orderInclude,
      orderBy: { createdAt: 'desc' },
      skip: opts.skip,
      take: opts.limit,
    }),
    prisma.order.count({ where }),
  ]);
  return { orders: orders.map(serializeOrderSummary), total };
}

export async function getOrderByNumber(userId: string, orderNumber: string) {
  const order = await prisma.order.findFirst({
    where: { orderNumber, userId },
    include: orderInclude,
  });
  if (!order) throw ApiError.notFound('Order not found');
  return serializeOrder(order);
}

/** Customer-initiated cancellation — only while unpaid. Restores reserved stock. */
export async function cancelOrder(userId: string, orderNumber: string) {
  const order = await prisma.order.findFirst({ where: { orderNumber, userId } });
  if (!order) throw ApiError.notFound('Order not found');
  if (order.status !== OrderStatus.PENDING) {
    throw ApiError.badRequest(`Only pending orders can be cancelled (this order is ${order.status})`);
  }

  const updated = await prisma.$transaction(async (tx) => {
    await restoreStock(tx, order.id);
    await tx.payment.updateMany({
      where: { orderId: order.id, status: 'PENDING' },
      data: { status: 'FAILED', gatewayResponse: 'Cancelled by customer' },
    });
    return tx.order.update({
      where: { id: order.id },
      data: { status: OrderStatus.CANCELLED, cancelledAt: new Date() },
      include: orderInclude,
    });
  });
  return serializeOrder(updated);
}
