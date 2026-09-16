import { prisma } from '../config/prisma';
import { ApiError } from '../utils/ApiError';
import { slugify } from '../utils/slugify';
import type { z } from 'zod';
import type { createCategorySchema, updateCategorySchema } from '../validators/product.validator';

type CreateCategoryInput = z.infer<typeof createCategorySchema>;
type UpdateCategoryInput = z.infer<typeof updateCategorySchema>;

async function attachCounts<T extends { id: string }>(categories: T[]) {
  const counts = await prisma.product.groupBy({
    by: ['categoryId'],
    where: { isActive: true, deletedAt: null },
    _count: { _all: true },
  });
  const map = new Map(counts.map((c) => [c.categoryId, c._count._all]));
  return categories.map((c) => ({ ...c, productCount: map.get(c.id) ?? 0 }));
}

export async function listCategories(activeOnly = true) {
  const categories = await prisma.category.findMany({
    where: activeOnly ? { isActive: true } : undefined,
    orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }],
  });
  return attachCounts(categories);
}

export async function getCategoryBySlug(slug: string) {
  const category = await prisma.category.findUnique({ where: { slug } });
  if (!category) throw ApiError.notFound('Category not found');
  const [withCount] = await attachCounts([category]);
  return withCount;
}

async function ensureUniqueSlug(base: string, excludeId?: string): Promise<string> {
  let slug = slugify(base);
  let n = 1;
  // eslint-disable-next-line no-constant-condition
  while (true) {
    const existing = await prisma.category.findUnique({ where: { slug } });
    if (!existing || existing.id === excludeId) return slug;
    slug = `${slugify(base)}-${n++}`;
  }
}

export async function createCategory(input: CreateCategoryInput) {
  const slug = await ensureUniqueSlug(input.slug ?? input.name);
  return prisma.category.create({ data: { ...input, slug } });
}

export async function updateCategory(id: string, input: UpdateCategoryInput) {
  const existing = await prisma.category.findUnique({ where: { id } });
  if (!existing) throw ApiError.notFound('Category not found');
  const data: Record<string, unknown> = { ...input };
  if (input.slug) data.slug = await ensureUniqueSlug(input.slug, id);
  return prisma.category.update({ where: { id }, data });
}

export async function deleteCategory(id: string) {
  const count = await prisma.product.count({ where: { categoryId: id, deletedAt: null } });
  if (count > 0) {
    throw ApiError.conflict('Cannot delete a category that still has products. Reassign them first.');
  }
  await prisma.category.delete({ where: { id } });
}
