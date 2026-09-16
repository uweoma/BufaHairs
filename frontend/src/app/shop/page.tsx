import type { Metadata } from 'next';
import { Suspense } from 'react';
import { ShopClient } from '@/components/shop/shop-client';
import { ProductGridSkeleton } from '@/components/product/product-card-skeleton';

export const metadata: Metadata = {
  title: 'Shop Premium Human Hair Wigs & Bundles',
  description:
    'Browse our full collection of premium 100% human hair wigs, bundles, closures and frontals. Filter by texture, length and price.',
  alternates: { canonical: '/shop' },
};

function ShopFallback() {
  return (
    <div className="container py-8 lg:py-12">
      <div className="mb-6 h-9 w-48 animate-pulse rounded bg-muted" />
      <ProductGridSkeleton count={9} />
    </div>
  );
}

export default function ShopPage() {
  return (
    <Suspense fallback={<ShopFallback />}>
      <ShopClient />
    </Suspense>
  );
}
