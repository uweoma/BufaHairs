'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Package } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { EmptyState } from '@/components/ui/empty-state';
import { Pagination } from '@/components/ui/pagination';
import { OrderStatusBadge } from './order-status-badge';
import { useOrders } from '@/hooks/use-orders';
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
];

export function OrdersList() {
  const [page, setPage] = useState(1);
  const [filter, setFilter] = useState<OrderStatus | 'all'>('all');
  const query = useOrders({ page, status: filter === 'all' ? undefined : filter });

  const orders = query.data?.orders ?? [];
  const meta = query.data?.meta;

  return (
    <div className="space-y-6">
      <h1 className="font-serif text-3xl font-semibold">Your Orders</h1>

      {/* Status filters */}
      <div className="flex flex-wrap gap-2">
        {FILTERS.map((f) => (
          <button
            key={f.value}
            onClick={() => {
              setFilter(f.value);
              setPage(1);
            }}
            className={cn(
              'rounded-full border px-4 py-1.5 text-sm font-medium transition-colors',
              filter === f.value ? 'border-primary bg-primary text-primary-foreground' : 'hover:border-primary/40',
            )}
          >
            {f.label}
          </button>
        ))}
      </div>

      {query.isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-28 rounded-2xl" />
          ))}
        </div>
      ) : orders.length === 0 ? (
        <EmptyState
          icon={Package}
          title={filter === 'all' ? 'No orders yet' : 'No orders with this status'}
          description={filter === 'all' ? 'When you place an order, it will appear here.' : 'Try a different filter.'}
          action={
            filter === 'all' ? (
              <Button asChild>
                <Link href="/shop">Start Shopping</Link>
              </Button>
            ) : undefined
          }
        />
      ) : (
        <>
          <ul className="space-y-3">
            {orders.map((order) => (
              <li key={order.id}>
                <Link
                  href={`/account/orders/${order.orderNumber}`}
                  className="block rounded-2xl border bg-card p-5 transition-shadow hover:shadow-md"
                >
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <p className="font-medium">{order.orderNumber}</p>
                      <p className="text-sm text-muted-foreground">
                        Placed {formatDate(order.placedAt)} · {order.itemCount}{' '}
                        {order.itemCount === 1 ? 'item' : 'items'}
                      </p>
                    </div>
                    <OrderStatusBadge status={order.status} />
                  </div>
                  <div className="mt-3 flex items-center justify-between border-t pt-3">
                    <span className="text-sm text-muted-foreground">Total</span>
                    <span className="font-serif text-lg font-semibold">{formatNaira(order.total)}</span>
                  </div>
                </Link>
              </li>
            ))}
          </ul>

          {meta && (
            <div className="pt-2">
              <Pagination meta={meta} onPageChange={setPage} />
            </div>
          )}
        </>
      )}
    </div>
  );
}
