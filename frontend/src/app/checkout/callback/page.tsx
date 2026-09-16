import type { Metadata } from 'next';
import { Suspense } from 'react';
import { CheckoutCallback } from '@/components/checkout/checkout-callback';

export const metadata: Metadata = {
  title: 'Confirming Payment',
  robots: { index: false, follow: false },
};

export default function CheckoutCallbackPage() {
  return (
    <div className="container">
      <Suspense fallback={<div className="min-h-[50vh]" />}>
        <CheckoutCallback />
      </Suspense>
    </div>
  );
}
