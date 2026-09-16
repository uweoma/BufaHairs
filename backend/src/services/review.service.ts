import { OrderStatus, Prisma } from '@prisma/client';
import { prisma } from '../config/prisma';
import { ApiError } from '../utils/ApiError';
import type { CreateReviewInput, UpdateReviewInput } from '../validators/review.validator';

// Order states that count as a completed purchase.
const PURCHASED_STATES: OrderStatus[] = [
  OrderStatus.PAID,
  OrderStatus.PROCESSING,
  OrderStatus.SHIPPED,
  OrderStatus.DELIVERED,
];

const reviewInclude = {
  user: { select: { fullName: true, avatarUrl: true } },
} satisfies Prisma.ReviewInclude;

type ReviewPayload = Prisma.ReviewGetPayload<{ include: typeof reviewInclude }>;

function serializeReview(r: ReviewPayload) {
  return {
    id: r.id,
    rating: r.rating,
    title: r.title,
    comment: r.comment,
    imageUrl: r.imageUrl,
    isVerified: r.isVerified,
    createdAt: r.createdAt,
    author: { name: r.user.fullName, avatarUrl: r.user.avatarUrl },
  };
}

/** Recomputes a product's rating aggregates from its APPROVED reviews. */
async function recomputeRating(tx: Prisma.TransactionClient, productId: string) {
  const agg = await tx.review.aggregate({
    where: { productId, isApproved: true },
    _avg: { rating: true },
    _count: true,
  });
  await tx.product.update({
    where: { id: productId },
    data: {
      ratingAvg: agg._avg.rating ? Math.round(agg._avg.rating * 10) / 10 : 0,
      ratingCount: agg._count,
    },
  });
}

/** Finds a completed order containing the product, or throws 403. */
async function assertVerifiedPurchase(userId: string, productId: string): Promise<string> {
  const orderItem = await prisma.orderItem.findFirst({
    where: { productId, order: { userId, status: { in: PURCHASED_STATES } } },
    select: { orderId: true },
    orderBy: { order: { createdAt: 'desc' } },
  });
  if (!orderItem) {
    throw ApiError.forbidden('Only verified purchasers can review this product');
  }
  return orderItem.orderId;
}

async function resolveProductBySlug(slug: string) {
  const product = await prisma.product.findFirst({
    where: { slug, isActive: true, deletedAt: null },
    select: { id: true },
  });
  if (!product) throw ApiError.notFound('Product not found');
  return product.id;
}

export async function listProductReviews(
  slug: string,
  opts: { page: number; limit: number; skip: number },
) {
  const productId = await resolveProductBySlug(slug);
  const where = { productId, isApproved: true };

  const [reviews, total, grouped] = await Promise.all([
    prisma.review.findMany({
      where,
      include: reviewInclude,
      orderBy: [{ isVerified: 'desc' }, { createdAt: 'desc' }],
      skip: opts.skip,
      take: opts.limit,
    }),
    prisma.review.count({ where }),
    prisma.review.groupBy({ by: ['rating'], where, _count: true }),
  ]);

  const distribution: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
  for (const g of grouped) distribution[g.rating] = g._count;
  const sum = grouped.reduce((acc, g) => acc + g.rating * g._count, 0);
  const average = total > 0 ? Math.round((sum / total) * 10) / 10 : 0;

  return {
    reviews: reviews.map(serializeReview),
    summary: { average, total, distribution },
  };
}

export async function createReview(userId: string, slug: string, input: CreateReviewInput) {
  const productId = await resolveProductBySlug(slug);
  const orderId = await assertVerifiedPurchase(userId, productId);

  const existing = await prisma.review.findUnique({
    where: { userId_productId: { userId, productId } },
  });
  if (existing) throw ApiError.conflict('You have already reviewed this product');

  const review = await prisma.$transaction(async (tx) => {
    const created = await tx.review.create({
      data: {
        userId,
        productId,
        orderId,
        rating: input.rating,
        title: input.title ?? null,
        comment: input.comment,
        isVerified: true,
        // Verified-purchase reviews are auto-approved; admins can still unapprove.
        isApproved: true,
      },
      include: reviewInclude,
    });
    await recomputeRating(tx, productId);
    return created;
  });
  return serializeReview(review);
}

export async function updateReview(userId: string, id: string, input: UpdateReviewInput) {
  const existing = await prisma.review.findFirst({ where: { id, userId } });
  if (!existing) throw ApiError.notFound('Review not found');

  const review = await prisma.$transaction(async (tx) => {
    const updated = await tx.review.update({
      where: { id },
      data: {
        rating: input.rating,
        title: input.title === undefined ? undefined : input.title,
        comment: input.comment,
      },
      include: reviewInclude,
    });
    await recomputeRating(tx, existing.productId);
    return updated;
  });
  return serializeReview(review);
}

export async function deleteReview(userId: string, id: string) {
  const existing = await prisma.review.findFirst({ where: { id, userId } });
  if (!existing) throw ApiError.notFound('Review not found');
  await prisma.$transaction(async (tx) => {
    await tx.review.delete({ where: { id } });
    await recomputeRating(tx, existing.productId);
  });
}

// --- Admin moderation (used by the admin module) ---

const adminReviewInclude = {
  user: { select: { fullName: true, email: true } },
  product: { select: { name: true, slug: true } },
} satisfies Prisma.ReviewInclude;

type AdminReviewPayload = Prisma.ReviewGetPayload<{ include: typeof adminReviewInclude }>;

function serializeAdminReview(r: AdminReviewPayload) {
  return {
    id: r.id,
    rating: r.rating,
    title: r.title,
    comment: r.comment,
    imageUrl: r.imageUrl,
    isApproved: r.isApproved,
    isVerified: r.isVerified,
    createdAt: r.createdAt,
    product: r.product,
    author: { name: r.user.fullName, email: r.user.email },
  };
}

export async function adminListReviews(opts: {
  page: number;
  limit: number;
  skip: number;
  approved?: boolean;
  productId?: string;
}) {
  const where: Prisma.ReviewWhereInput = {};
  if (opts.approved !== undefined) where.isApproved = opts.approved;
  if (opts.productId) where.productId = opts.productId;

  const [reviews, total] = await Promise.all([
    prisma.review.findMany({
      where,
      include: adminReviewInclude,
      orderBy: { createdAt: 'desc' },
      skip: opts.skip,
      take: opts.limit,
    }),
    prisma.review.count({ where }),
  ]);
  return { reviews: reviews.map(serializeAdminReview), total };
}

export async function adminDeleteReview(id: string) {
  const existing = await prisma.review.findUnique({ where: { id } });
  if (!existing) throw ApiError.notFound('Review not found');
  await prisma.$transaction(async (tx) => {
    await tx.review.delete({ where: { id } });
    await recomputeRating(tx, existing.productId);
  });
}

export async function setApproval(id: string, isApproved: boolean) {
  const existing = await prisma.review.findUnique({ where: { id } });
  if (!existing) throw ApiError.notFound('Review not found');
  const review = await prisma.$transaction(async (tx) => {
    const updated = await tx.review.update({
      where: { id },
      data: { isApproved },
      include: reviewInclude,
    });
    await recomputeRating(tx, existing.productId);
    return updated;
  });
  return serializeReview(review);
}
