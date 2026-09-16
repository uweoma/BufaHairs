import type { ProductCard as ProductCardType } from '@/lib/types';
import { ProductCard } from './product-card';

export function ProductGrid({ products }: { products: ProductCardType[] }) {
  return (
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
      {products.map((product) => (
        <ProductCard key={product.id} product={product} />
      ))}
    </div>
  );
}
