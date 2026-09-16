import { describe, it, expect } from 'vitest';
import { nairaToKobo, koboToNaira, formatNaira, KOBO_PER_NAIRA } from '../../src/utils/money';

describe('money', () => {
  it('converts naira to integer kobo', () => {
    expect(nairaToKobo(1)).toBe(100);
    expect(nairaToKobo(1500)).toBe(150000);
    expect(KOBO_PER_NAIRA).toBe(100);
  });

  it('rounds to the nearest kobo (no float drift)', () => {
    expect(nairaToKobo(19.99)).toBe(1999);
    expect(nairaToKobo(0.1)).toBe(10);
    // 0.1 * 100 = 10.000000000000002 in float — Math.round protects us.
    expect(Number.isInteger(nairaToKobo(0.1))).toBe(true);
  });

  it('round-trips naira -> kobo -> naira', () => {
    expect(koboToNaira(nairaToKobo(2500))).toBe(2500);
  });

  it('formats kobo as an NGN currency string', () => {
    const formatted = formatNaira(150000); // ₦1,500
    expect(formatted).toContain('1,500');
    // Intl may emit ₦ or NGN depending on ICU; assert the number is present.
    expect(formatted).toMatch(/₦|NGN/);
  });
});
