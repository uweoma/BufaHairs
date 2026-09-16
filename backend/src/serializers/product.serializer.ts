import { Prisma } from '@prisma/client';
import { variantLabel } from '../utils/pricing';

/** Include shapes reused across queries — keeps payloads consistent + typed. */
export const productCardInclude = {
  images: { orderBy: [{ isPrimary: 'desc' }, { sortOrder: 'asc' }], take: 2 },
  category: { select: { id: true, name: true, slug: true } },
  variants: {
    where: { isActive: true },
    select: { id: true, stock: true, priceOverride: true, length: true, color: true },
  },
} satisfies Prisma.ProductInclude;

export const productDetailInclude = {
  images: { orderBy: [{ isPrimary: 'desc' }, { sortOrder: 'asc' }] },
  category: { select: { id: true, name: true, slug: true } },
  variants: { where: { isActive: true }, orderBy: [{ length: 'asc' }, { color: 'asc' }] },
} satisfies Prisma.ProductInclude;

type ProductCard = Prisma.ProductGetPayload<{ include: typeof productCardInclude }>;
type ProductDetail = Prisma.ProductGetPayload<{ include: typeof productDetailInclude }>;

function computeInStock(stock: number, variants: { stock: number }[]): boolean {
  if (variants.length > 0) return variants.some((v) => v.stock > 0);
  return stock > 0;
}

export function serializeProductCard(p: ProductCard) {
  return {
    id: p.id,
    name: p.name,
    slug: p.slug,
    sku: p.sku,
    price: p.price,
    compareAtPrice: p.compareAtPrice,
    stock: p.stock,
    texture: p.texture,
    origin: p.origin,
    isFeatured: p.isFeatured,
    isBestSeller: p.isBestSeller,
    isNewArrival: p.isNewArrival,
    ratingAvg: p.ratingAvg,
    ratingCount: p.ratingCount,
    salesCount: p.salesCount,
    category: p.category,
    images: p.images.map((img) => ({ id: img.id, url: img.url, altText: img.altText })),
    inStock: computeInStock(p.stock, p.variants),
    onSale: p.compareAtPrice != null && p.compareAtPrice > p.price,
    createdAt: p.createdAt,
  };
}

export function serializeProductDetail(p: ProductDetail) {
  return {
    ...serializeProductCard(p as unknown as ProductCard),
    description: p.description,
    shortDesc: p.shortDesc,
    lowStockAt: p.lowStockAt,
    weightGrams: p.weightGrams,
    metaTitle: p.metaTitle,
    metaDescription: p.metaDescription,
    updatedAt: p.updatedAt,
    images: p.images.map((img) => ({
      id: img.id,
      url: img.url,
      altText: img.altText,
      isPrimary: img.isPrimary,
    })),
    variants: p.variants.map((v) => ({
      id: v.id,
      sku: v.sku,
      label: variantLabel(v),
      length: v.length,
      color: v.color,
      density: v.density,
      capSize: v.capSize,
      price: v.priceOverride ?? p.price,
      stock: v.stock,
      inStock: v.stock > 0,
    })),
  };
}

export type SerializedProductCard = ReturnType<typeof serializeProductCard>;
export type SerializedProductDetail = ReturnType<typeof serializeProductDetail>;
