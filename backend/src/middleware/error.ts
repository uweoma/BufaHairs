import type { NextFunction, Request, Response } from 'express';
import { Prisma } from '@prisma/client';
import { ZodError } from 'zod';
import { ApiError, type FieldError } from '../utils/ApiError';
import { env } from '../config/env';
import { logger } from '../config/logger';

/** 404 for unmatched routes. */
export function notFoundHandler(req: Request, _res: Response, next: NextFunction) {
  next(ApiError.notFound(`Route not found: ${req.method} ${req.originalUrl}`));
}

/** Centralized error middleware — the single place errors become responses. */
// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function errorHandler(err: unknown, req: Request, res: Response, _next: NextFunction) {
  let statusCode = 500;
  let message = 'Something went wrong';
  let errors: FieldError[] = [];

  if (err instanceof ApiError) {
    statusCode = err.statusCode;
    message = err.message;
    errors = err.errors;
  } else if (err instanceof ZodError) {
    statusCode = 422;
    message = 'Validation failed';
    errors = err.errors.map((e) => ({ field: e.path.join('.') || 'body', message: e.message }));
  } else if (err instanceof Prisma.PrismaClientKnownRequestError) {
    switch (err.code) {
      case 'P2002': {
        statusCode = 409;
        const target = (err.meta?.target as string[] | undefined)?.join(', ') ?? 'field';
        message = `A record with this ${target} already exists`;
        break;
      }
      case 'P2025':
        statusCode = 404;
        message = 'Resource not found';
        break;
      case 'P2003':
        statusCode = 409;
        message = 'Related record constraint failed';
        break;
      default:
        statusCode = 400;
        message = 'Database request error';
    }
  } else if (err instanceof Prisma.PrismaClientValidationError) {
    statusCode = 400;
    message = 'Invalid database query';
  } else if (err instanceof Error && err.name === 'JsonWebTokenError') {
    statusCode = 401;
    message = 'Invalid token';
  }

  // Log server-side faults with full detail; never leak them to clients.
  if (statusCode >= 500) {
    logger.error(`${req.method} ${req.originalUrl}`, err);
  }

  const body: Record<string, unknown> = { success: false, message };
  if (errors.length) body.errors = errors;
  if (env.isDev && statusCode >= 500 && err instanceof Error) body.stack = err.stack;

  res.status(statusCode).json(body);
}
