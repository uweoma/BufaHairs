import type { Request, Response } from 'express';
import * as notificationService from '../services/notification.service';
import { asyncHandler } from '../utils/asyncHandler';
import { sendSuccess, buildPaginationMeta } from '../utils/apiResponse';
import { getPagination } from '../utils/pagination';

export const list = asyncHandler(async (req: Request, res: Response) => {
  const { page, limit, skip } = getPagination(req, 20, 50);
  const { notifications, total, unreadCount } = await notificationService.listNotifications(
    req.user!.id,
    { page, limit, skip },
  );
  return sendSuccess(
    res,
    { notifications, unreadCount },
    'Notifications fetched',
    200,
    buildPaginationMeta(page, limit, total),
  );
});

export const unreadCount = asyncHandler(async (req: Request, res: Response) => {
  const count = await notificationService.getUnreadCount(req.user!.id);
  return sendSuccess(res, { unreadCount: count }, 'Unread count');
});

export const markRead = asyncHandler(async (req: Request, res: Response) => {
  await notificationService.markRead(req.user!.id, req.params.id);
  return sendSuccess(res, null, 'Notification marked read');
});

export const markAllRead = asyncHandler(async (req: Request, res: Response) => {
  const result = await notificationService.markAllRead(req.user!.id);
  return sendSuccess(res, result, 'All notifications marked read');
});
