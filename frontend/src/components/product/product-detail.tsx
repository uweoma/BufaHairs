'use client';

import { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Heart, ShoppingBag, Check, Truck, ShieldCheck, RefreshCw, MessageCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { RatingStars } from '@/components/ui/rating-stars';
import { QuantityStepper } from '@/components/cart/quantity-stepper';
import { useCart } from '@/hooks/use-cart';
import { useWishlist } from '@/hooks/use-wishlist';
import { useUIStore } from '@/store/ui-store';
import { cn, formatNaira, discountPercent } from '@/lib/utils';
import { WHATSAPP_NUMBER, BRAND_NAME } from '@/lib/constants';
import type { ProductDetail, ProductVariant } from '@/lib/types';

export function ProductDetailView({ product }: { product: ProductDetail }) {
  const { add, isMutating } = useCart();
  const { isWishlisted, toggle } = useWishlist();
  const openCart = useUIStore((s) => s.openCart);

  const [activeImage, setActiveImage] = useState(0);
  const [variant, setVariant] = useState<ProductVariant | null>(
    product.variants.length > 0 ? (product.variants.find((v) => v.inStock) ?? product.variants[0]) : null,
  );
  const [quantity, setQuantity] = useState(1);
  const [adding, setAdding] = useState(false);

  const price = variant?.price ?? product.price;
  const stock = variant ? variant.stock : product.stock;
  const inStock = variant ? variant.inStock : product.inStock;
  const lowStock = inStock && stock <= product.lowStockAt;
  const discount = discountPercent(price, product.compareAtPrice);
  const wishlisted = isWishlisted(product.id);
  const images = product.images.length > 0 ? product.images : [];

  const handleAdd = async () => {
    setAdding(true);
    try {
      await add({ product, variant, quantity });
      openCart();
    } finally {
      setAdding(false);
    }
  };

  const waHref =
    WHATSAPP_NUMBER &&
    `https://wa.me/${WHATSAPP_NUMBER.replace(/[^0-9]/g, '')}?text=${encodeURIComponent(
      `Hi ${BRAND_NAME}! I'm interested in "${product.name}" (${product.sku}).`,
    )}`;

  return (
    <div className="grid gap-8 lg:grid-cols-2 lg:gap-12">
      {/* Gallery */}
      <div className="flex flex-col gap-4">
        <div className="relative aspect-square overflow-hidden rounded-3xl bg-secondary">
          {images[activeImage] ? (
            <Image
              src={images[activeImage].url}
              alt={images[activeImage].altText || product.name}
              fill
              priority
              sizes="(max-width: 1024px) 100vw, 50vw"
              className="object-cover"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-secondary to-primary-light">
              <span className="font-serif text-6xl text-primary/30">AL</span>
            </div>
          )}
          {discount && (
            <Badge variant="destructive" className="absolute left-4 top-4 text-sm">
              -{discount}%
            </Badge>
          )}
        </div>

        {images.length > 1 && (
          <div className="grid grid-cols-5 gap-3">
            {images.map((img, i) => (
              <button
                key={img.id}
                onClick={() => setActiveImage(i)}
                className={cn(
                  'relative aspect-square overflow-hidden rounded-xl bg-secondary ring-2 ring-transparent transition-all',
                  i === activeImage && 'ring-primary',
                )}
                aria-label={`View image ${i + 1}`}
              >
                <Image src={img.url} alt={img.altText || `${product.name} ${i + 1}`} fill sizes="20vw" className="object-cover" />
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Buy box */}
      <div className="flex flex-col">
        {product.category && (
          <Link
            href={`/shop?category=${product.category.slug}`}
            className="text-xs font-semibold uppercase tracking-widest text-primary hover:underline"
          >
            {product.category.name}
          </Link>
        )}
        <h1 className="mt-2 font-serif text-3xl font-semibold sm:text-4xl">{product.name}</h1>

        {product.ratingCount > 0 && (
          <a href="#reviews" className="mt-3 flex items-center gap-2 text-sm">
            <RatingStars value={product.ratingAvg} size={16} />
            <span className="text-muted-foreground">
              {product.ratingAvg.toFixed(1)} ({product.ratingCount} review{product.ratingCount === 1 ? '' : 's'})
            </span>
          </a>
        )}

        <div className="mt-5 flex items-baseline gap-3">
          <span className="font-serif text-3xl font-semibold text-primary-deep">{formatNaira(price)}</span>
          {product.compareAtPrice && product.compareAtPrice > price && (
            <span className="text-lg text-muted-foreground line-through">
              {formatNaira(product.compareAtPrice)}
            </span>
          )}
        </div>

        {product.shortDesc && <p className="mt-4 text-muted-foreground">{product.shortDesc}</p>}

        {/* Variants */}
        {product.variants.length > 0 && (
          <div className="mt-6">
            <span className="text-sm font-medium">Options</span>
            <div className="mt-2 flex flex-wrap gap-2">
              {product.variants.map((v) => (
                <button
                  key={v.id}
                  onClick={() => {
                    setVariant(v);
                    setQuantity(1);
                  }}
                  disabled={!v.inStock}
                  className={cn(
                    'rounded-xl border px-4 py-2 text-sm transition-all',
                    variant?.id === v.id
                      ? 'border-primary bg-primary/10 font-medium text-primary-deep'
                      : 'border-input hover:border-primary',
                    !v.inStock && 'cursor-not-allowed opacity-40 line-through',
                  )}
                >
                  {v.label}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Stock status */}
        <div className="mt-6">
          {inStock ? (
            <span className={cn('inline-flex items-center gap-1.5 text-sm font-medium', lowStock ? 'text-amber-600' : 'text-emerald-600')}>
              <Check className="h-4 w-4" />
              {lowStock ? `Only ${stock} left in stock` : 'In stock'}
            </span>
          ) : (
            <span className="text-sm font-medium text-destructive">Out of stock</span>
          )}
        </div>

        {/* Add to cart */}
        <div className="mt-4 flex items-center gap-3">
          <QuantityStepper value={quantity} onChange={setQuantity} max={Math.max(1, stock)} disabled={!inStock} />
          <Button
            size="lg"
            className="flex-1"
            onClick={handleAdd}
            loading={adding || isMutating}
            disabled={!inStock}
          >
            {!adding && <ShoppingBag className="h-4 w-4" />}
            {inStock ? 'Add to Bag' : 'Out of Stock'}
          </Button>
          <Button
            size="lg"
            variant="outline"
            className="w-12 shrink-0 px-0"
            onClick={() => toggle(product.id, product.name)}
            aria-label={wishlisted ? 'Remove from wishlist' : 'Add to wishlist'}
          >
            <Heart className={cn('h-5 w-5', wishlisted && 'fill-primary text-primary')} />
          </Button>
        </div>

        {waHref && (
          <a
            href={waHref}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-3 inline-flex items-center justify-center gap-2 text-sm font-medium text-[#25D366] hover:underline"
          >
            <MessageCircle className="h-4 w-4" /> Ask about this product on WhatsApp
          </a>
        )}

        {/* Trust row */}
        <div className="mt-8 grid grid-cols-3 gap-4 border-t pt-6 text-center text-xs text-muted-foreground">
          <div className="flex flex-col items-center gap-1.5">
            <Truck className="h-5 w-5 text-primary" /> Fast nationwide delivery
          </div>
          <div className="flex flex-col items-center gap-1.5">
            <ShieldCheck className="h-5 w-5 text-primary" /> Secure Paystack checkout
          </div>
          <div className="flex flex-col items-center gap-1.5">
            <RefreshCw className="h-5 w-5 text-primary" /> Authentic human hair
          </div>
        </div>

        {/* Specs */}
        <dl className="mt-6 space-y-2 text-sm">
          <SpecRow label="SKU" value={variant?.sku ?? product.sku} />
          {product.texture && <SpecRow label="Texture" value={titleFromEnum(product.texture)} />}
          {product.origin && <SpecRow label="Origin" value={product.origin} />}
          {product.weightGrams && <SpecRow label="Weight" value={`${product.weightGrams}g`} />}
        </dl>
      </div>
    </div>
  );
}

function SpecRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex gap-3">
      <dt className="w-24 shrink-0 text-muted-foreground">{label}</dt>
      <dd className="font-medium">{value}</dd>
    </div>
  );
}

function titleFromEnum(v: string) {
  return v
    .toLowerCase()
    .split('_')
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ');
}
