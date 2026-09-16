import { OrderStatus, Prisma, Role } from '@prisma/client';
import { prisma } from '../config/prisma';
import { ApiError } from '../utils/ApiError';
import { orderInclude, serializeOrderSummary } from '../serializers/order.serializer';

const REVENUE_STATES: OrderStatus[] = [
  OrderStatus.PAID,
  OrderStatus.PROCESSING,
  OrderStatus.SHIPPED,
  OrderStatus.DELIVERED,
];

function serializeCustomer(u: {
  id: string;
  email: string;
  fullName: string;
  phone: string | null;
  role: Role;
  isActive: boolean;
  emailVerified: boolean;
  createdAt: Date;
}) {
  return {
    id: u.id,
    email: u.email,
    fullName: u.fullName,
    phone: u.phone,
    role: u.role,
    isActive: u.isActive,
    emailVerified: u.emailVerified,
    joinedAt: u.createdAt,
  };
}

export async function listCustomers(opts: {
  page: number;
  limit: number;
  skip: number;
  q?: string;
  role?: Role;
}) {
  const where: Prisma.UserWhereInput = {};
  if (opts.role) where.role = opts.role;
  if (opts.q) {
    where.OR = [
      { email: { contains: opts.q, mode: 'insensitive' } },
      { fullName: { contains: opts.q, mode: 'insensitive' } },
      { phone: { contains: opts.q, mode: 'insensitive' } },
    ];
  }

  const [users, total] = await Promise.all([
    prisma.user.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip: opts.skip,
      take: opts.limit,
    }),
    prisma.user.count({ where }),
  ]);

  // Order count + lifetime spend for the listed users, in two grouped queries.
  const ids = users.map((u) => u.id);
  const [orderCounts, spend] = await Promise.all([
    prisma.order.groupBy({ by: ['userId'], where: { userId: { in: ids } }, _count: { _all: true } }),
    prisma.order.groupBy({
      by: ['userId'],
      where: { userId: { in: ids }, status: { in: REVENUE_STATES } },
      _sum: { total: true },
    }),
  ]);
  const countMap = new Map(orderCounts.map((r) => [r.userId, r._count._all]));
  const spendMap = new Map(spend.map((r) => [r.userId, r._sum.total ?? 0]));

  return {
    customers: users.map((u) => ({
      ...serializeCustomer(u),
      orderCount: countMap.get(u.id) ?? 0,
      totalSpent: spendMap.get(u.id) ?? 0,
    })),
    total,
  };
}

export async function getCustomer(id: string) {
  const user = await prisma.user.findUnique({
    where: { id },
    include: {
      _count: { select: { orders: true, addresses: true, reviews: true } },
    },
  });
  if (!user) throw ApiError.notFound('Customer not found');

  const [spend, orders] = await Promise.all([
    prisma.order.aggregate({
      where: { userId: id, status: { in: REVENUE_STATES } },
      _sum: { total: true },
    }),
    prisma.order.findMany({
      where: { userId: id },
      include: orderInclude,
      orderBy: { createdAt: 'desc' },
      take: 10,
    }),
  ]);

  return {
    ...serializeCustomer(user),
    stats: {
      orderCount: user._count.orders,
      addressCount: user._count.addresses,
      reviewCount: user._count.reviews,
      totalSpent: spend._sum.total ?? 0,
    },
    recentOrders: orders.map(serializeOrderSummary),
  };
}

/** Enable/disable a customer account. Admin accounts cannot be disabled here. */
export async function setActive(id: string, isActive: boolean) {
  const user = await prisma.user.findUnique({ where: { id } });
  if (!user) throw ApiError.notFound('Customer not found');
  if (user.role === Role.ADMIN) {
    throw ApiError.badRequest('Admin accounts cannot be modified here');
  }
  const updated = await prisma.user.update({ where: { id }, data: { isActive } });
  return serializeCustomer(updated);
}
