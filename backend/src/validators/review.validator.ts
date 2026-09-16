import { z } from 'zod';

export const createReviewSchema = z.object({
  rating: z.coerce.number().int().min(1, 'Rating is required').max(5),
  title: z.string().trim().max(120).nullish(),
  comment: z.string().trim().min(3, 'Please write a short review').max(2000),
});

export const updateReviewSchema = z.object({
  rating: z.coerce.number().int().min(1).max(5).optional(),
  title: z.string().trim().max(120).nullish(),
  comment: z.string().trim().min(3).max(2000).optional(),
});

export const reviewIdParam = z.object({ id: z.string().uuid('Invalid review id') });
export const reviewSlugParam = z.object({ slug: z.string().trim().min(1).max(200) });

export type CreateReviewInput = z.infer<typeof createReviewSchema>;
export type UpdateReviewInput = z.infer<typeof updateReviewSchema>;
