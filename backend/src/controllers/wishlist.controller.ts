import type { Request, Response } from 'express';
import * as wishlistService from '../services/wishlist.service';
import { asyncHandler } from '../utils/asyncHandler';
import { sendSuccess } from '../utils/apiResponse';

export const getWishlist = asyncHandler(async (req: Request, res: Response) => {
  const wishlist = await wishlistService.listWishlist(req.user!.id);
  return sendSuccess(res, wishlist, 'Wishlist fetched');
});

export const addItem = asyncHandler(async (req: Request, res: Response) => {
  const wishlist = await wishlistService.addItem(req.user!.id, req.params.productId);
  return sendSuccess(res, wishlist, 'Added to wishlist');
});

export const removeItem = asyncHandler(async (req: Request, res: Response) => {
  const wishlist = await wishlistService.removeItem(req.user!.id, req.params.productId);
  return sendSuccess(res, wishlist, 'Removed from wishlist');
});

export const moveToCart = asyncHandler(async (req: Request, res: Response) => {
  const result = await wishlistService.moveToCart(req.user!.id, req.params.productId);
  return sendSuccess(res, result, 'Moved to cart');
});
