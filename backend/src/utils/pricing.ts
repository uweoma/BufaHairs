import type { Product, ProductVariant } from '@prisma/client';

type MinimalProduct = Pick<Product, 'price' | 'stock'>;
type MinimalVariant = Pick<ProductVariant, 'priceOverride' | 'stock' | 'length' | 'color' | 'density' | 'capSize'>;

/** Effective unit price (kobo): variant override wins, else product base price. */
export function effectiveUnitPrice(product: MinimalProduct, variant?: MinimalVariant | null): number {
  return variant?.priceOverride ?? product.price;
}

/** Purchasable stock: variant stock when a variant is selected, else product stock. */
export function availableStock(product: MinimalProduct, variant?: MinimalVariant | null): number {
  return variant ? variant.stock : product.stock;
}

/** Human label for a selected variant, e.g. `20" · Natural Black · 180%`. */
export function variantLabel(variant?: MinimalVariant | null): string | null {
  if (!variant) return null;
  const parts: string[] = [];
  if (variant.length) parts.push(`${variant.length}"`);
  if (variant.color) parts.push(variant.color);
  if (variant.density) parts.push(variant.density);
  if (variant.capSize) parts.push(variant.capSize);
  return parts.length ? parts.join(' · ') : null;
}
