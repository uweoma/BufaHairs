import { describe, it, expect } from 'vitest';
import { generateOrderNumber, generateToken } from '../../src/utils/tokens';

describe('tokens', () => {
  it('generates a BUF-prefixed order number with 7 unambiguous chars', () => {
    const n = generateOrderNumber();
    expect(n).toMatch(/^BUF-[ABCDEFGHJKLMNPQRSTUVWXYZ23456789]{7}$/);
  });

  it('avoids ambiguous characters (0/O/1/I) in order numbers', () => {
    const body = generateOrderNumber().slice(4);
    expect(body).not.toMatch(/[01OI]/);
  });

  it('produces distinct order numbers across many draws', () => {
    const set = new Set(Array.from({ length: 500 }, () => generateOrderNumber()));
    expect(set.size).toBeGreaterThan(495); // effectively no collisions
  });

  it('generateToken returns a hex string of the requested byte length', () => {
    expect(generateToken(32)).toMatch(/^[0-9a-f]{64}$/);
    expect(generateToken(16)).toHaveLength(32);
    expect(generateToken()).toHaveLength(64); // default 32 bytes
  });
});
