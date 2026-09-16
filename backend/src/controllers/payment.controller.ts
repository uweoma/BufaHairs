import type { Request, Response } from 'express';
import * as paymentService from '../services/payment.service';
import { verifyWebhookSignature } from '../services/payment/paystack';
import { asyncHandler } from '../utils/asyncHandler';
import { sendSuccess } from '../utils/apiResponse';
import { ApiError } from '../utils/ApiError';
import { logger } from '../config/logger';

export const initialize = asyncHandler(async (req: Request, res: Response) => {
  const payment = await paymentService.initializeForOrder(req.user!.id, req.params.orderNumber);
  return sendSuccess(res, { payment }, 'Payment initialized');
});

export const verify = asyncHandler(async (req: Request, res: Response) => {
  const result = await paymentService.verifyByReference(req.body.reference, req.user!.id);
  return sendSuccess(res, result, 'Payment verified');
});

/**
 * Paystack webhook. The raw body (Buffer) is required for HMAC signature
 * verification — the route registers express.raw() before this handler.
 * Returns 200 on success so Paystack stops retrying; 401 on a bad signature.
 */
export const webhook = asyncHandler(async (req: Request, res: Response) => {
  const signature = req.headers['x-paystack-signature'] as string | undefined;
  const raw = req.body as unknown;
  if (!Buffer.isBuffer(raw)) {
    throw ApiError.badRequest('Invalid webhook payload');
  }
  if (!verifyWebhookSignature(raw, signature)) {
    logger.warn('Rejected Paystack webhook with invalid signature');
    throw ApiError.unauthorized('Invalid signature');
  }

  let event: { event?: string; data?: Record<string, unknown> };
  try {
    event = JSON.parse(raw.toString('utf8'));
  } catch {
    throw ApiError.badRequest('Invalid JSON');
  }

  await paymentService.handleWebhookEvent(event);
  return res.status(200).json({ success: true, received: true });
});

/** DEV-ONLY: simulate a successful payment when Paystack is not configured. */
export const devComplete = asyncHandler(async (req: Request, res: Response) => {
  const order = await paymentService.devCompletePayment(req.body.reference);
  return sendSuccess(res, { order }, '[DEV] Payment completed');
});
