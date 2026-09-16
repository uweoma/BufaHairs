import { createHash } from 'crypto';

/** One-way hash for storing opaque tokens (refresh, email, reset) at rest. */
export const sha256 = (value: string): string =>
  createHash('sha256').update(value).digest('hex');
