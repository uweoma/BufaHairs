import type { Request, Response } from 'express';
import * as reviewService from '../services/review.service';
import { asyncHandler } from '../utils/asyncHandler';
import { sendSuccess, sendCreated, buildPaginationMeta } from '../utils/apiResponse';
import { getPagination } from '../utils/pagination';

export const listForProduct = asyncHandler(async (req: Request, res: Response) => {
  const { page, limit, skip } = getPagination(req, 10, 50);
  const { reviews, summary } = await reviewService.listProductReviews(req.params.slug, {
    page,
    limit,
    skip,
  });
  return sendSuccess(
    res,
    { reviews, summary },
    'Reviews fetched',
    200,
    buildPaginationMeta(page, limit, summary.total),
  );
});

export const create = asyncHandler(async (req: Request, res: Response) => {
  const review = await reviewService.createReview(req.user!.id, req.params.slug, req.body);
  return sendCreated(res, { review }, 'Review submitted');
});

export const update = asyncHandler(async (req: Request, res: Response) => {
  const review = await reviewService.updateReview(req.user!.id, req.params.id, req.body);
  return sendSuccess(res, { review }, 'Review updated');
});

export const remove = asyncHandler(async (req: Request, res: Response) => {
  await reviewService.deleteReview(req.user!.id, req.params.id);
  return sendSuccess(res, null, 'Review removed');
});
