import { Prisma } from '@prisma/client';
import { prisma } from '../config/prisma';
import { ApiError } from '../utils/ApiError';
import { slugify } from '../utils/slugify';
import {
  productCardInclude,
  productDetailInclude,
  serializeProductCard,
  serializeProductDetail,
} from '../serializers/product.serializer';
import type { ProductListQuery, createProductSchema, updateProductSchema } from '../validators/product.validator';
import type { z } from 'zod';

type CreateProductInput = z.infer<typeof createProductSchema>;
type UpdateProductInput = z.infer<typeof updateProductSchema>;

function buildOrderBy(sort: ProductListQuery['sort']): Prisma.ProductOrderByWithRelationInput[] {
  switch (sort) {
    case 'newest':
      return [{ createdAt: 'desc' }];
    case 'price_asc':
      return [{ price: 'asc' }];
    case 'price_desc':
      return [{ price: 'desc' }];
    case 'rating':
      return [{ ratingAvg: 'desc' }, { ratingCount: 'desc' }];
    case 'bestselling':
      return [{ salesCount: 'desc' }];
    case 'featured':
    default:
      return [{ isFeatured: 'desc' }, { salesCount: 'desc' }, { createdAt: 'desc' }];
  }
}

function buildWhere(query: ProductListQuery): Prisma.ProductWhereInput {
  const where: Prisma.ProductWhereInput = { isActive: true, deletedAt: null };
  const and: Prisma.ProductWhereInput[] = [];

  if (query.category) where.category = { slug: query.category };
  if (query.texture) where.texture = query.texture;

  if (query.minPrice != null || query.maxPrice != null) {
    where.price = {
      ...(query.minPrice != null ? { gte: query.minPrice } : {}),
      ...(query.maxPrice != null ? { lte: query.maxPrice } : {}),
    };
  }

  if (query.featured) where.isFeatured = true;
  if (query.bestSeller) where.isBestSeller = true;
  if (query.newArrival) where.isNewArrival = true;

  // Variant-scoped filters (length / colour).
  const variantWhere: Prisma.ProductVariantWhereInput = { isActive: true };
  let hasVariantFilter = false;
  if (query.color) {
    variantWhere.color = { contains: query.color, mode: 'insensitive' };
    hasVariantFilter = true;
  }
  if (query.minLength != null || query.maxLength != null) {
    variantWhere.length = {
      ...(query.minLength != null ? { gte: query.minLength } : {}),
      ...(query.maxLength != null ? { lte: query.maxLength } : {}),
    };
    hasVariantFilter = true;
  }
  if (hasVariantFilter) where.variants = { some: variantWhere };

  // In stock: product stock OR any active variant stock.
  if (query.inStock) {
    and.push({ OR: [{ stock: { gt: 0 } }, { variants: { some: { isActive: true, stock: { gt: 0 } } } }] });
  }

  // Full-text-ish search across key fields.
  if (query.q) {
    const q = query.q;
    and.push({
      OR: [
        { name: { contains: q, mode: 'insensitive' } },
        { description: { contains: q, mode: 'insensitive' } },
        { shortDesc: { contains: q, mode: 'insensitive' } },
        { sku: { contains: q, mode: 'insensitive' } },
        { origin: { contains: q, mode: 'insensitive' } },
        { category: { name: { contains: q, mode: 'insensitive' } } },
      ],
    });
  }

  if (and.length) where.AND = and;
  return where;
}

export async function listProducts(query: ProductListQuery) {
  const where = buildWhere(query);
  const skip = (query.page - 1) * query.limit;

  const [items, total] = await Promise.all([
    prisma.product.findMany({
      where,
      include: productCardInclude,
      orderBy: buildOrderBy(query.sort),
      skip,
      take: query.limit,
    }),
    prisma.product.count({ where }),
  ]);

  return { items: items.map(serializeProductCard), total };
}

export async function getProductBySlug(slug: string) {
  const product = await prisma.product.findFirst({
    where: { slug, isActive: true, deletedAt: null },
    include: productDetailInclude,
  });
  if (!product) throw ApiError.notFound('Product not found');
  return serializeProductDetail(product);
}

