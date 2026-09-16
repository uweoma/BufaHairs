import type { NextFunction, Request, Response } from 'express';
import { ZodError, type ZodTypeAny } from 'zod';
import { ApiError } from '../utils/ApiError';

interface Schemas {
  body?: ZodTypeAny;
  query?: ZodTypeAny;
  params?: ZodTypeAny;
}

/**
 * Validation middleware. Parses and REPLACES req.body/query/params with the
 * typed, coerced result so controllers receive clean data. Throws a 422 with
 * per-field errors on failure.
 */
export const validate =
  (schemas: Schemas) => (req: Request, _res: Response, next: NextFunction) => {
    try {
      if (schemas.params) req.params = schemas.params.parse(req.params);
      if (schemas.query) {
        const parsed = schemas.query.parse(req.query);
        // req.query is a getter in Express 5-style; assign defensively.
        Object.defineProperty(req, 'query', { value: parsed, writable: true, configurable: true });
      }
      if (schemas.body) req.body = schemas.body.parse(req.body);
      next();
    } catch (err) {
      if (err instanceof ZodError) {
        const errors = err.errors.map((e) => ({
          field: e.path.join('.') || 'body',
          message: e.message,
        }));
        next(ApiError.unprocessable('Validation failed', errors));
        return;
      }
      next(err);
    }
  };
