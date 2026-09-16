import type { Request, Response } from 'express';
import * as newsletterService from '../services/newsletter.service';
import { asyncHandler } from '../utils/asyncHandler';
import { sendSuccess } from '../utils/apiResponse';

export const subscribe = asyncHandler(async (req: Request, res: Response) => {
  await newsletterService.subscribe(req.body.email);
  // Deliberately generic — do not disclose prior subscription state.
  return sendSuccess(res, null, "You're subscribed! Watch your inbox for exclusive offers. 💜");
});

export const unsubscribe = asyncHandler(async (req: Request, res: Response) => {
  await newsletterService.unsubscribe(req.body.email);
  return sendSuccess(res, null, "You've been unsubscribed.");
});
