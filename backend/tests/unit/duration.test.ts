import { describe, it, expect } from 'vitest';
import { parseDurationMs } from '../../src/utils/duration';

describe('parseDurationMs', () => {
  it('parses each supported unit', () => {
    expect(parseDurationMs('500ms')).toBe(500);
    expect(parseDurationMs('30s')).toBe(30_000);
    expect(parseDurationMs('15m')).toBe(900_000);
    expect(parseDurationMs('1h')).toBe(3_600_000);
    expect(parseDurationMs('7d')).toBe(604_800_000);
  });

  it('trims surrounding whitespace', () => {
    expect(parseDurationMs('  15m ')).toBe(900_000);
  });

  it('throws on malformed input', () => {
    expect(() => parseDurationMs('')).toThrow(/Invalid duration/);
    expect(() => parseDurationMs('15')).toThrow(/Invalid duration/);
    expect(() => parseDurationMs('abc')).toThrow(/Invalid duration/);
    expect(() => parseDurationMs('15y')).toThrow(/Invalid duration/);
  });
});
