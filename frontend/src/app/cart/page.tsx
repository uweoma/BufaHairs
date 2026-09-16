import type { Metadata } from 'next';
import { CartView } from '@/components/cart/cart-view';

export const metadata: Metadata = {
  title: 'Your Bag',
  description: 'Review the items in your shopping bag.',
};

export default function CartPage() {
  return (
    <div className="container py-10 lg:py-14">
      <h1 className="font-serif text-3xl font-semibold lg:text-4xl">Your Bag</h1>
      <p className="mt-2 text-muted-foreground">Review your items before checkout.</p>
      <div className="mt-8">
        <CartView />
      </div>
    </div>
  );
}
