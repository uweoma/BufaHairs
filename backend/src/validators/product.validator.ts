import { z } from 'zod';
import { HairTexture } from '@prisma/client';

/** Query booleans arrive as strings; coerce them safely. */
const boolQuery = z
  .union([z.boolean(), z.enum(['true', 'false', '1', '0'])])
  .transform((v) => v === true || v === 'true' || v === '1')
  .optional();

const money = z.number().int().nonnegative();

export const productListQuerySchema = z.object({
  q: z.string().trim().max(120).optional(),
  category: z.string().trim().optional(), // category slug
  minPrice: z.coerce.number().int().nonnegative().optional(), // kobo
  maxPrice: z.coerce.number().int().nonnegative().optional(), // kobo
  texture: z.nativeEnum(HairTexture).optional(),
  color: z.string().trim().max(60).optional(),
  minLength: z.coerce.number().int().positive().optional(),
  maxLength: z.coerce.number().int().positive().optional(),
  inStock: boolQuery,
  featured: boolQuery,
  bestSeller: boolQuery,
  newArrival: boolQuery,
  sort: z
    .enum(['featured', 'newest', 'price_asc', 'price_desc', 'rating', 'bestselling'])
    .default('featured'),
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(60).default(12),
});

export type ProductListQuery = z.infer<typeof productListQuerySchema>;

const variantInput = z.object({
  sku: z.string().trim().min(1).max(80),
  length: z.number().int().positive().optional(),
  color: z.string().trim().max(60).optional(),
  density: z.string().trim().max(40).optional(),
  capSize: z.string().trim().max(40).optional(),
  priceOverride: money.optional(),
  stock: z.number().int().nonnegative().default(0),
  isActive: z.boolean().default(true),
});

const imageInput = z.object({
  url: z.string().url(),
  publicId: z.string().optional(),
  altText: z.string().max(160).optional(),
  isPrimary: z.boolean().default(false),
  sortOrder: z.number().int().nonnegative().default(0),
});

export const createProductSchema = z.object({
  name: z.string().trim().min(2).max(160),
  slug: z.string().trim().min(2).max(180).optional(),
  description: z.string().trim().min(10),
  shortDesc: z.string().trim().max(280).optional(),
  sku: z.string().trim().min(1).max(80),
  price: money,
  compareAtPrice: money.optional(),
  stock: z.number().int().nonnegative().default(0),
  lowStockAt: z.number().int().nonnegative().default(5),
  texture: z.nativeEnum(HairTexture).optional(),
  origin: z.string().trim().max(60).optional(),
  weightGrams: z.number().int().positive().optional(),
  categoryId: z.string().uuid(),
  isActive: z.boolean().default(true),
  isFeatured: z.boolean().default(false),
  isBestSeller: z.boolean().default(false),
  isNewArrival: z.boolean().default(false),
  metaTitle: z.string().max(160).optional(),
  metaDescription: z.string().max(320).optional(),
  images: z.array(imageInput).max(10).optional(),
  variants: z.array(variantInput).max(50).optional(),
});

export const updateProductSchema = createProductSchema.partial();

export const createCategorySchema = z.object({
  name: z.string().trim().min(2).max(80),
  slug: z.string().trim().min(2).max(90).optional(),
  description: z.string().trim().max(500).optional(),
  imageUrl: z.string().url().optional(),
  sortOrder: z.number().int().nonnegative().default(0),
  isActive: z.boolean().default(true),
});

export const updateCategorySchema = createCategorySchema.partial();

export const idParamSchema = z.object({ id: z.string().uuid() });
export const slugParamSchema = z.object({ slug: z.string().trim().min(1) });
