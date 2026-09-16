import type { Request, Response } from 'express';
import * as couponService from '../services/coupon.service';
import { asyncHandler } from '../utils/asyncHandler';
import { sendSuccess } from '../utils/apiResponse';

export const validateCoupon = asyncHandler(async (req: Request, res: Response) => {
  const result = await couponService.validateForCart(req.user!.id, req.body.code);
  return sendSuccess(res, result, 'Coupon applied');
});
