import { describe, it, expect } from 'vitest';
import { evaluateCoupon, type CouponLine } from '../../src/services/coupon.service';

/**
 * evaluateCoupon is backend-authoritative but takes an injectable Prisma-like
 * client, so we can exercise the full discount + guard-rail logic against a
 * lightweight mock — no database required.
 */
function fakeClient(coupon: unknown, usedByUser = 0) {
  return {
    coupon: { findUnique: async () => coupon },
    couponUsage: { count: async () => usedByUser },
  } as any;
}

function makeCoupon(overrides: Record<string, unknown> = {}) {
  return {
    id: 'c1',
    code: 'SAVE10',
    description: '10% off',
    type: 'PERCENTAGE',
    value: 10,
    isActive: true,
    startsAt: null,
    expiresAt: null,
    usageLimit: null,
    usedCount: 0,
    perUserLimit: null,
    minOrderAmount: null,
    maxDiscount: null,
    applicableProducts: [] as { id: string }[],
    applicableCategories: [] as { id: string }[],
    ...overrides,
  };
}

const USER = 'u1';
const lines: CouponLine[] = [{ productId: 'p1', categoryId: 'cat1', lineTotal: 100_000 }];
const subtotal = 100_000; // ₦1,000

describe('evaluateCoupon — discount math', () => {
  it('computes a percentage discount on the full subtotal', async () => {
    const res = await evaluateCoupon('save10', USER, lines, subtotal, fakeClient(makeCoupon()));
    expect(res.discount).toBe(10_000);
    expect(res.eligibleSubtotal).toBe(100_000);
    expect(res.code).toBe('SAVE10');
    expect(res.type).toBe('PERCENTAGE');
  });

  it('caps a percentage discount at maxDiscount', async () => {
    const res = await evaluateCoupon(
      'save10',
      USER,
      lines,
      subtotal,
      fakeClient(makeCoupon({ value: 50, maxDiscount: 5_000 })),
    );
    expect(res.discount).toBe(5_000);
  });

  it('floors fractional percentage discounts (integer kobo)', async () => {
    const res = await evaluateCoupon(
      'save3',
      USER,
      [{ productId: 'p1', categoryId: null, lineTotal: 100_001 }],
      100_001,
      fakeClient(makeCoupon({ value: 3 })),
    );
    expect(res.discount).toBe(3_000); // floor(100001 * 3 / 100) = 3000
  });

  it('applies a fixed discount and never exceeds the subtotal', async () => {
    const cheap = await evaluateCoupon(
      'flat',
      USER,
      lines,
      subtotal,
      fakeClient(makeCoupon({ type: 'FIXED', value: 5_000 })),
    );
    expect(cheap.discount).toBe(5_000);

    const capped = await evaluateCoupon(
      'flat',
      USER,
      lines,
      subtotal,
      fakeClient(makeCoupon({ type: 'FIXED', value: 999_999 })),
    );
    expect(capped.discount).toBe(100_000);
  });

  it('scopes the discount to applicable products only', async () => {
    const mixed: CouponLine[] = [
      { productId: 'p1', categoryId: 'cat1', lineTotal: 60_000 },
      { productId: 'p2', categoryId: 'cat2', lineTotal: 40_000 },
    ];
    const res = await evaluateCoupon(
      'x',
      USER,
      mixed,
      100_000,
      fakeClient(makeCoupon({ value: 10, applicableProducts: [{ id: 'p1' }] })),
    );
    expect(res.eligibleSubtotal).toBe(60_000);
    expect(res.discount).toBe(6_000);
  });
});

describe('evaluateCoupon — guard rails', () => {
  const reject = (coupon: unknown, re: RegExp, usedByUser = 0) =>
    expect(
      evaluateCoupon('x', USER, lines, subtotal, fakeClient(coupon, usedByUser)),
    ).rejects.toThrow(re);

  it('rejects an unknown coupon', () => reject(null, /invalid or inactive/i));
  it('rejects an inactive coupon', () => reject(makeCoupon({ isActive: false }), /invalid or inactive/i));
  it('rejects a not-yet-active coupon', () =>
    reject(makeCoupon({ startsAt: new Date(Date.now() + 86_400_000) }), /not active yet/i));
  it('rejects an expired coupon', () =>
    reject(makeCoupon({ expiresAt: new Date(Date.now() - 86_400_000) }), /expired/i));
  it('rejects when the global usage limit is reached', () =>
    reject(makeCoupon({ usageLimit: 5, usedCount: 5 }), /usage limit/i));
  it('rejects when the per-user limit is reached', () =>
    reject(makeCoupon({ perUserLimit: 1 }), /already used/i, 1));
  it('rejects when subtotal is below the minimum', () =>
    reject(makeCoupon({ minOrderAmount: 200_000 }), /minimum/i));
  it('rejects a scoped coupon when nothing qualifies', () =>
    reject(makeCoupon({ applicableProducts: [{ id: 'zzz' }] }), /does not apply/i));
  it('rejects a coupon that yields no discount', () =>
    reject(makeCoupon({ type: 'FIXED', value: 0 }), /no discount/i));
});
