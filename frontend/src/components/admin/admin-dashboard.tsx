'use client';

import Link from 'next/link';
import {
  TrendingUp,
  ShoppingBag,
  Users,
  Package,
  AlertTriangle,
  ArrowRight,
} from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { OrderStatusBadge } from '@/components/account/order-status-badge';
import { useAdminOverview } from '@/hooks/use-admin';
import { formatNaira, formatDate } from '@/lib/utils';

export function AdminDashboard() {
  const { data, isLoading } = useAdminOverview();

  if (isLoading || !data) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-9 w-48" />
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-28 rounded-2xl" />
          ))}
        </div>
        <Skeleton className="h-64 rounded-2xl" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-serif text-3xl font-semibold">Dashboard</h1>
        <p className="mt-1 text-muted-foreground">Overview of your store&apos;s performance.</p>
      </div>

      {/* Revenue */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          icon={TrendingUp}
          label="Total revenue"
          value={formatNaira(data.revenue.total)}
          hint="Paid orders"
        />
        <StatCard icon={TrendingUp} label="Today" value={formatNaira(data.revenue.today)} />
        <StatCard icon={TrendingUp} label="Last 30 days" value={formatNaira(data.revenue.last30Days)} />
        <StatCard
          icon={TrendingUp}
          label="Avg. order value"
          value={formatNaira(data.revenue.averageOrderValue)}
        />
      </div>

      {/* Counts */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          icon={ShoppingBag}
          label="Orders"
          value={String(data.orders.total)}
          hint={`${data.orders.pending} pending · ${data.orders.awaitingFulfilment} to fulfil`}
          href="/admin/orders"
        />
        <StatCard icon={Users} label="Customers" value={String(data.customers.total)} href="/admin/customers" />
        <StatCard
          icon={Package}
          label="Products"
          value={String(data.products.total)}
          href="/admin/products"
        />
        <StatCard
          icon={AlertTriangle}
          label="Low stock"
          value={String(data.products.lowStock)}
          hint={data.products.lowStock > 0 ? 'Needs restock' : 'All healthy'}
          tone={data.products.lowStock > 0 ? 'warning' : 'default'}
          href="/admin/products"
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Recent orders */}
        <div className="rounded-2xl border bg-card p-5">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="font-serif text-lg font-semibold">Recent orders</h2>
            <Link href="/admin/orders" className="flex items-center gap-1 text-sm font-medium text-primary hover:underline">
              View all <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
          {data.recentOrders.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">No orders yet.</p>
          ) : (
            <ul className="divide-y">
              {data.recentOrders.map((order) => (
                <li key={order.id}>
                  <Link
                    href={`/admin/orders/${order.orderNumber}`}
                    className="flex items-center justify-between gap-3 py-3 first:pt-0 last:pb-0 hover:text-primary"
                  >
                    <div>
                      <p className="font-medium">{order.orderNumber}</p>
                      <p className="text-xs text-muted-foreground">{formatDate(order.placedAt)}</p>
                    </div>
                    <div className="flex items-center gap-3">
                      <OrderStatusBadge status={order.status} />
                      <span className="font-medium">{formatNaira(order.total)}</span>
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Top products */}
        <div className="rounded-2xl border bg-card p-5">
          <h2 className="mb-4 font-serif text-lg font-semibold">Top products</h2>
          {data.topProducts.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">No sales yet.</p>
          ) : (
            <ul className="divide-y">
              {data.topProducts.map((product, i) => (
                <li key={product.id} className="flex items-center justify-between gap-3 py-3 first:pt-0 last:pb-0">
                  <div className="flex items-center gap-3">
                    <span className="flex h-7 w-7 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary">
                      {i + 1}
                    </span>
                    <Link href={`/products/${product.slug}`} className="font-medium hover:text-primary">
                      {product.name}
                    </Link>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium">{product.salesCount} sold</p>
                    <p className="text-xs text-muted-foreground">{formatNaira(product.price)}</p>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}

function StatCard({
  icon: Icon,
  label,
  value,
  hint,
  href,
  tone = 'default',
}: {
  icon: typeof TrendingUp;
  label: string;
  value: string;
  hint?: string;
  href?: string;
  tone?: 'default' | 'warning';
}) {
  const content = (
    <div className="rounded-2xl border bg-card p-5 transition-shadow hover:shadow-md">
      <div className="flex items-center justify-between">
        <span className="text-sm text-muted-foreground">{label}</span>
        <Icon className={tone === 'warning' ? 'h-5 w-5 text-amber-500' : 'h-5 w-5 text-primary'} />
      </div>
      <p className="mt-2 font-serif text-2xl font-semibold">{value}</p>
      {hint && <p className="mt-1 text-xs text-muted-foreground">{hint}</p>}
    </div>
  );
  return href ? <Link href={href}>{content}</Link> : content;
}
