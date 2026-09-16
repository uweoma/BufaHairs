import type { CookieOptions } from 'express';
import { env } from './env';
import { parseDurationMs } from '../utils/duration';

export const REFRESH_COOKIE = 'refreshToken';

/**
 * Refresh token is delivered as an httpOnly cookie scoped to the auth routes,
 * so it is never exposed to JS and only sent where it is needed.
 */
export function refreshCookieOptions(): CookieOptions {
  return {
    httpOnly: true,
    secure: env.isProd,
    sameSite: env.isProd ? 'none' : 'lax',
    domain: env.COOKIE_DOMAIN,
    path: '/api/auth',
    maxAge: parseDurationMs(env.JWT_REFRESH_EXPIRES_IN),
  };
}

/** Options used when clearing the cookie (must match attributes except maxAge). */
export function clearRefreshCookieOptions(): CookieOptions {
  const { maxAge: _maxAge, ...rest } = refreshCookieOptions();
  return rest;
}
