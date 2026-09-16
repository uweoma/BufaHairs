import type { Request } from 'express';

export interface PaginationParams {
  page: number;
  limit: number;
  skip: number;
}

/** Parses ?page & ?limit with sane bounds. */
export function getPagination(req: Request, defaultLimit = 12, maxLimit = 60): PaginationParams {
  const page = Math.max(1, Number.parseInt(String(req.query.page ?? '1'), 10) || 1);
  const rawLimit = Number.parseInt(String(req.query.limit ?? defaultLimit), 10) || defaultLimit;
  const limit = Math.min(maxLimit, Math.max(1, rawLimit));
  return { page, limit, skip: (page - 1) * limit };
}
