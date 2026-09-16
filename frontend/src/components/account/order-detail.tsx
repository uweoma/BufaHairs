'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useSearchParams } from 'next/navigation';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Package,
  ArrowLeft,
  CheckCircle2,
  CreditCard,
  MapPin,
  Truck,
  AlertCircle,
  Loader2,
} from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import { EmptyState } from '@/components/ui/empty-state';
import { OrderStatusBadge, PaymentStatusBadge } from './order-status-badge';
import { useOrder, useCancelOrder } from '@/hooks/use-orders';
import { formatNaira, formatDateTime } from '@/lib/utils';
import type { Order, PaymentInit } from '@/lib/types';

const isDev = process.env.NODE_ENV !== 'production';

export function OrderDetail({ orderNumber }: { orderNumber: string }) {
  const searchParams = useSearchParams();
  const justPlaced = searchParams.get('placed') === '1';
  const queryClient = useQueryClient();
  const { data: order, isLoading, isError } = useOrder(orderNumber);
  const cancelMutation = useCancelOrder();

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ['order', orderNumber] });
    queryClient.invalidateQueries({ queryKey: ['orders'] });
  };

  const initMutation = useMutation({
    mutationFn: () => http_initialize(orderNumber),
    onSuccess: (payment) => {
      if (payment.authorizationUrl) {
        window.location.assign(payment.authorizationUrl);
      } else if (!payment.paystackEnabled) {
        toast.info('Paystack is not configured in this environment. Use the test option below.');
      } else {
        toast.error('Could not start payment. Please try again.');
      }
    },
    onError: (err) => toast.error(err instanceof Error ? err.message : 'Could not start payment'),
  });

  const devMutation = useMutation({
    mutationFn: (reference: string) => http_devComplete(reference),
    onSuccess: () => {
      invalidate();
      toast.success('Test payment completed');
    },
    onError: (err) => toast.error(err instanceof Error ? err.message : 'Could not complete test payment'),
  });

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-40" />
        <Skeleton className="h-40 rounded-2xl" />
        <Skeleton className="h-60 rounded-2xl" />
      </div>
    );
  }

  if (isError || !order) {
    return (
      <EmptyState
        icon={Package}
        title="Order not found"
        description="We couldn't find this order. It may have been removed or the link is incorrect."
        action={
          <Button asChild>
            <Link href="/account/orders">Back to Orders</Link>
          </Button>
        }
      />
    );
  }

  const isPending = order.status === 'PENDING';
  const canPay = isPending;

  return (
    <div className="space-y-6">
      <Link href="/account/orders" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="h-4 w-4" /> Back to orders
      </Link>

      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="font-serif text-3xl font-semibold">{order.orderNumber}</h1>
          <p className="mt-1 text-muted-foreground">Placed {formatDateTime(order.placedAt)}</p>
        </div>
        <OrderStatusBadge status={order.status} className="text-sm" />
      </div>

      {/* Just placed / payment needed */}
      {justPlaced && (
        <div className="flex items-start gap-3 rounded-2xl border border-emerald-200 bg-emerald-50 p-4">
          <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-emerald-600" />
          <div>
            <p className="font-medium text-emerald-900">Your order has been placed</p>
            <p className="text-sm text-emerald-800">Complete payment below to confirm and begin processing.</p>
          </div>
        </div>
      )}

      {canPay && (
        <div className="rounded-2xl border border-amber-200 bg-amber-50 p-5">
          <div className="flex items-start gap-3">
            <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-amber-600" />
            <div className="flex-1">
              <p className="font-medium text-amber-900">Payment required</p>
              <p className="text-sm text-amber-800">
                This order is awaiting payment of {formatNaira(order.totals.total)}.
              </p>
              <div className="mt-4 flex flex-wrap gap-3">
                <Button onClick={() => initMutation.mutate()} disabled={initMutation.isPending}>
                  {initMutation.isPending ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" /> Starting…
                    </>
                  ) : (
                    <>
                      <CreditCard className="h-4 w-4" /> Pay Now
                    </>
                  )}
                </Button>
                <Button
                  variant="ghost"
                  className="text-amber-800 hover:bg-amber-100"
                  onClick={() => cancelMutation.mutate(order.orderNumber)}
                  disabled={cancelMutation.isPending}
                >
                  Cancel order
                </Button>
              </div>
              {isDev && order.payment && (
                <button
                  onClick={() => devMutation.mutate(order.payment!.reference)}
                  disabled={devMutation.isPending}
                  className="mt-3 text-xs text-amber-700 underline underline-offset-2 hover:text-amber-900 disabled:opacity-50"
                >
                  {devMutation.isPending ? 'Completing test payment…' : 'Dev only: simulate a successful payment'}
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
        {/* Items */}
        <div className="space-y-6">
          <div className="rounded-2xl border bg-card p-5">
            <h2 className="font-serif text-lg font-semibold">Items</h2>
            <ul className="mt-4 divide-y">
              {order.items.map((item) => (
                <li key={item.id} className="flex gap-4 py-4 first:pt-0 last:pb-0">
                  <div className="relative h-20 w-16 shrink-0 overflow-hidden rounded-lg bg-secondary">
                    {item.imageUrl ? (
                      <Image src={item.imageUrl} alt={item.productName} fill className="object-cover" sizes="64px" />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center text-xs text-primary/30">AL</div>
                    )}
                  </div>
                  <div className="flex flex-1 items-start justify-between gap-3">
                    <div>
                      {item.productSlug ? (
                        <Link href={`/products/${item.productSlug}`} className="font-medium hover:text-primary">
                          {item.productName}
                        </Link>
                      ) : (
                        <span className="font-medium">{item.productName}</span>
                      )}
                      {item.variantLabel && (
                        <p className="text-sm text-muted-foreground">{item.variantLabel}</p>
                      )}
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

          {/* Delivery + payment info */}
          <div className="grid gap-6 sm:grid-cols-2">
            <div className="rounded-2xl border bg-card p-5">
              <h3 className="flex items-center gap-2 font-medium">
                <MapPin className="h-4 w-4 text-primary" /> Delivery
              </h3>
              <div className="mt-3 text-sm text-muted-foreground">
                <p className="font-medium text-foreground">{order.shippingAddress.fullName}</p>
                <p>{order.shippingAddress.addressLine1}</p>
                {order.shippingAddress.addressLine2 && <p>{order.shippingAddress.addressLine2}</p>}
                <p>
                  {order.shippingAddress.city}, {order.shippingAddress.state}
                </p>
                <p>{order.shippingAddress.country}</p>
                <p className="mt-1">{order.shippingAddress.phone}</p>
              </div>
              {order.shippingMethod && (
                <p className="mt-3 flex items-center gap-1.5 text-sm text-muted-foreground">
                  <Truck className="h-4 w-4" /> {order.shippingMethod}
                </p>
              )}
              {order.trackingNumber && (
                <p className="mt-1 text-sm">
                  Tracking: <span className="font-medium">{order.trackingNumber}</span>
                </p>
              )}
            </div>

            <div className="rounded-2xl border bg-card p-5">
              <h3 className="flex items-center gap-2 font-medium">
                <CreditCard className="h-4 w-4 text-primary" /> Payment
              </h3>
              <div className="mt-3 space-y-1.5 text-sm text-muted-foreground">
                {order.payment ? (
                  <>
                    <div className="flex items-center gap-2">
                      <span>Status</span>
                      <PaymentStatusBadge status={order.payment.status} />
                    </div>
                    {order.payment.channel && <p>Method: {order.payment.channel}</p>}
                    <p className="break-all">Ref: {order.payment.reference}</p>
                    {order.paidAt && <p>Paid {formatDateTime(order.paidAt)}</p>}
                  </>
                ) : (
                  <p>No payment record.</p>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Totals */}
        <div className="lg:sticky lg:top-24 lg:self-start">
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

// --- Local API helpers (typed to the payment endpoints) --------------------

async function http_initialize(orderNumber: string): Promise<PaymentInit> {
  const { http } = await import('@/lib/api');
  const res = await http.post<{ payment: PaymentInit }>(`/payments/${orderNumber}/initialize`);
  return res.payment;
}

async function http_devComplete(reference: string): Promise<Order> {
  const { http } = await import('@/lib/api');
  const res = await http.post<{ order: Order }>('/payments/dev/complete', { reference });
  return res.order;
}
