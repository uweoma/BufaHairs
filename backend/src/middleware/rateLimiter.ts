import rateLimit from 'express-rate-limit';
import { ApiError } from '../utils/ApiError';

const handler = () => {
  throw ApiError.tooMany('Too many requests, please try again later.');
};

/** Generous global limiter for the whole API. */
export const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 600,
  standardHeaders: true,
  legacyHeaders: false,
  handler,
});

/** Strict limiter for auth endpoints (brute-force protection). */
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: true,
  handler,
});

/** Very strict limiter for password reset / email dispatch. */
export const sensitiveLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  handler,
});
