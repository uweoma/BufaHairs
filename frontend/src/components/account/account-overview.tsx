'use client';

import Link from 'next/link';
import { Package, Heart, MapPin, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { EmptyState } from '@/components/ui/empty-state';
import { OrderStatusBadge } from './order-status-badge';
import { useAuth } from '@/hooks/use-auth';
import { useOrders } from '@/hooks/use-orders';
import { useWishlist } from '@/hooks/use-wishlist';
import { formatNaira, formatDate } from '@/lib/utils';

export function AccountOverview() {
  const { user } = useAuth();
  const ordersQuery = useOrders({ page: 1 });
  const { count: wishlistCount } = useWishlist();

  const orders = ordersQuery.data?.orders ?? [];
  const recent = orders.slice(0, 3);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-serif text-3xl font-semibold">
          Welcome back, {user?.fullName.split(' ')[0]}
        </h1>
        <p className="mt-1 text-muted-foreground">Manage your orders, addresses and preferences.</p>
      </div>

      {/* Quick tiles */}
      <div className="grid gap-4 sm:grid-cols-3">
        <Link href="/account/orders" className="rounded-2xl border bg-card p-5 transition-shadow hover:shadow-md">
          <Package className="h-6 w-6 text-primary" />
          <p className="mt-3 text-2xl font-semibold">{ordersQuery.data?.meta?.total ?? orders.length}</p>
          <p className="text-sm text-muted-foreground">Orders</p>
        </Link>
        <Link href="/wishlist" className="rounded-2xl border bg-card p-5 transition-shadow hover:shadow-md">
          <Heart className="h-6 w-6 text-primary" />
          <p className="mt-3 text-2xl font-semibold">{wishlistCount}</p>
          <p className="text-sm text-muted-foreground">Wishlist items</p>
        </Link>
        <Link href="/account/addresses" className="rounded-2xl border bg-card p-5 transition-shadow hover:shadow-md">
          <MapPin className="h-6 w-6 text-primary" />
          <p className="mt-3 text-sm font-medium">Manage</p>
          <p className="text-sm text-muted-foreground">Delivery addresses</p>
        </Link>
      </div>

      {/* Recent orders */}
      <div>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="font-serif text-xl font-semibold">Recent Orders</h2>
          {orders.length > 0 && (
            <Link href="/account/orders" className="flex items-center gap-1 text-sm font-medium text-primary hover:underline">
              View all <ArrowRight className="h-4 w-4" />
            </Link>
          )}
        </div>

        {ordersQuery.isLoading ? (
          <div className="space-y-3">
            <Skeleton className="h-20 rounded-2xl" />
            <Skeleton className="h-20 rounded-2xl" />
          </div>
        ) : recent.length === 0 ? (
          <EmptyState
            icon={Package}
            title="No orders yet"
            description="When you place an order, it will appear here."
            action={
              <Button asChild>
                <Link href="/shop">Start Shopping</Link>
              </Button>
            }
          />
        ) : (
          <ul className="space-y-3">
            {recent.map((order) => (
              <li key={order.id}>
                <Link
                  href={`/account/orders/${order.orderNumber}`}
                  className="flex items-center justify-between gap-4 rounded-2xl border bg-card p-4 transition-shadow hover:shadow-md"
                >
                  <div>
                    <p className="font-medium">{order.orderNumber}</p>
                    <p className="text-sm text-muted-foreground">
                      {formatDate(order.placedAt)} · {order.itemCount} {order.itemCount === 1 ? 'item' : 'items'}
                    </p>
                  </div>
                  <div className="flex items-center gap-4">
                    <OrderStatusBadge status={order.status} />
                    <span className="font-semibold">{formatNaira(order.total)}</span>
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
