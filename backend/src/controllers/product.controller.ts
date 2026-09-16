import type { Request, Response } from 'express';
import * as productService from '../services/product.service';
import { asyncHandler } from '../utils/asyncHandler';
import { sendSuccess, sendCreated, buildPaginationMeta } from '../utils/apiResponse';
import type { ProductListQuery } from '../validators/product.validator';

export const list = asyncHandler(async (req: Request, res: Response) => {
  const query = req.query as unknown as ProductListQuery;
  const { items, total } = await productService.listProducts(query);
  return sendSuccess(res, items, 'Products fetched', 200, buildPaginationMeta(query.page, query.limit, total));
});

export const getBySlug = asyncHandler(async (req: Request, res: Response) => {
  const product = await productService.getProductBySlug(req.params.slug);
  return sendSuccess(res, product, 'Product fetched');
});

export const getRelated = asyncHandler(async (req: Request, res: Response) => {
  const products = await productService.getRelatedProducts(req.params.slug);
  return sendSuccess(res, products, 'Related products fetched');
});

export const getByIds = asyncHandler(async (req: Request, res: Response) => {
  const ids: string[] = Array.isArray(req.body?.ids) ? req.body.ids.slice(0, 12) : [];
  const products = await productService.getProductsByIds(ids);
  return sendSuccess(res, products, 'Products fetched');
});

// --------------------------- Admin -----------------------------------------

export const create = asyncHandler(async (req: Request, res: Response) => {
  const product = await productService.createProduct(req.body);
  return sendCreated(res, product, 'Product created');
});

export const update = asyncHandler(async (req: Request, res: Response) => {
  const product = await productService.updateProduct(req.params.id, req.body);
  return sendSuccess(res, product, 'Product updated');
});

export const remove = asyncHandler(async (req: Request, res: Response) => {
  const result = await productService.deleteProduct(req.params.id);
  return sendSuccess(res, result, result.hardDeleted ? 'Product deleted' : 'Product archived');
});
