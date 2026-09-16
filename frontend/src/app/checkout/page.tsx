import type { Metadata } from 'next';
import { CheckoutView } from '@/components/checkout/checkout-view';

export const metadata: Metadata = {
  title: 'Checkout',
  description: 'Complete your BufaHairs order securely.',
  robots: { index: false, follow: false },
};

export default function CheckoutPage() {
  return (
    <div className="container py-10 lg:py-14">
      <h1 className="font-serif text-3xl font-semibold lg:text-4xl">Checkout</h1>
      <p className="mt-2 text-muted-foreground">A few details and your order is on its way.</p>
      <div className="mt-8">
        <CheckoutView />
      </div>
    </div>
  );
}