export async function getRelatedProducts(slug: string, limit = 4) {
  const product = await prisma.product.findFirst({
    where: { slug, deletedAt: null },
    select: { id: true, categoryId: true },
  });
  if (!product) throw ApiError.notFound('Product not found');

  const related = await prisma.product.findMany({
    where: {
      isActive: true,
      deletedAt: null,
      categoryId: product.categoryId,
      id: { not: product.id },
    },
    include: productCardInclude,
    orderBy: [{ salesCount: 'desc' }, { ratingAvg: 'desc' }],
    take: limit,
  });
  return related.map(serializeProductCard);
}

/** Fetch a set of products by id (used by client-side "recently viewed"). */
export async function getProductsByIds(ids: string[]) {
  if (!ids.length) return [];
  const products = await prisma.product.findMany({
    where: { id: { in: ids }, isActive: true, deletedAt: null },
    include: productCardInclude,
  });
  // Preserve requested order.
  const map = new Map(products.map((p) => [p.id, p]));
  return ids.map((id) => map.get(id)).filter(Boolean).map((p) => serializeProductCard(p!));
}

// --------------------------- Admin operations ------------------------------

export async function adminListProducts(params: {
  q?: string;
  page: number;
  limit: number;
  includeDeleted?: boolean;
}) {
  const where: Prisma.ProductWhereInput = {};
  if (!params.includeDeleted) where.deletedAt = null;
  if (params.q) {
    where.OR = [
      { name: { contains: params.q, mode: 'insensitive' } },
      { sku: { contains: params.q, mode: 'insensitive' } },
    ];
  }
  const skip = (params.page - 1) * params.limit;
  const [items, total] = await Promise.all([
    prisma.product.findMany({
      where,
      include: productCardInclude,
      orderBy: { createdAt: 'desc' },
      skip,
      take: params.limit,
    }),
    prisma.product.count({ where }),
  ]);
  return { items: items.map(serializeProductCard), total };
}

async function ensureUniqueSlug(base: string, excludeId?: string): Promise<string> {
  let slug = slugify(base);
  let n = 1;
  // eslint-disable-next-line no-constant-condition
  while (true) {
    const existing = await prisma.product.findUnique({ where: { slug } });
    if (!existing || existing.id === excludeId) return slug;
    slug = `${slugify(base)}-${n++}`;
  }
}

export async function createProduct(input: CreateProductInput) {
  const slug = await ensureUniqueSlug(input.slug ?? input.name);
  const { images, variants, ...scalars } = input;

  const product = await prisma.product.create({
    data: {
      ...scalars,
      slug,
      images: images?.length ? { create: images } : undefined,
      variants: variants?.length ? { create: variants } : undefined,
    },
    include: productDetailInclude,
  });
  return serializeProductDetail(product);
}

export async function updateProduct(id: string, input: UpdateProductInput) {
  const existing = await prisma.product.findUnique({ where: { id } });
  if (!existing || existing.deletedAt) throw ApiError.notFound('Product not found');

  const { images, variants, slug, ...scalars } = input;
  const data: Prisma.ProductUpdateInput = { ...scalars };
  if (slug) data.slug = await ensureUniqueSlug(slug, id);

  // Full-replace images / variants only when explicitly provided.
  const product = await prisma.$transaction(async (tx) => {
    if (images) {
      await tx.productImage.deleteMany({ where: { productId: id } });
    }
    if (variants) {
      await tx.productVariant.deleteMany({ where: { productId: id } });
    }
    return tx.product.update({
      where: { id },
      data: {
        ...data,
        ...(images ? { images: { create: images } } : {}),
        ...(variants ? { variants: { create: variants } } : {}),
      },
      include: productDetailInclude,
    });
  });
  return serializeProductDetail(product);
}

/**
 * Soft-delete: never hard-delete a product that appears in historical orders.
 * If it has no order history we can safely hard-delete; otherwise we mark it
 * inactive + deletedAt so order records stay intact.
 */
export async function deleteProduct(id: string) {
  const existing = await prisma.product.findUnique({
    where: { id },
    include: { _count: { select: { orderItems: true } } },
  });
  if (!existing) throw ApiError.notFound('Product not found');

  if (existing._count.orderItems === 0) {
    await prisma.product.delete({ where: { id } });
    return { hardDeleted: true };
  }
  await prisma.product.update({
    where: { id },
    data: { deletedAt: new Date(), isActive: false },
  });
  return { hardDeleted: false };
}

export async function getAdminProduct(id: string) {
  const product = await prisma.product.findUnique({ where: { id }, include: productDetailInclude });
  if (!product) throw ApiError.notFound('Product not found');
  return serializeProductDetail(product);
}
