import { createHmac, timingSafeEqual } from 'crypto';
import { env } from '../../config/env';
import { logger } from '../../config/logger';
import { ApiError } from '../../utils/ApiError';

const PAYSTACK_BASE_URL = 'https://api.paystack.co';

export const paystackEnabled = env.paystackEnabled;

interface InitializeParams {
  email: string;
  amountKobo: number;
  reference: string;
  callbackUrl?: string;
  metadata?: Record<string, unknown>;
}

export interface InitializeResult {
  authorizationUrl: string;
  accessCode: string;
  reference: string;
}

export interface VerifyResult {
  status: string; // 'success' | 'failed' | 'abandoned' | ...
  amount: number; // kobo
  currency: string;
  channel: string | null;
  reference: string;
  gatewayResponse: string | null;
  paidAt: Date | null;
  raw: unknown;
}

async function paystackFetch<T>(path: string, init: RequestInit): Promise<T> {
  if (!paystackEnabled) {
    throw new ApiError(503, 'Payment provider is not configured');
  }
  let res: Response;
  try {
    res = await fetch(`${PAYSTACK_BASE_URL}${path}`, {
      ...init,
      headers: {
        Authorization: `Bearer ${env.PAYSTACK_SECRET_KEY}`,
        'Content-Type': 'application/json',
        ...(init.headers ?? {}),
      },
    });
  } catch (err) {
    logger.error('Paystack request failed', err);
    throw new ApiError(502, 'Could not reach the payment provider. Please try again.');
  }

  const body = (await res.json().catch(() => ({}))) as { status?: boolean; message?: string; data?: T };
  if (!res.ok || !body.status) {
    logger.error('Paystack API error', { path, status: res.status, message: body.message });
    throw new ApiError(502, body.message || 'Payment provider returned an error');
  }
  return body.data as T;
}

export async function initializeTransaction(params: InitializeParams): Promise<InitializeResult> {
  const data = await paystackFetch<{
    authorization_url: string;
    access_code: string;
    reference: string;
  }>('/transaction/initialize', {
    method: 'POST',
    body: JSON.stringify({
      email: params.email,
      amount: params.amountKobo, // Paystack NGN amount is in kobo
      reference: params.reference,
      currency: 'NGN',
      callback_url: params.callbackUrl,
      metadata: params.metadata,
    }),
  });
  return {
    authorizationUrl: data.authorization_url,
    accessCode: data.access_code,
    reference: data.reference,
  };
}

export async function verifyTransaction(reference: string): Promise<VerifyResult> {
  const data = await paystackFetch<{
    status: string;
    amount: number;
    currency: string;
    channel: string | null;
    reference: string;
    gateway_response: string | null;
    paid_at: string | null;
  }>(`/transaction/verify/${encodeURIComponent(reference)}`, { method: 'GET' });

  return {
    status: data.status,
    amount: data.amount,
    currency: data.currency,
    channel: data.channel,
    reference: data.reference,
    gatewayResponse: data.gateway_response,
    paidAt: data.paid_at ? new Date(data.paid_at) : null,
    raw: data,
  };
}

/**
 * Verifies the Paystack webhook signature: HMAC-SHA512 of the RAW request body
 * keyed by the secret key, compared in constant time to the x-paystack-signature header.
 */
export function verifyWebhookSignature(rawBody: Buffer, signature?: string): boolean {
  if (!paystackEnabled || !signature) return false;
  const expected = createHmac('sha512', env.PAYSTACK_SECRET_KEY).update(rawBody).digest('hex');
  const a = Buffer.from(expected);
  const b = Buffer.from(signature);
  if (a.length !== b.length) return false;
  return timingSafeEqual(a, b);
}
