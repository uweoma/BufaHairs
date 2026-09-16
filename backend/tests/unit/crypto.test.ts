import { describe, it, expect } from 'vitest';
import { sha256 } from '../../src/utils/crypto';

describe('sha256', () => {
  it('matches the known digest for a fixed input', () => {
    // Reference SHA-256 of the ASCII string "abc".
    expect(sha256('abc')).toBe(
      'ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad',
    );
  });

  it('is deterministic and 64 hex chars long', () => {
    const a = sha256('refresh-token-value');
    const b = sha256('refresh-token-value');
    expect(a).toBe(b);
    expect(a).toMatch(/^[0-9a-f]{64}$/);
  });

  it('produces different digests for different inputs', () => {
    expect(sha256('a')).not.toBe(sha256('b'));
  });
});
