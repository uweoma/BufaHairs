import { OrderStatus, PaymentStatus, Prisma } from '@prisma/client';
import { prisma } from '../config/prisma';
import { env } from '../config/env';
import { logger } from '../config/logger';
import { ApiError } from '../utils/ApiError';
import { generateToken } from '../utils/tokens';
import { orderInclude, serializeOrder } from '../serializers/order.serializer';
import { sendOrderConfirmationEmail } from './email/order-emails';
import * as paystack from './payment/paystack';

export const paystackEnabled = paystack.paystackEnabled;

interface SuccessDetails {
  channel?: string | null;
  paidAt?: Date | null;
  gatewayResponse?: string | null;
  raw?: unknown;
}

function appendNote(existing: string | null, note: string): string {
  return existing ? `${existing}\n${note}` : note;
}

async function loadSerializedOrder(orderId: string) {
  const order = await prisma.order.findUnique({ where: { id: orderId }, include: orderInclude });
  return order ? serializeOrder(order) : null;
}

/**
 * Idempotent, transaction-safe "mark paid" pipeline. Uses a conditional
 * updateMany to claim the payment so concurrent webhook + verify calls can
 * never double-process (record coupon usage / sales counts twice).
 */
async function applySuccessfulPayment(reference: string, details: SuccessDetails) {
  const result = await prisma.$transaction(async (tx) => {
    // Atomically claim: only the first caller flips PENDING/PROCESSING/FAILED -> SUCCESS.
    const claim = await tx.payment.updateMany({
      where: { reference, status: { not: PaymentStatus.SUCCESS } },
      data: {
        status: PaymentStatus.SUCCESS,
        channel: details.channel ?? undefined,
        paidAt: details.paidAt ?? new Date(),
        gatewayResponse: details.gatewayResponse ?? 'success',
        rawResponse: (details.raw ?? undefined) as Prisma.InputJsonValue,
      },
    });

    const payment = await tx.payment.findUnique({
      where: { reference },
      include: { order: { include: { items: true } } },
    });
    if (!payment) throw ApiError.notFound('Payment not found');
    const order = payment.order;

    if (claim.count === 0) {
      // Already processed by a prior call — no-op.
      return { orderId: order.id, alreadyProcessed: true, fulfilled: false };
    }

    if (order.status === OrderStatus.CANCELLED) {
      // Money captured for a cancelled order — flag for manual refund, do not fulfil.
      logger.error('Payment received for a cancelled order', { orderNumber: order.orderNumber });
      await tx.order.update({
        where: { id: order.id },
        data: { adminNotes: appendNote(order.adminNotes, 'Payment received after cancellation — refund required') },
      });
      return { orderId: order.id, alreadyProcessed: false, fulfilled: false };
    }

    await tx.order.update({
      where: { id: order.id },
      data: { status: OrderStatus.PAID, paidAt: details.paidAt ?? new Date() },
    });

    // Record coupon usage (idempotent via unique orderId) + bump counter.
    if (order.couponId) {
      const existing = await tx.couponUsage.findUnique({ where: { orderId: order.id } });
      if (!existing) {
        await tx.couponUsage.create({
          data: { couponId: order.couponId, userId: order.userId, orderId: order.id },
        });
        await tx.coupon.update({ where: { id: order.couponId }, data: { usedCount: { increment: 1 } } });
      }
    }

    // Sales counts (stock was already reserved at order creation).
    for (const it of order.items) {
      if (it.productId) {
        await tx.product.update({
          where: { id: it.productId },
          data: { salesCount: { increment: it.quantity } },
        });
      }
    }

    // In-app notification.
    await tx.notification.create({
      data: {
        userId: order.userId,
        type: 'PAYMENT',
        title: 'Payment successful',
        message: `We've received payment for order ${order.orderNumber}.`,
        data: { orderNumber: order.orderNumber },
      },
    });

    return { orderId: order.id, alreadyProcessed: false, fulfilled: true };
  });

  // Best-effort confirmation email, outside the transaction.
  if (result.fulfilled) {
    const order = await prisma.order.findUnique({
      where: { id: result.orderId },
      include: orderInclude,
    });
    if (order) {
      await sendOrderConfirmationEmail(order.email, {
        orderNumber: order.orderNumber,
        fullName: order.fullName,
        items: order.items.map((it) => ({
          productName: it.productName,
          variantLabel: it.variantLabel,
          quantity: it.quantity,
          lineTotal: it.lineTotal,
        })),
        subtotal: order.subtotal,
        discountTotal: order.discountTotal,
        shippingTotal: order.shippingTotal,
        total: order.total,
        shippingMethod: order.shippingMethod,
        address: {
          addressLine1: order.addressLine1,
          addressLine2: order.addressLine2,
          city: order.city,
          state: order.state,
          country: order.country,
        },
      });
    }
  }

  return result;
}

