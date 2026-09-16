import { Prisma } from '@prisma/client';

export const orderInclude = {
  items: true,
  payment: {
    select: {
      status: true,
      reference: true,
      authorizationUrl: true,
      channel: true,
      amount: true,
      paidAt: true,
    },
  },
} satisfies Prisma.OrderInclude;

type OrderPayload = Prisma.OrderGetPayload<{ include: typeof orderInclude }>;

export function serializeOrder(order: OrderPayload) {
  return {
    id: order.id,
    orderNumber: order.orderNumber,
    status: order.status,
    contact: { email: order.email, phone: order.phone, fullName: order.fullName },
    shippingAddress: {
      fullName: order.fullName,
      phone: order.phone,
      addressLine1: order.addressLine1,
      addressLine2: order.addressLine2,
      city: order.city,
      state: order.state,
      country: order.country,
      postalCode: order.postalCode,
    },
    totals: {
      subtotal: order.subtotal,
      discountTotal: order.discountTotal,
      shippingTotal: order.shippingTotal,
      total: order.total,
    },
    couponCode: order.couponCode,
    shippingMethod: order.shippingMethod,
    shippingZone: order.shippingZone,
    trackingNumber: order.trackingNumber,
    deliveryNotes: order.deliveryNotes,
    items: order.items.map((it) => ({
      id: it.id,
      productId: it.productId,
      variantId: it.variantId,
      productName: it.productName,
      productSlug: it.productSlug,
      variantLabel: it.variantLabel,
      sku: it.sku,
      imageUrl: it.imageUrl,
      unitPrice: it.unitPrice,
      quantity: it.quantity,
      lineTotal: it.lineTotal,
    })),
    payment: order.payment
      ? {
          status: order.payment.status,
          reference: order.payment.reference,
          authorizationUrl: order.payment.authorizationUrl,
          channel: order.payment.channel,
          amount: order.payment.amount,
          paidAt: order.payment.paidAt,
        }
      : null,
    placedAt: order.createdAt,
    paidAt: order.paidAt,
    shippedAt: order.shippedAt,
    deliveredAt: order.deliveredAt,
    cancelledAt: order.cancelledAt,
    updatedAt: order.updatedAt,
  };
}

export function serializeOrderSummary(order: OrderPayload) {
  const itemCount = order.items.reduce((sum, it) => sum + it.quantity, 0);
  return {
    id: order.id,
    orderNumber: order.orderNumber,
    status: order.status,
    total: order.total,
    itemCount,
    paymentStatus: order.payment?.status ?? null,
    placedAt: order.createdAt,
  };
}
