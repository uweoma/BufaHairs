import { OrderStatus, PaymentStatus, Prisma } from '@prisma/client';
import { prisma } from '../config/prisma';
import { ApiError } from '../utils/ApiError';
import { logger } from '../config/logger';
import { orderInclude, serializeOrder, serializeOrderSummary } from '../serializers/order.serializer';
import { restoreStock } from './order.service';
import { sendOrderStatusEmail } from './email/order-emails';
import type { UpdateOrderInput } from '../validators/admin.validator';

/** Allowed admin-driven status transitions. Payment flow owns PENDING -> PAID. */
const TRANSITIONS: Record<OrderStatus, OrderStatus[]> = {
  [OrderStatus.PENDING]: [OrderStatus.CANCELLED],
  [OrderStatus.PAID]: [OrderStatus.PROCESSING, OrderStatus.SHIPPED, OrderStatus.CANCELLED, OrderStatus.REFUNDED],
  [OrderStatus.PROCESSING]: [OrderStatus.SHIPPED, OrderStatus.CANCELLED, OrderStatus.REFUNDED],
  [OrderStatus.SHIPPED]: [OrderStatus.DELIVERED, OrderStatus.REFUNDED],
  [OrderStatus.DELIVERED]: [OrderStatus.REFUNDED],
  [OrderStatus.CANCELLED]: [],
  [OrderStatus.REFUNDED]: [],
};

// Moving into one of these releases the reserved inventory (once).
const STOCK_RELEASING: OrderStatus[] = [OrderStatus.CANCELLED, OrderStatus.REFUNDED];
// Statuses that trigger a customer email.
const EMAILED: OrderStatus[] = [
  OrderStatus.PROCESSING,
  OrderStatus.SHIPPED,
  OrderStatus.DELIVERED,
  OrderStatus.CANCELLED,
  OrderStatus.REFUNDED,
];

export async function listOrders(opts: {
  page: number;
  limit: number;
  skip: number;
  status?: OrderStatus;
  q?: string;
}) {
  const where: Prisma.OrderWhereInput = {};
  if (opts.status) where.status = opts.status;
  if (opts.q) {
    where.OR = [
      { orderNumber: { contains: opts.q, mode: 'insensitive' } },
      { email: { contains: opts.q, mode: 'insensitive' } },
      { fullName: { contains: opts.q, mode: 'insensitive' } },
      { phone: { contains: opts.q, mode: 'insensitive' } },
    ];
  }
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

export async function getOrder(orderNumber: string) {
  const order = await prisma.order.findUnique({ where: { orderNumber }, include: orderInclude });
  if (!order) throw ApiError.notFound('Order not found');
  return serializeOrder(order);
}

/**
 * Updates an order's status / tracking / admin notes. Validates the transition,
 * releases reserved stock on cancel/refund, keeps the payment record consistent,
 * then (best-effort) notifies the customer.
 */
export async function updateOrder(orderNumber: string, input: UpdateOrderInput) {
  const order = await prisma.order.findUnique({ where: { orderNumber } });
  if (!order) throw ApiError.notFound('Order not found');

  const nextStatus = input.status;
  const statusChanging = nextStatus != null && nextStatus !== order.status;

  if (statusChanging) {
    const allowed = TRANSITIONS[order.status] ?? [];
    if (!allowed.includes(nextStatus!)) {
      throw ApiError.badRequest(
        `Cannot change order status from ${order.status} to ${nextStatus}`,
      );
    }
  }

  const updated = await prisma.$transaction(async (tx) => {
    const data: Prisma.OrderUpdateInput = {};

    if (input.trackingNumber !== undefined) data.trackingNumber = input.trackingNumber || null;
    if (input.adminNotes !== undefined) data.adminNotes = input.adminNotes || null;

    if (statusChanging) {
      const now = new Date();
      data.status = nextStatus!;
      if (nextStatus === OrderStatus.SHIPPED) data.shippedAt = now;
      if (nextStatus === OrderStatus.DELIVERED) data.deliveredAt = now;
      if (nextStatus === OrderStatus.CANCELLED) data.cancelledAt = now;

      // Release inventory when the order leaves the fulfilment pipeline.
      if (STOCK_RELEASING.includes(nextStatus!)) {
        await restoreStock(tx, order.id);
      }

      // Keep the payment record consistent.
      if (nextStatus === OrderStatus.REFUNDED) {
        await tx.payment.updateMany({
          where: { orderId: order.id },
          data: { status: PaymentStatus.REFUNDED },
        });
      } else if (nextStatus === OrderStatus.CANCELLED && order.status === OrderStatus.PENDING) {
        await tx.payment.updateMany({
          where: { orderId: order.id, status: PaymentStatus.PENDING },
          data: { status: PaymentStatus.FAILED, gatewayResponse: 'Cancelled by admin' },
        });
      }

      // In-app notification for the customer.
      await tx.notification.create({
        data: {
          userId: order.userId,
          type: 'ORDER_UPDATE',
          title: `Order ${order.orderNumber} ${nextStatus!.toLowerCase()}`,
          message: `Your order ${order.orderNumber} is now ${nextStatus!.toLowerCase()}.`,
          data: { orderNumber: order.orderNumber, status: nextStatus },
        },
      });
    }

    return tx.order.update({ where: { id: order.id }, data, include: orderInclude });
  });

  // Best-effort customer email, outside the transaction.
  if (statusChanging && EMAILED.includes(nextStatus!)) {
    try {
      await sendOrderStatusEmail(updated.email, {
        orderNumber: updated.orderNumber,
        fullName: updated.fullName,
        status: nextStatus!,
        trackingNumber: updated.trackingNumber,
      });
    } catch (err) {
      logger.warn('Failed to send order status email', err);
    }
  }

  return serializeOrder(updated);
}
