import { prisma } from '../config/prisma';
import { ApiError } from '../utils/ApiError';

function serializeNotification(n: {
  id: string;
  type: string;
  title: string;
  message: string;
  data: unknown;
  isRead: boolean;
  createdAt: Date;
}) {
  return {
    id: n.id,
    type: n.type,
    title: n.title,
    message: n.message,
    data: n.data ?? null,
    isRead: n.isRead,
    createdAt: n.createdAt,
  };
}

export async function listNotifications(
  userId: string,
  opts: { page: number; limit: number; skip: number },
) {
  const [notifications, total, unreadCount] = await Promise.all([
    prisma.notification.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      skip: opts.skip,
      take: opts.limit,
    }),
    prisma.notification.count({ where: { userId } }),
    prisma.notification.count({ where: { userId, isRead: false } }),
  ]);
  return { notifications: notifications.map(serializeNotification), total, unreadCount };
}

export async function getUnreadCount(userId: string) {
  return prisma.notification.count({ where: { userId, isRead: false } });
}

export async function markRead(userId: string, id: string) {
  // Scope the update to the owner so users can't touch others' notifications.
  const result = await prisma.notification.updateMany({
    where: { id, userId },
    data: { isRead: true },
  });
  if (result.count === 0) throw ApiError.notFound('Notification not found');
}

export async function markAllRead(userId: string) {
  const result = await prisma.notification.updateMany({
    where: { userId, isRead: false },
    data: { isRead: true },
  });
  return { updated: result.count };
}
