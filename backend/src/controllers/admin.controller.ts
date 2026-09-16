import type { Request, Response } from 'express';
import { Role } from '@prisma/client';
import * as adminService from '../services/admin.service';
import * as adminOrderService from '../services/admin-order.service';
import * as adminCustomerService from '../services/admin-customer.service';
import * as productService from '../services/product.service';
import * as couponService from '../services/coupon.service';
import * as reviewService from '../services/review.service';
import * as uploadService from '../services/upload.service';
import { asyncHandler } from '../utils/asyncHandler';
import { sendSuccess, sendCreated, buildPaginationMeta } from '../utils/apiResponse';
import { getPagination } from '../utils/pagination';
import { ApiError } from '../utils/ApiError';
import type { AnalyticsQuery } from '../validators/admin.validator';

// ------------------------------- Dashboard ---------------------------------

export const overview = asyncHandler(async (_req: Request, res: Response) => {
  const data = await adminService.getOverview();
  return sendSuccess(res, data, 'Dashboard overview');
});

export const analytics = asyncHandler(async (req: Request, res: Response) => {
  const q = req.query as unknown as AnalyticsQuery;
  const to = q.to ?? new Date();
  const from = q.from ?? new Date(to.getTime() - 29 * 24 * 60 * 60 * 1000);
  const data = await adminService.getAnalytics({ from, to });
  return sendSuccess(res, data, 'Analytics');
});

// -------------------------------- Orders ------------------------------------

export const listOrders = asyncHandler(async (req: Request, res: Response) => {
  const { page, limit, skip } = getPagination(req, 20, 100);
  const { orders, total } = await adminOrderService.listOrders({
    page,
    limit,
    skip,
    status: req.query.status as never,
    q: req.query.q as string | undefined,
  });
  return sendSuccess(res, { orders }, 'Orders fetched', 200, buildPaginationMeta(page, limit, total));
});

export const getOrder = asyncHandler(async (req: Request, res: Response) => {
  const order = await adminOrderService.getOrder(req.params.orderNumber);
  return sendSuccess(res, { order }, 'Order fetched');
});

export const updateOrder = asyncHandler(async (req: Request, res: Response) => {
  const order = await adminOrderService.updateOrder(req.params.orderNumber, req.body);
  return sendSuccess(res, { order }, 'Order updated');
});

// ------------------------------- Customers ----------------------------------

export const listCustomers = asyncHandler(async (req: Request, res: Response) => {
  const { page, limit, skip } = getPagination(req, 20, 100);
  const { customers, total } = await adminCustomerService.listCustomers({
    page,
    limit,
    skip,
    q: req.query.q as string | undefined,
    role: req.query.role as Role | undefined,
  });
  return sendSuccess(res, { customers }, 'Customers fetched', 200, buildPaginationMeta(page, limit, total));
});

export const getCustomer = asyncHandler(async (req: Request, res: Response) => {
  const customer = await adminCustomerService.getCustomer(req.params.id);
  return sendSuccess(res, { customer }, 'Customer fetched');
});

export const setCustomerActive = asyncHandler(async (req: Request, res: Response) => {
  const customer = await adminCustomerService.setActive(req.params.id, req.body.isActive);
  return sendSuccess(res, { customer }, 'Customer updated');
});

// -------------------------------- Products ----------------------------------

export const listProducts = asyncHandler(async (req: Request, res: Response) => {
  const { page, limit } = getPagination(req, 20, 100);
  const query = req.query as unknown as { q?: string; includeDeleted?: boolean };
  const { items, total } = await productService.adminListProducts({
    page,
    limit,
    q: query.q,
    includeDeleted: query.includeDeleted ?? false,
  });
  return sendSuccess(res, { products: items }, 'Products fetched', 200, buildPaginationMeta(page, limit, total));
});

export const getProduct = asyncHandler(async (req: Request, res: Response) => {
  const product = await productService.getAdminProduct(req.params.id);
  return sendSuccess(res, { product }, 'Product fetched');
});

export const createProduct = asyncHandler(async (req: Request, res: Response) => {
  const product = await productService.createProduct(req.body);
  return sendCreated(res, { product }, 'Product created');
});

export const updateProduct = asyncHandler(async (req: Request, res: Response) => {
  const product = await productService.updateProduct(req.params.id, req.body);
  return sendSuccess(res, { product }, 'Product updated');
});

export const deleteProduct = asyncHandler(async (req: Request, res: Response) => {
  const result = await productService.deleteProduct(req.params.id);
  return sendSuccess(res, result, result.hardDeleted ? 'Product deleted' : 'Product archived');
});

// -------------------------------- Coupons -----------------------------------

export const listCoupons = asyncHandler(async (req: Request, res: Response) => {
  const { page, limit, skip } = getPagination(req, 20, 100);
  const { coupons, total } = await couponService.listCoupons({ page, limit, skip });
  return sendSuccess(res, { coupons }, 'Coupons fetched', 200, buildPaginationMeta(page, limit, total));
});

export const getCoupon = asyncHandler(async (req: Request, res: Response) => {
  const coupon = await couponService.getCoupon(req.params.id);
  return sendSuccess(res, { coupon }, 'Coupon fetched');
});

export const createCoupon = asyncHandler(async (req: Request, res: Response) => {
  const coupon = await couponService.createCoupon(req.body);
  return sendCreated(res, { coupon }, 'Coupon created');
});

export const updateCoupon = asyncHandler(async (req: Request, res: Response) => {
  const coupon = await couponService.updateCoupon(req.params.id, req.body);
  return sendSuccess(res, { coupon }, 'Coupon updated');
});

export const deleteCoupon = asyncHandler(async (req: Request, res: Response) => {
  const result = await couponService.deleteCoupon(req.params.id);
  return sendSuccess(res, result, result.deleted ? 'Coupon deleted' : 'Coupon deactivated');
});

// -------------------------------- Reviews -----------------------------------

export const listReviews = asyncHandler(async (req: Request, res: Response) => {
  const { page, limit, skip } = getPagination(req, 20, 100);
  const query = req.query as unknown as { approved?: boolean; productId?: string };
  const { reviews, total } = await reviewService.adminListReviews({
    page,
    limit,
    skip,
    approved: query.approved,
    productId: query.productId,
  });
  return sendSuccess(res, { reviews }, 'Reviews fetched', 200, buildPaginationMeta(page, limit, total));
});

export const moderateReview = asyncHandler(async (req: Request, res: Response) => {
  const review = await reviewService.setApproval(req.params.id, req.body.isApproved);
  return sendSuccess(res, { review }, 'Review updated');
});

export const deleteReview = asyncHandler(async (req: Request, res: Response) => {
  await reviewService.adminDeleteReview(req.params.id);
  return sendSuccess(res, null, 'Review removed');
});

// -------------------------------- Uploads -----------------------------------

export const uploadProductImages = asyncHandler(async (req: Request, res: Response) => {
  const files = (req.files as Express.Multer.File[] | undefined) ?? [];
  if (files.length === 0) throw ApiError.badRequest('No image files provided');
  const images = await Promise.all(files.map((f) => uploadService.uploadImage(f)));
  return sendCreated(res, { images }, 'Images uploaded');
});
