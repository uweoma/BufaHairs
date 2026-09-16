import type { Metadata } from 'next';
import { WishlistView } from '@/components/wishlist/wishlist-view';

export const metadata: Metadata = {
  title: 'Wishlist',
  description: 'Your saved BufaHairs favourites.',
};

export default function WishlistPage() {
  return (
    <div className="container py-10 lg:py-14">
      <h1 className="font-serif text-3xl font-semibold lg:text-4xl">Your Wishlist</h1>
      <p className="mt-2 text-muted-foreground">The pieces you&apos;ve saved for later.</p>
      <div className="mt-8">
        <WishlistView />
      </div>
    </div>
  );
}
