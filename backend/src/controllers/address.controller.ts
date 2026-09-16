import type { Request, Response } from 'express';
import * as addressService from '../services/address.service';
import { asyncHandler } from '../utils/asyncHandler';
import { sendSuccess, sendCreated } from '../utils/apiResponse';

export const list = asyncHandler(async (req: Request, res: Response) => {
  const addresses = await addressService.listAddresses(req.user!.id);
  return sendSuccess(res, { addresses }, 'Addresses fetched');
});

export const create = asyncHandler(async (req: Request, res: Response) => {
  const address = await addressService.createAddress(req.user!.id, req.body);
  return sendCreated(res, { address }, 'Address added');
});

export const update = asyncHandler(async (req: Request, res: Response) => {
  const address = await addressService.updateAddress(req.user!.id, req.params.id, req.body);
  return sendSuccess(res, { address }, 'Address updated');
});

export const setDefault = asyncHandler(async (req: Request, res: Response) => {
  const addresses = await addressService.setDefault(req.user!.id, req.params.id);
  return sendSuccess(res, { addresses }, 'Default address updated');
});

export const remove = asyncHandler(async (req: Request, res: Response) => {
  const addresses = await addressService.deleteAddress(req.user!.id, req.params.id);
  return sendSuccess(res, { addresses }, 'Address removed');
});
