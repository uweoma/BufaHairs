'use client';

import Link from 'next/link';
import Image from 'next/image';
import { Heart, ShoppingBag } from 'lucide-react';
import { useState } from 'react';
import type { ProductCard as ProductCardType } from '@/lib/types';
import { cn, discountPercent, formatNaira } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { RatingStars } from '@/components/ui/rating-stars';
import { useCart } from '@/hooks/use-cart';
import { useWishlist } from '@/hooks/use-wishlist';

export function ProductCard({ product }: { product: ProductCardType }) {
  const { add } = useCart();
  const { isWishlisted, toggle } = useWishlist();
  const [adding, setAdding] = useState(false);
  const image = product.images[0]?.url;
  const discount = discountPercent(product.price, product.compareAtPrice);
  const wishlisted = isWishlisted(product.id);

  const handleAdd = async () => {
    setAdding(true);
    try {
      await add({ product });
    } finally {
      setAdding(false);
    }
  };

  return (
    <div className="group relative flex flex-col overflow-hidden rounded-2xl border bg-card transition-shadow hover:shadow-lg">
      <Link href={`/products/${product.slug}`} className="relative block aspect-[4/5] overflow-hidden bg-secondary">
        {image ? (
          <Image
            src={image}
            alt={product.images[0]?.altText || product.name}
            fill
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
            className="object-cover transition-transform duration-500 group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-secondary to-primary-light">
            <span className="font-serif text-4xl text-primary/40">AL</span>
          </div>
        )}

        <div className="absolute left-3 top-3 flex flex-col gap-1.5">
          {discount && <Badge variant="destructive">-{discount}%</Badge>}
          {product.isNewArrival && <Badge variant="secondary">New</Badge>}
          {product.isBestSeller && <Badge variant="gold">Best Seller</Badge>}
        </div>

        {!product.inStock && (
          <div className="absolute inset-0 flex items-center justify-center bg-background/60 backdrop-blur-[1px]">
            <span className="rounded-full bg-foreground px-4 py-1.5 text-xs font-semibold uppercase tracking-wide text-background">
              Sold Out
            </span>
          </div>
        )}
      </Link>

      <button
        type="button"
        onClick={() => toggle(product.id, product.name)}
        aria-label={wishlisted ? 'Remove from wishlist' : 'Add to wishlist'}
        className="absolute right-3 top-3 flex h-9 w-9 items-center justify-center rounded-full bg-background/90 text-foreground shadow-sm backdrop-blur transition-colors hover:text-primary"
      >
        <Heart className={cn('h-4 w-4', wishlisted && 'fill-primary text-primary')} />
      </button>

      <div className="flex flex-1 flex-col p-4">
        {product.category && (
          <span className="text-xs uppercase tracking-wide text-muted-foreground">
            {product.category.name}
          </span>
        )}
        <Link href={`/products/${product.slug}`} className="mt-1">
          <h3 className="line-clamp-2 font-medium leading-snug transition-colors group-hover:text-primary">
            {product.name}
          </h3>
        </Link>

        {product.ratingCount > 0 && (
          <div className="mt-1.5">
            <RatingStars value={product.ratingAvg} size={13} count={product.ratingCount} />
          </div>
        )}

        <div className="mt-auto flex items-end justify-between pt-3">
          <div>
            <div className="flex items-baseline gap-2">
              <span className="text-lg font-semibold text-primary-deep">
                {formatNaira(product.price)}
              </span>
              {product.compareAtPrice && product.compareAtPrice > product.price && (
                <span className="text-sm text-muted-foreground line-through">
                  {formatNaira(product.compareAtPrice)}
                </span>
              )}
            </div>
          </div>
          <Button
            size="icon"
            className="h-10 w-10 shrink-0"
            onClick={handleAdd}
            loading={adding}
            disabled={!product.inStock}
            aria-label="Add to bag"
          >
            {!adding && <ShoppingBag className="h-4 w-4" />}
          </Button>
        </div>
      </div>
    </div>
  );
}
