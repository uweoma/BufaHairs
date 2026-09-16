'use client';

import Link from 'next/link';
import { Heart } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/ui/empty-state';
import { ProductCardSkeleton } from '@/components/product/product-card-skeleton';
import { ProductCard } from '@/components/product/product-card';
import { useWishlist } from '@/hooks/use-wishlist';
import { useAuth } from '@/hooks/use-auth';

export function WishlistView() {
  const { status } = useAuth();
  const { items, isLoading } = useWishlist();

  if (status === 'loading' || isLoading) {
    return (
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <ProductCardSkeleton key={i} />
        ))}
      </div>
    );
  }

  if (status === 'unauthenticated') {
    return (
      <EmptyState
        icon={Heart}
        title="Sign in to view your wishlist"
        description="Save your favourite pieces and find them here on any device."
        action={
          <Button asChild size="lg">
            <Link href="/login?redirect=/wishlist">Sign In</Link>
          </Button>
        }
      />
    );
  }

  if (items.length === 0) {
    return (
      <EmptyState
        icon={Heart}
        title="Your wishlist is empty"
        description="Tap the heart on any product to save it here for later."
        action={
          <Button asChild size="lg">
            <Link href="/shop">Browse the Collection</Link>
          </Button>
        }
      />
    );
  }

  return (
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
      {items.map((entry) => (
        <ProductCard key={entry.id} product={entry.product} />
      ))}
    </div>
  );
}
