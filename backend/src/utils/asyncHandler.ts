import type { NextFunction, Request, Response } from 'express';

type AsyncController = (req: Request, res: Response, next: NextFunction) => Promise<unknown>;

/** Wraps async controllers so rejected promises reach the error middleware. */
export const asyncHandler =
  (fn: AsyncController) => (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
