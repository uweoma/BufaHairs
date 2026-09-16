'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { ArrowLeft, Package, Save, MapPin, CreditCard, User } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import { EmptyState } from '@/components/ui/empty-state';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { OrderStatusBadge, PaymentStatusBadge } from '@/components/account/order-status-badge';
import { useAdminOrder, useUpdateOrder } from '@/hooks/use-admin';
import { formatNaira, formatDateTime } from '@/lib/utils';
import { ORDER_STATUS_META } from '@/lib/constants';
import type { OrderStatus } from '@/lib/types';

// Mirror of the backend transition map (server still enforces).
const TRANSITIONS: Record<OrderStatus, OrderStatus[]> = {
  PENDING: ['CANCELLED'],
  PAID: ['PROCESSING', 'SHIPPED', 'CANCELLED', 'REFUNDED'],
  PROCESSING: ['SHIPPED', 'CANCELLED', 'REFUNDED'],
  SHIPPED: ['DELIVERED', 'REFUNDED'],
  DELIVERED: ['REFUNDED'],
  CANCELLED: [],
  REFUNDED: [],
};

export function AdminOrderDetail({ orderNumber }: { orderNumber: string }) {
  const { data: order, isLoading, isError } = useAdminOrder(orderNumber);
  const updateMutation = useUpdateOrder();

  const [nextStatus, setNextStatus] = useState<OrderStatus | ''>('');
  const [tracking, setTracking] = useState<string | null>(null);
  const [note, setNote] = useState('');

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-40" />
        <Skeleton className="h-60 rounded-2xl" />
      </div>
    );
  }

  if (isError || !order) {
    return (
      <EmptyState
        icon={Package}
        title="Order not found"
        description="This order could not be loaded."
        action={
          <Button asChild>
            <Link href="/admin/orders">Back to orders</Link>
          </Button>
        }
      />
    );
  }

  const trackingValue = tracking ?? order.trackingNumber ?? '';
  const allowed = TRANSITIONS[order.status] ?? [];
  const trackingChanged = trackingValue !== (order.trackingNumber ?? '');
  const statusChanged = nextStatus !== '' && nextStatus !== order.status;
  const hasChanges = statusChanged || trackingChanged || note.trim().length > 0;

  const handleSave = () => {
    const input: { status?: OrderStatus; trackingNumber?: string | null; adminNotes?: string | null } = {};
    if (statusChanged) input.status = nextStatus as OrderStatus;
    if (trackingChanged) input.trackingNumber = trackingValue || null;
    if (note.trim().length > 0) input.adminNotes = note.trim();

    updateMutation.mutate(
      { orderNumber: order.orderNumber, input },
      {
        onSuccess: () => {
          toast.success('Order updated');
          setNextStatus('');
          setNote('');
          setTracking(null);
        },
        onError: (err) => toast.error(err instanceof Error ? err.message : 'Could not update order'),
      },
    );
  };

  return (
    <div className="space-y-6">
      <Link href="/admin/orders" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="h-4 w-4" /> Back to orders
      </Link>

      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="font-serif text-3xl font-semibold">{order.orderNumber}</h1>
          <p className="mt-1 text-muted-foreground">Placed {formatDateTime(order.placedAt)}</p>
        </div>
        <OrderStatusBadge status={order.status} className="text-sm" />
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_340px]">
        <div className="space-y-6">
          {/* Items */}
          <div className="rounded-2xl border bg-card p-5">
            <h2 className="font-serif text-lg font-semibold">Items</h2>
            <ul className="mt-4 divide-y">
              {order.items.map((item) => (
                <li key={item.id} className="flex gap-4 py-4 first:pt-0 last:pb-0">
                  <div className="relative h-16 w-14 shrink-0 overflow-hidden rounded-lg bg-secondary">
                    {item.imageUrl ? (
                      <Image src={item.imageUrl} alt={item.productName} fill className="object-cover" sizes="56px" />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center text-xs text-primary/30">AL</div>
                    )}
                  </div>
                  <div className="flex flex-1 items-start justify-between gap-3">
                    <div>
                      <p className="font-medium">{item.productName}</p>
                      {item.variantLabel && <p className="text-sm text-muted-foreground">{item.variantLabel}</p>}
                      <p className="text-sm text-muted-foreground">
                        {formatNaira(item.unitPrice)} × {item.quantity}
                      </p>
                    </div>
                    <span className="shrink-0 font-medium">{formatNaira(item.lineTotal)}</span>
                  </div>
                </li>
              ))}
            </ul>
          </div>

          {/* Customer + delivery + payment */}
          <div className="grid gap-6 sm:grid-cols-2">
            <div className="rounded-2xl border bg-card p-5">
              <h3 className="flex items-center gap-2 font-medium">
                <User className="h-4 w-4 text-primary" /> Customer
              </h3>
              <div className="mt-3 text-sm text-muted-foreground">
                <p className="font-medium text-foreground">{order.contact.fullName}</p>
                <p className="break-all">{order.contact.email}</p>
                <p>{order.contact.phone}</p>
              </div>
            </div>

            <div className="rounded-2xl border bg-card p-5">
              <h3 className="flex items-center gap-2 font-medium">
                <MapPin className="h-4 w-4 text-primary" /> Ship to
              </h3>
              <div className="mt-3 text-sm text-muted-foreground">
                <p className="font-medium text-foreground">{order.shippingAddress.fullName}</p>
                <p>{order.shippingAddress.addressLine1}</p>
                {order.shippingAddress.addressLine2 && <p>{order.shippingAddress.addressLine2}</p>}
                <p>
                  {order.shippingAddress.city}, {order.shippingAddress.state}
                </p>
                <p>{order.shippingAddress.country}</p>
              </div>
              {order.shippingMethod && <p className="mt-2 text-sm">Method: {order.shippingMethod}</p>}
            </div>
          </div>

          <div className="rounded-2xl border bg-card p-5">
            <h3 className="flex items-center gap-2 font-medium">
              <CreditCard className="h-4 w-4 text-primary" /> Payment
            </h3>
            <div className="mt-3 flex flex-wrap items-center gap-x-6 gap-y-1 text-sm text-muted-foreground">
              {order.payment ? (
                <>
                  <span className="flex items-center gap-2">
                    Status <PaymentStatusBadge status={order.payment.status} />
                  </span>
                  {order.payment.channel && <span>Method: {order.payment.channel}</span>}
                  <span className="break-all">Ref: {order.payment.reference}</span>
                  {order.paidAt && <span>Paid {formatDateTime(order.paidAt)}</span>}
                </>
              ) : (
                <span>No payment record.</span>
              )}
            </div>
          </div>
        </div>

        {/* Sidebar: manage + totals */}
        <div className="space-y-6">
          <div className="rounded-2xl border bg-card p-5">
            <h2 className="font-serif text-lg font-semibold">Manage order</h2>

            <div className="mt-4 space-y-4">
              <div className="space-y-1.5">
                <Label>Status</Label>
                {allowed.length === 0 ? (
                  <p className="text-sm text-muted-foreground">
                    No further transitions from <span className="font-medium">{ORDER_STATUS_META[order.status]?.label ?? order.status}</span>.
                  </p>
                ) : (
                  <Select value={nextStatus} onValueChange={(v) => setNextStatus(v as OrderStatus)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Change status to…" />
                    </SelectTrigger>
                    <SelectContent>
                      {allowed.map((s) => (
                        <SelectItem key={s} value={s}>
                          {ORDER_STATUS_META[s]?.label ?? s}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="tracking">Tracking number</Label>
                <Input
                  id="tracking"
                  value={trackingValue}
                  onChange={(e) => setTracking(e.target.value)}
                  placeholder="e.g. GIG-123456"
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="note">Internal note</Label>
                <Textarea
                  id="note"
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  placeholder="Not shown to the customer"
                  rows={3}
                />
              </div>

              <Button onClick={handleSave} disabled={!hasChanges} loading={updateMutation.isPending} className="w-full">
                <Save className="h-4 w-4" /> Save changes
              </Button>
            </div>
          </div>

          <div className="rounded-2xl border bg-card p-5">
            <h2 className="font-serif text-lg font-semibold">Summary</h2>
            <Separator className="my-4" />
            <dl className="space-y-2.5 text-sm">
              <div className="flex justify-between">
                <dt className="text-muted-foreground">Subtotal</dt>
                <dd className="font-medium">{formatNaira(order.totals.subtotal)}</dd>
              </div>
              {order.totals.discountTotal > 0 && (
                <div className="flex justify-between text-emerald-700">
                  <dt>Discount {order.couponCode && `(${order.couponCode})`}</dt>
                  <dd className="font-medium">−{formatNaira(order.totals.discountTotal)}</dd>
                </div>
              )}
              <div className="flex justify-between">
                <dt className="text-muted-foreground">Shipping</dt>
                <dd className="font-medium">
                  {order.totals.shippingTotal === 0 ? 'Free' : formatNaira(order.totals.shippingTotal)}
                </dd>
              </div>
            </dl>
            <Separator className="my-4" />
            <div className="flex items-center justify-between">
              <span className="font-medium">Total</span>
              <span className="font-serif text-xl font-semibold">{formatNaira(order.totals.total)}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
