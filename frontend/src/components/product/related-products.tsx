'use client';

import { useRelatedProducts } from '@/hooks/use-catalog';
import { ProductGrid } from './product-grid';
import { ProductGridSkeleton } from './product-card-skeleton';

export function RelatedProducts({ slug }: { slug: string }) {
  const { data, isLoading } = useRelatedProducts(slug);
  const products = data ?? [];

  if (!isLoading && products.length === 0) return null;

  return (
    <section className="border-t py-14">
      <div className="container">
        <h2 className="mb-8 font-serif text-2xl font-semibold sm:text-3xl">You may also love</h2>
        {isLoading ? <ProductGridSkeleton count={4} /> : <ProductGrid products={products.slice(0, 4)} />}
      </div>
    </section>
  );
}
