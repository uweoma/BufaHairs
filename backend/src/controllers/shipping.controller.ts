import type { Request, Response } from 'express';
import * as shippingService from '../services/shipping.service';
import { asyncHandler } from '../utils/asyncHandler';
import { sendSuccess } from '../utils/apiResponse';

export const getZones = asyncHandler(async (_req: Request, res: Response) => {
  const zones = await shippingService.listZones();
  return sendSuccess(res, { zones }, 'Shipping zones fetched');
});

export const getQuote = asyncHandler(async (req: Request, res: Response) => {
  const quote = await shippingService.quote(req.body);
  return sendSuccess(res, quote, 'Shipping quote');
});
