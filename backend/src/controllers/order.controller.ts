import type { Request, Response } from 'express';
import { OrderStatus } from '@prisma/client';
import * as orderService from '../services/order.service';
import * as paymentService from '../services/payment.service';
import { asyncHandler } from '../utils/asyncHandler';
import { sendSuccess, sendCreated, buildPaginationMeta } from '../utils/apiResponse';
import { getPagination } from '../utils/pagination';

export const create = asyncHandler(async (req: Request, res: Response) => {
  const order = await orderService.createOrder(req.user!.id, req.body);
  // Kick off payment initialization so the client gets an authorization URL.
  const payment = await paymentService.initializeForOrder(req.user!.id, order.orderNumber);
  return sendCreated(res, { order, payment }, 'Order placed');
});

export const list = asyncHandler(async (req: Request, res: Response) => {
  const { page, limit, skip } = getPagination(req, 10, 50);
  const status = req.query.status as OrderStatus | undefined;
  const { orders, total } = await orderService.listOrders(req.user!.id, { page, limit, skip, status });
  return sendSuccess(res, { orders }, 'Orders fetched', 200, buildPaginationMeta(page, limit, total));
});

export const getOne = asyncHandler(async (req: Request, res: Response) => {
  const order = await orderService.getOrderByNumber(req.user!.id, req.params.orderNumber);
  return sendSuccess(res, { order }, 'Order fetched');
});

export const cancel = asyncHandler(async (req: Request, res: Response) => {
  const order = await orderService.cancelOrder(req.user!.id, req.params.orderNumber);
  return sendSuccess(res, { order }, 'Order cancelled');
});
