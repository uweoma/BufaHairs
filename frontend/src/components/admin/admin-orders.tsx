'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Search, ShoppingBag } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { EmptyState } from '@/components/ui/empty-state';
import { Pagination } from '@/components/ui/pagination';
import { OrderStatusBadge, PaymentStatusBadge } from '@/components/account/order-status-badge';
import { useAdminOrders } from '@/hooks/use-admin';
import { formatNaira, formatDate, cn } from '@/lib/utils';
import type { OrderStatus } from '@/lib/types';

const FILTERS: { value: OrderStatus | 'all'; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'PENDING', label: 'Pending' },
  { value: 'PAID', label: 'Paid' },
  { value: 'PROCESSING', label: 'Processing' },
  { value: 'SHIPPED', label: 'Shipped' },
  { value: 'DELIVERED', label: 'Delivered' },
  { value: 'CANCELLED', label: 'Cancelled' },
  { value: 'REFUNDED', label: 'Refunded' },
];

export function AdminOrders() {
  const [page, setPage] = useState(1);
  const [status, setStatus] = useState<OrderStatus | 'all'>('all');
  const [search, setSearch] = useState('');
  const [q, setQ] = useState('');

  const query = useAdminOrders({ page, status, q: q || undefined });
  const orders = query.data?.orders ?? [];
  const meta = query.data?.meta;

  return (
    <div className="space-y-6">
      <h1 className="font-serif text-3xl font-semibold">Orders</h1>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          setQ(search.trim());
          setPage(1);
        }}
        className="relative max-w-md"
      >
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search order #, name, email, phone"
          className="pl-9"
        />
      </form>

      <div className="flex flex-wrap gap-2">
        {FILTERS.map((f) => (
          <button
            key={f.value}
            onClick={() => {
              setStatus(f.value);
              setPage(1);
            }}
            className={cn(
              'rounded-full border px-4 py-1.5 text-sm font-medium transition-colors',
              status === f.value ? 'border-primary bg-primary text-primary-foreground' : 'hover:border-primary/40',
            )}
          >
            {f.label}
          </button>
        ))}
      </div>

      {query.isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-20 rounded-xl" />
          ))}
        </div>
      ) : orders.length === 0 ? (
        <EmptyState icon={ShoppingBag} title="No orders found" description="Try a different search or filter." />
      ) : (
        <>
          <div className="overflow-hidden rounded-2xl border">
            <table className="w-full text-sm">
              <thead className="bg-secondary/50 text-left text-xs uppercase tracking-wide text-muted-foreground">
                <tr>
                  <th className="px-4 py-3 font-medium">Order</th>
                  <th className="px-4 py-3 font-medium">Date</th>
                  <th className="px-4 py-3 font-medium">Items</th>
                  <th className="px-4 py-3 font-medium">Payment</th>
                  <th className="px-4 py-3 font-medium">Status</th>
                  <th className="px-4 py-3 text-right font-medium">Total</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {orders.map((order) => (
                  <tr key={order.id} className="transition-colors hover:bg-secondary/30">
                    <td className="px-4 py-3">
                      <Link href={`/admin/orders/${order.orderNumber}`} className="font-medium text-primary hover:underline">
                        {order.orderNumber}
                      </Link>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">{formatDate(order.placedAt)}</td>
                    <td className="px-4 py-3 text-muted-foreground">{order.itemCount}</td>
                    <td className="px-4 py-3">
                      {order.paymentStatus ? <PaymentStatusBadge status={order.paymentStatus} /> : '—'}
                    </td>
                    <td className="px-4 py-3">
                      <OrderStatusBadge status={order.status} />
                    </td>
                    <td className="px-4 py-3 text-right font-medium">{formatNaira(order.total)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {meta && <Pagination meta={meta} onPageChange={setPage} />}
        </>
      )}
    </div>
  );
}