/** Initializes (or re-initializes) a Paystack transaction for a pending order. */
export async function initializeForOrder(userId: string, orderNumber: string) {
  const order = await prisma.order.findFirst({
    where: { orderNumber, userId },
    include: { payment: true },
  });
  if (!order) throw ApiError.notFound('Order not found');
  if (!order.payment) throw ApiError.internal('Order has no payment record');
  if (order.payment.status === PaymentStatus.SUCCESS) {
    throw ApiError.badRequest('This order has already been paid');
  }
  if (order.status !== OrderStatus.PENDING) {
    throw ApiError.badRequest(`This order cannot be paid (status: ${order.status})`);
  }

  // Rotate the reference on a retry after a failed attempt.
  let reference = order.payment.reference;
  if (order.payment.status === PaymentStatus.FAILED) {
    reference = `${order.orderNumber}-${generateToken(4).toUpperCase()}`;
  }

  if (!paystack.paystackEnabled) {
    // Dev/staging without keys: keep a real PENDING payment; completion still
    // requires the dev simulator or a real webhook — never auto-marked paid.
    await prisma.payment.update({
      where: { id: order.payment.id },
      data: { reference, status: PaymentStatus.PENDING, authorizationUrl: null },
    });
    logger.warn('Paystack not configured — returning order without a live authorization URL', {
      orderNumber,
    });
    return { reference, authorizationUrl: null, paystackEnabled: false, publicKey: '' };
  }

  const init = await paystack.initializeTransaction({
    email: order.email,
    amountKobo: order.total,
    reference,
    callbackUrl: `${env.CLIENT_URL}/checkout/callback`,
    metadata: { orderId: order.id, orderNumber: order.orderNumber, userId },
  });

  await prisma.payment.update({
    where: { id: order.payment.id },
    data: {
      reference: init.reference,
      authorizationUrl: init.authorizationUrl,
      accessCode: init.accessCode,
      status: PaymentStatus.PENDING,
    },
  });

  return {
    reference: init.reference,
    authorizationUrl: init.authorizationUrl,
    paystackEnabled: true,
    publicKey: env.PAYSTACK_PUBLIC_KEY,
  };
}

/** Server-side verification (called after the Paystack redirect). Idempotent. */
export async function verifyByReference(reference: string, userId?: string) {
  const payment = await prisma.payment.findUnique({
    where: { reference },
    include: { order: true },
  });
  if (!payment) throw ApiError.notFound('Payment not found');
  if (userId && payment.order.userId !== userId) throw ApiError.notFound('Payment not found');

  // Already verified — return current state without re-hitting Paystack.
  if (payment.status === PaymentStatus.SUCCESS) {
    return { status: 'success', order: await loadSerializedOrder(payment.orderId) };
  }

  if (!paystack.paystackEnabled) {
    throw new ApiError(503, 'Payment verification is unavailable (provider not configured)');
  }

  const v = await paystack.verifyTransaction(reference);

  if (v.status !== 'success') {
    if (v.status === 'failed') {
      await prisma.payment.updateMany({
        where: { reference, status: { not: PaymentStatus.SUCCESS } },
        data: { status: PaymentStatus.FAILED, gatewayResponse: v.gatewayResponse ?? 'failed' },
      });
    }
    throw ApiError.badRequest(`Payment was not completed (status: ${v.status})`);
  }

  // Defense-in-depth: the paid amount + currency must match our order.
  if (v.currency !== 'NGN' || v.amount !== payment.amount) {
    logger.error('Payment amount/currency mismatch — refusing to fulfil', {
      reference,
      expected: payment.amount,
      got: v.amount,
      currency: v.currency,
    });
    throw ApiError.badRequest('Payment verification failed (amount mismatch)');
  }

  await applySuccessfulPayment(reference, {
    channel: v.channel,
    paidAt: v.paidAt,
    gatewayResponse: v.gatewayResponse,
    raw: v.raw,
  });

  return { status: 'success', order: await loadSerializedOrder(payment.orderId) };
}

/** Handles a signature-verified Paystack webhook event. Idempotent. */
export async function handleWebhookEvent(event: { event?: string; data?: Record<string, unknown> }) {
  const type = event.event;
  const data = event.data ?? {};
  const reference = typeof data.reference === 'string' ? data.reference : null;
  if (!reference) return;

  if (type === 'charge.success') {
    const payment = await prisma.payment.findUnique({ where: { reference } });
    if (!payment) {
      logger.warn('Webhook for unknown payment reference', { reference });
      return;
    }
    const amount = typeof data.amount === 'number' ? data.amount : null;
    const currency = typeof data.currency === 'string' ? data.currency : 'NGN';
    if (currency !== 'NGN' || amount !== payment.amount) {
      logger.error('Webhook amount/currency mismatch — ignoring', {
        reference,
        expected: payment.amount,
        got: amount,
        currency,
      });
      return;
    }
    await applySuccessfulPayment(reference, {
      channel: typeof data.channel === 'string' ? data.channel : null,
      paidAt: typeof data.paid_at === 'string' ? new Date(data.paid_at) : new Date(),
      gatewayResponse: typeof data.gateway_response === 'string' ? data.gateway_response : 'success',
      raw: data,
    });
  } else if (type === 'charge.failed') {
    await prisma.payment.updateMany({
      where: { reference, status: { not: PaymentStatus.SUCCESS } },
      data: { status: PaymentStatus.FAILED, gatewayResponse: 'charge.failed' },
    });
  }
}

/**
 * DEV-ONLY simulator to complete a payment when Paystack is not configured.
 * Hard-guarded: unreachable in production and when real keys are present.
 * This does NOT fake production payments — it only exists for local testing.
 */
export async function devCompletePayment(reference: string) {
  if (env.isProd || paystack.paystackEnabled) {
    throw ApiError.notFound('Not found');
  }
  const payment = await prisma.payment.findUnique({ where: { reference } });
  if (!payment) throw ApiError.notFound('Payment not found');
  await applySuccessfulPayment(reference, {
    channel: 'dev',
    gatewayResponse: '[DEV] Simulated successful payment',
    raw: { simulated: true, reference },
  });
  return loadSerializedOrder(payment.orderId);
}
