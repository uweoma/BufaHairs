import type { Request, Response } from 'express';
import * as categoryService from '../services/category.service';
import { asyncHandler } from '../utils/asyncHandler';
import { sendSuccess, sendCreated } from '../utils/apiResponse';

export const list = asyncHandler(async (_req: Request, res: Response) => {
  const categories = await categoryService.listCategories();
  return sendSuccess(res, categories, 'Categories fetched');
});

export const getBySlug = asyncHandler(async (req: Request, res: Response) => {
  const category = await categoryService.getCategoryBySlug(req.params.slug);
  return sendSuccess(res, category, 'Category fetched');
});

export const create = asyncHandler(async (req: Request, res: Response) => {
  const category = await categoryService.createCategory(req.body);
  return sendCreated(res, category, 'Category created');
});

export const update = asyncHandler(async (req: Request, res: Response) => {
  const category = await categoryService.updateCategory(req.params.id, req.body);
  return sendSuccess(res, category, 'Category updated');
});

export const remove = asyncHandler(async (req: Request, res: Response) => {
  await categoryService.deleteCategory(req.params.id);
  return sendSuccess(res, null, 'Category deleted');
});
