import { Router } from 'express';
import * as couponController from '../controllers/coupon.controller';
import { validate } from '../middleware/validate';
import { authenticate } from '../middleware/auth';
import { validateCouponSchema } from '../validators/coupon.validator';

const router = Router();

// Validating a coupon needs the user's cart + per-user usage history.
router.post(
  '/validate',
  authenticate,
  validate({ body: validateCouponSchema }),
  couponController.validateCoupon,
);

export default router;
