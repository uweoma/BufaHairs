'use client';

import Link from 'next/link';
import { ArrowLeft, Users, Mail, Phone, ShieldCheck, ShieldOff } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { EmptyState } from '@/components/ui/empty-state';
import { OrderStatusBadge } from '@/components/account/order-status-badge';
import { useAdminCustomer, useSetCustomerActive } from '@/hooks/use-admin';
import { formatNaira, formatDate, initials } from '@/lib/utils';

export function AdminCustomerDetail({ id }: { id: string }) {
  const { data: customer, isLoading, isError } = useAdminCustomer(id);
  const setActive = useSetCustomerActive();

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-40" />
        <Skeleton className="h-48 rounded-2xl" />
      </div>
    );
  }

  if (isError || !customer) {
    return (
      <EmptyState
        icon={Users}
        title="Customer not found"
        description="This customer could not be loaded."
        action={
          <Button asChild>
            <Link href="/admin/customers">Back to customers</Link>
          </Button>
        }
      />
    );
  }

  const toggleActive = () => {
    setActive.mutate(
      { id: customer.id, isActive: !customer.isActive },
      {
        onSuccess: () => toast.success(customer.isActive ? 'Account disabled' : 'Account enabled'),
        onError: (err) => toast.error(err instanceof Error ? err.message : 'Could not update account'),
      },
    );
  };

  return (
    <div className="space-y-6">
      <Link href="/admin/customers" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="h-4 w-4" /> Back to customers
      </Link>

      <div className="rounded-2xl border bg-card p-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-primary/10 text-lg font-medium text-primary-deep">
              {initials(customer.fullName)}
            </div>
            <div>
              <h1 className="font-serif text-2xl font-semibold">{customer.fullName}</h1>
              <div className="mt-1 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted-foreground">
                <span className="flex items-center gap-1.5">
                  <Mail className="h-4 w-4" /> {customer.email}
                </span>
                {customer.phone && (
                  <span className="flex items-center gap-1.5">
                    <Phone className="h-4 w-4" /> {customer.phone}
                  </span>
                )}
              </div>
              <div className="mt-2 flex items-center gap-2">
                <span className="inline-flex rounded-full bg-secondary px-2.5 py-0.5 text-xs font-medium text-muted-foreground">
                  {customer.role === 'ADMIN' ? 'Admin' : 'Customer'}
                </span>
                <span
                  className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${
                    customer.isActive ? 'bg-emerald-100 text-emerald-700' : 'bg-muted text-muted-foreground'
                  }`}
                >
                  {customer.isActive ? 'Active' : 'Disabled'}
                </span>
                {customer.emailVerified && (
                  <span className="inline-flex rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-medium text-primary">
                    Verified
                  </span>
                )}
              </div>
            </div>
          </div>

          {customer.role !== 'ADMIN' && (
            <Button
              variant="outline"
              onClick={toggleActive}
              loading={setActive.isPending}
              className={customer.isActive ? 'text-destructive hover:bg-destructive/10 hover:text-destructive' : ''}
            >
              {customer.isActive ? (
                <>
                  <ShieldOff className="h-4 w-4" /> Disable account
                </>
              ) : (
                <>
                  <ShieldCheck className="h-4 w-4" /> Enable account
                </>
              )}
            </Button>
          )}
        </div>
      </div>

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-4">
        <Stat label="Orders" value={String(customer.orderCount)} />
        <Stat label="Total spent" value={formatNaira(customer.totalSpent)} />
        <Stat label="Addresses" value={String(customer.addressCount)} />
        <Stat label="Reviews" value={String(customer.reviewCount)} />
      </div>

      {/* Recent orders */}
      <div className="rounded-2xl border bg-card p-5">
        <h2 className="mb-4 font-serif text-lg font-semibold">Recent orders</h2>
        {customer.recentOrders.length === 0 ? (
          <p className="py-6 text-center text-sm text-muted-foreground">No orders yet.</p>
        ) : (
          <ul className="divide-y">
            {customer.recentOrders.map((order) => (
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
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border bg-card p-5">
      <p className="text-sm text-muted-foreground">{label}</p>
      <p className="mt-1 font-serif text-2xl font-semibold">{value}</p>
    </div>
  );
}
