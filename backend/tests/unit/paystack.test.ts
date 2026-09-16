import { describe, it, expect } from 'vitest';
import { createHmac } from 'crypto';
import { verifyWebhookSignature } from '../../src/services/payment/paystack';

// Must match PAYSTACK_SECRET_KEY set in tests/setup.ts.
const SECRET = 'sk_test_dummy_secret';
const sign = (body: Buffer) => createHmac('sha512', SECRET).update(body).digest('hex');

describe('verifyWebhookSignature', () => {
  const body = Buffer.from(
    JSON.stringify({ event: 'charge.success', data: { reference: 'BUF-ABC1234' } }),
  );

  it('accepts a correctly signed payload', () => {
    expect(verifyWebhookSignature(body, sign(body))).toBe(true);
  });

  it('rejects a tampered body signed for a different payload', () => {
    const tampered = Buffer.from(
      JSON.stringify({ event: 'charge.success', data: { reference: 'BUF-EVIL999' } }),
    );
    expect(verifyWebhookSignature(tampered, sign(body))).toBe(false);
  });

  it('rejects a signature made with the wrong secret', () => {
    const forged = createHmac('sha512', 'not_the_secret').update(body).digest('hex');
    expect(verifyWebhookSignature(body, forged)).toBe(false);
  });

  it('rejects a garbage / wrong-length signature', () => {
    expect(verifyWebhookSignature(body, 'deadbeef')).toBe(false);
  });

  it('rejects a missing signature header', () => {
    expect(verifyWebhookSignature(body, undefined)).toBe(false);
  });
});
