'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { CheckCircle2, XCircle, Loader2, Lock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/use-auth';
import { http, ApiError } from '@/lib/api';
import { formatNaira } from '@/lib/utils';
import type { PaymentVerifyResult } from '@/lib/types';

export function CheckoutCallback() {
  const searchParams = useSearchParams();
  const reference = searchParams.get('reference') ?? searchParams.get('trxref') ?? '';
  const { status } = useAuth();
  const queryClient = useQueryClient();

  const verifyQuery = useQuery({
    queryKey: ['verify-payment', reference],
    queryFn: () => http.post<PaymentVerifyResult>('/payments/verify', { reference }),
    enabled: Boolean(reference) && status === 'authenticated',
    retry: false,
    staleTime: Infinity,
  });

  useEffect(() => {
    if (verifyQuery.isSuccess) {
      queryClient.invalidateQueries({ queryKey: ['cart'] });
      queryClient.invalidateQueries({ queryKey: ['orders'] });
      queryClient.invalidateQueries({ queryKey: ['order'] });
    }
  }, [verifyQuery.isSuccess, queryClient]);

  const Shell = ({ children }: { children: React.ReactNode }) => (
    <div className="mx-auto flex min-h-[50vh] max-w-md flex-col items-center justify-center py-16 text-center">
      {children}
    </div>
  );

  if (!reference) {
    return (
      <Shell>
        <XCircle className="h-14 w-14 text-destructive" />
        <h1 className="mt-4 font-serif text-2xl font-semibold">Missing payment reference</h1>
        <p className="mt-2 text-muted-foreground">
          We couldn&apos;t find a payment to verify. If you were charged, please check your orders.
        </p>
        <Button asChild className="mt-6">
          <Link href="/account/orders">View My Orders</Link>
        </Button>
      </Shell>
    );
  }

  if (status === 'loading') {
    return (
      <Shell>
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
        <p className="mt-4 text-muted-foreground">Loading…</p>
      </Shell>
    );
  }

  if (status === 'unauthenticated') {
    return (
      <Shell>
        <Lock className="h-14 w-14 text-primary" />
        <h1 className="mt-4 font-serif text-2xl font-semibold">Sign in to confirm your payment</h1>
        <p className="mt-2 text-muted-foreground">
          Please sign in so we can securely verify your order.
        </p>
        <Button asChild className="mt-6">
          <Link href={`/login?redirect=${encodeURIComponent(`/checkout/callback?reference=${reference}`)}`}>
            Sign In
          </Link>
        </Button>
      </Shell>
    );
  }

  if (verifyQuery.isPending || verifyQuery.isFetching) {
    return (
      <Shell>
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
        <h1 className="mt-4 font-serif text-2xl font-semibold">Verifying your payment…</h1>
        <p className="mt-2 text-muted-foreground">This will only take a moment. Please don&apos;t close this page.</p>
      </Shell>
    );
  }

  if (verifyQuery.isError) {
    const message =
      verifyQuery.error instanceof ApiError
        ? verifyQuery.error.message
        : 'We could not verify your payment.';
    return (
      <Shell>
        <XCircle className="h-14 w-14 text-destructive" />
        <h1 className="mt-4 font-serif text-2xl font-semibold">Payment not confirmed</h1>
        <p className="mt-2 text-muted-foreground">{message}</p>
        <div className="mt-6 flex gap-3">
          <Button asChild variant="outline">
            <Link href="/account/orders">View My Orders</Link>
          </Button>
          <Button onClick={() => verifyQuery.refetch()}>Try Again</Button>
        </div>
      </Shell>
    );
  }

  const order = verifyQuery.data?.order ?? null;
  return (
    <Shell>
      <CheckCircle2 className="h-16 w-16 text-emerald-500" />
      <h1 className="mt-4 font-serif text-3xl font-semibold">Payment successful</h1>
      <p className="mt-2 text-muted-foreground">
        Thank you for your order{order ? <> — <span className="font-medium text-foreground">{order.orderNumber}</span></> : ''}.
        A confirmation email is on its way.
      </p>
      {order && (
        <p className="mt-4 text-lg font-semibold">Total paid: {formatNaira(order.totals.total)}</p>
      )}
      <div className="mt-6 flex gap-3">
        <Button asChild>
          <Link href={order ? `/account/orders/${order.orderNumber}` : '/account/orders'}>
            View Order
          </Link>
        </Button>
        <Button asChild variant="outline">
          <Link href="/shop">Continue Shopping</Link>
        </Button>
      </div>
    </Shell>
  );
}
