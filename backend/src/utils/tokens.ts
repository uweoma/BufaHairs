import { randomBytes, randomInt } from 'crypto';

/**
 * Human-friendly, hard-to-guess order number, e.g. BUF-7F3K9Q2.
 * Uniqueness is additionally enforced by a DB unique constraint; callers
 * should retry on the rare collision.
 */
const ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // no ambiguous chars

export function generateOrderNumber(): string {
  let body = '';
  for (let i = 0; i < 7; i += 1) {
    body += ALPHABET[randomInt(0, ALPHABET.length)];
  }
  return `BUF-${body}`;
}

/** Random opaque token (used for email verification / password reset / refresh). */
export function generateToken(bytes = 32): string {
  return randomBytes(bytes).toString('hex');
}
