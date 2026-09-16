import { OrderStatus, Prisma, Role } from '@prisma/client';
import { prisma } from '../config/prisma';
import { orderInclude, serializeOrderSummary } from '../serializers/order.serializer';

/** Order states that represent captured revenue (payment succeeded). */
const REVENUE_STATES: OrderStatus[] = [
  OrderStatus.PAID,
  OrderStatus.PROCESSING,
  OrderStatus.SHIPPED,
  OrderStatus.DELIVERED,
];

function startOfToday(): Date {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
}

function daysAgo(n: number): Date {
  const d = startOfToday();
  d.setDate(d.getDate() - n);
  return d;
}

/** Dashboard KPIs + recent activity for the admin home. */
export async function getOverview() {
  const [
    revenueAll,
    revenueToday,
    revenue30,
    ordersTotal,
    grouped,
    customers,
    productsTotal,
    lowStockRows,
    recent,
    top,
  ] = await Promise.all([
    prisma.order.aggregate({ where: { status: { in: REVENUE_STATES } }, _sum: { total: true } }),
    prisma.order.aggregate({
      where: { status: { in: REVENUE_STATES }, paidAt: { gte: startOfToday() } },
      _sum: { total: true },
    }),
    prisma.order.aggregate({
      where: { status: { in: REVENUE_STATES }, paidAt: { gte: daysAgo(30) } },
      _sum: { total: true },
    }),
    prisma.order.count(),
    prisma.order.groupBy({ by: ['status'], _count: { _all: true } }),
    prisma.user.count({ where: { role: Role.CUSTOMER } }),
    prisma.product.count({ where: { isActive: true, deletedAt: null } }),
    prisma.$queryRaw<Array<{ count: bigint }>>(
      Prisma.sql`SELECT COUNT(*)::bigint AS count FROM "Product"
                 WHERE "isActive" = true AND "deletedAt" IS NULL AND stock <= "lowStockAt"`,
    ),
    prisma.order.findMany({ include: orderInclude, orderBy: { createdAt: 'desc' }, take: 8 }),
    prisma.product.findMany({
      where: { isActive: true, deletedAt: null },
      orderBy: { salesCount: 'desc' },
      take: 5,
      select: { id: true, name: true, slug: true, salesCount: true, price: true, stock: true },
    }),
  ]);

  const ordersByStatus: Record<string, number> = {};
  for (const g of grouped) ordersByStatus[g.status] = g._count._all;

  const paidOrderCount = REVENUE_STATES.reduce((sum, s) => sum + (ordersByStatus[s] ?? 0), 0);
  const revenueTotal = revenueAll._sum.total ?? 0;

  return {
    revenue: {
      total: revenueTotal,
      today: revenueToday._sum.total ?? 0,
      last30Days: revenue30._sum.total ?? 0,
      averageOrderValue: paidOrderCount > 0 ? Math.round(revenueTotal / paidOrderCount) : 0,
    },
    orders: {
      total: ordersTotal,
      byStatus: ordersByStatus,
      pending: ordersByStatus[OrderStatus.PENDING] ?? 0,
      awaitingFulfilment:
        (ordersByStatus[OrderStatus.PAID] ?? 0) + (ordersByStatus[OrderStatus.PROCESSING] ?? 0),
    },
    customers: { total: customers },
    products: {
      total: productsTotal,
      lowStock: Number(lowStockRows[0]?.count ?? 0),
    },
    recentOrders: recent.map(serializeOrderSummary),
    topProducts: top,
  };
}

interface AnalyticsRange {
  from: Date;
  to: Date;
}

interface DailyRow {
  day: Date;
  revenue: bigint;
  orders: bigint;
}

/** Time-series revenue + orders for the admin analytics charts. */
export async function getAnalytics({ from, to }: AnalyticsRange) {
  // Inclusive of the whole `to` day.
  const toExclusive = new Date(to);
  toExclusive.setDate(toExclusive.getDate() + 1);

  const [series, summary, newCustomers, topProducts] = await Promise.all([
    prisma.$queryRaw<DailyRow[]>(
      Prisma.sql`
        SELECT date_trunc('day', "paidAt") AS day,
               COALESCE(SUM(total), 0)::bigint AS revenue,
               COUNT(*)::bigint AS orders
        FROM "Order"
        WHERE "paidAt" IS NOT NULL
          AND "paidAt" >= ${from}
          AND "paidAt" < ${toExclusive}
          AND status IN ('PAID','PROCESSING','SHIPPED','DELIVERED')
        GROUP BY 1
        ORDER BY 1 ASC`,
    ),
    prisma.order.aggregate({
      where: { status: { in: REVENUE_STATES }, paidAt: { gte: from, lt: toExclusive } },
      _sum: { total: true },
      _count: { _all: true },
    }),
    prisma.user.count({
      where: { role: Role.CUSTOMER, createdAt: { gte: from, lt: toExclusive } },
    }),
    prisma.$queryRaw<Array<{ id: string; name: string; slug: string; units: bigint; revenue: bigint }>>(
      Prisma.sql`
        SELECT p.id, p.name, p.slug,
               COALESCE(SUM(oi.quantity), 0)::bigint AS units,
               COALESCE(SUM(oi."lineTotal"), 0)::bigint AS revenue
        FROM "OrderItem" oi
        JOIN "Order" o ON o.id = oi."orderId"
        JOIN "Product" p ON p.id = oi."productId"
        WHERE o."paidAt" IS NOT NULL
          AND o."paidAt" >= ${from}
          AND o."paidAt" < ${toExclusive}
          AND o.status IN ('PAID','PROCESSING','SHIPPED','DELIVERED')
        GROUP BY p.id, p.name, p.slug
        ORDER BY units DESC
        LIMIT 8`,
    ),
  ]);

  const totalRevenue = summary._sum.total ?? 0;
  const totalOrders = summary._count._all;

  return {
    range: { from, to },
    summary: {
      totalRevenue,
      totalOrders,
      averageOrderValue: totalOrders > 0 ? Math.round(totalRevenue / totalOrders) : 0,
      newCustomers,
    },
    series: series.map((r) => ({
      date: r.day,
      revenue: Number(r.revenue),
      orders: Number(r.orders),
    })),
    topProducts: topProducts.map((p) => ({
      id: p.id,
      name: p.name,
      slug: p.slug,
      units: Number(p.units),
      revenue: Number(p.revenue),
    })),
  };
}
