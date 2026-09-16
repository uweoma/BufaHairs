import type { Request, Response } from 'express';
import * as cartService from '../services/cart.service';
import { asyncHandler } from '../utils/asyncHandler';
import { sendSuccess } from '../utils/apiResponse';

export const getCart = asyncHandler(async (req: Request, res: Response) => {
  const cart = await cartService.getCart(req.user!.id);
  return sendSuccess(res, cart, 'Cart fetched');
});

export const addItem = asyncHandler(async (req: Request, res: Response) => {
  const cart = await cartService.addItem(req.user!.id, req.body);
  return sendSuccess(res, cart, 'Item added to cart');
});

export const updateItem = asyncHandler(async (req: Request, res: Response) => {
  const cart = await cartService.updateItem(req.user!.id, req.params.id, req.body.quantity);
  return sendSuccess(res, cart, 'Cart updated');
});

export const removeItem = asyncHandler(async (req: Request, res: Response) => {
  const cart = await cartService.removeItem(req.user!.id, req.params.id);
  return sendSuccess(res, cart, 'Item removed');
});

export const clearCart = asyncHandler(async (req: Request, res: Response) => {
  const cart = await cartService.clearCart(req.user!.id);
  return sendSuccess(res, cart, 'Cart cleared');
});

export const mergeCart = asyncHandler(async (req: Request, res: Response) => {
  const cart = await cartService.mergeGuestCart(req.user!.id, req.body);
  return sendSuccess(res, cart, 'Cart merged');
});
