import { Router } from 'express';
import * as reviewController from '../controllers/review.controller';
import { validate } from '../middleware/validate';
import { authenticate } from '../middleware/auth';
import {
  createReviewSchema,
  updateReviewSchema,
  reviewIdParam,
  reviewSlugParam,
} from '../validators/review.validator';

const router = Router();

// Public: list approved reviews + rating summary for a product.
router.get(
  '/product/:slug',
  validate({ params: reviewSlugParam }),
  reviewController.listForProduct,
);

// Authenticated: verified purchasers create; owners edit/delete their own review.
router.post(
  '/product/:slug',
  authenticate,
  validate({ params: reviewSlugParam, body: createReviewSchema }),
  reviewController.create,
);
router.patch(
  '/:id',
  authenticate,
  validate({ params: reviewIdParam, body: updateReviewSchema }),
  reviewController.update,
);
router.delete(
  '/:id',
  authenticate,
  validate({ params: reviewIdParam }),
  reviewController.remove,
);

export default router;
