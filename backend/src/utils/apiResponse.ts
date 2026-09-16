import type { Response } from 'express';

/** Consistent success envelope: { success, message, data, meta? } */
export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
}

export function sendSuccess<T>(
  res: Response,
  data: T,
  message = 'OK',
  statusCode = 200,
  meta?: PaginationMeta,
): Response {
  return res.status(statusCode).json({
    success: true,
    message,
    data,
    ...(meta ? { meta } : {}),
  });
}

export function sendCreated<T>(res: Response, data: T, message = 'Created'): Response {
  return sendSuccess(res, data, message, 201);
}

export function buildPaginationMeta(page: number, limit: number, total: number): PaginationMeta {
  const totalPages = Math.max(1, Math.ceil(total / limit));
  return {
    page,
    limit,
    total,
    totalPages,
    hasNext: page < totalPages,
    hasPrev: page > 1,
  };
}
