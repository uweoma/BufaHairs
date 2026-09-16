import { CouponType, Prisma, PrismaClient } from '@prisma/client';
import { prisma } from '../config/prisma';
import { ApiError } from '../utils/ApiError';
import { formatNaira } from '../utils/money';

type Db = PrismaClient | Prisma.TransactionClient;

/** A cart line reduced to what coupon math needs. */
export interface CouponLine {
  productId: string;
  categoryId: string | null;
  lineTotal: number; // kobo
}

export interface CouponEvaluation {
  couponId: string;
  code: string;
  type: CouponType;
  value: number;
  description: string | null;
  discount: number; // kobo
  eligibleSubtotal: number; // kobo the discount was computed against
}

/** Reads the user's cart as coupon lines (authoritative subtotal, server-side). */
export async function loadCartLines(
  userId: string,
  client: Db = prisma,
): Promise<{ lines: CouponLine[]; subtotal: number }> {
  const items = await client.cartItem.findMany({
    where: { cart: { userId } },
    include: {
      product: { select: { id: true, categoryId: true, price: true } },
      variant: { select: { priceOverride: true } },
    },
  });
  const lines: CouponLine[] = items.map((it) => {
    const unit = it.variant?.priceOverride ?? it.product.price;
    return {
      productId: it.productId,
      categoryId: it.product.categoryId,
      lineTotal: unit * it.quantity,
    };
  });
  const subtotal = lines.reduce((sum, l) => sum + l.lineTotal, 0);
  return { lines, subtotal };
}

/**
 * Core coupon engine — fully backend-authoritative. Validates state, window,
 * usage limits, minimum order and product/category scope, then computes the
 * discount in kobo. Throws ApiError with a shopper-friendly message on failure.
 * Safe to run inside a transaction (pass the tx client).
 */
export async function evaluateCoupon(
  code: string,
  userId: string,
  lines: CouponLine[],
  subtotal: number,
  client: Db = prisma,
): Promise<CouponEvaluation> {
  const coupon = await client.coupon.findUnique({
    where: { code: code.toUpperCase() },
    include: {
      applicableProducts: { select: { id: true } },
      applicableCategories: { select: { id: true } },
    },
  });

  if (!coupon || !coupon.isActive) {
    throw ApiError.badRequest('Invalid or inactive coupon code');
  }

  const now = new Date();
  if (coupon.startsAt && now < coupon.startsAt) {
    throw ApiError.badRequest('This coupon is not active yet');
  }
  if (coupon.expiresAt && now > coupon.expiresAt) {
    throw ApiError.badRequest('This coupon has expired');
  }
  if (coupon.usageLimit != null && coupon.usedCount >= coupon.usageLimit) {
    throw ApiError.badRequest('This coupon has reached its usage limit');
  }
  if (coupon.perUserLimit != null) {
    const usedByUser = await client.couponUsage.count({
      where: { couponId: coupon.id, userId },
    });
    if (usedByUser >= coupon.perUserLimit) {
      throw ApiError.badRequest('You have already used this coupon');
    }
  }
  if (coupon.minOrderAmount != null && subtotal < coupon.minOrderAmount) {
    throw ApiError.badRequest(
      `Add items worth ${formatNaira(coupon.minOrderAmount - subtotal)} more to use this coupon (minimum ${formatNaira(coupon.minOrderAmount)})`,
    );
  }

  // Determine the subtotal the discount applies to (product/category scope).
  const productIds = new Set(coupon.applicableProducts.map((p) => p.id));
  const categoryIds = new Set(coupon.applicableCategories.map((c) => c.id));
  const scoped = productIds.size > 0 || categoryIds.size > 0;

  const eligibleSubtotal = scoped
    ? lines
        .filter(
          (l) => productIds.has(l.productId) || (l.categoryId != null && categoryIds.has(l.categoryId)),
        )
        .reduce((sum, l) => sum + l.lineTotal, 0)
    : subtotal;

  if (scoped && eligibleSubtotal <= 0) {
    throw ApiError.badRequest('This coupon does not apply to the items in your cart');
  }

  let discount: number;
  if (coupon.type === CouponType.PERCENTAGE) {
    discount = Math.floor((eligibleSubtotal * coupon.value) / 100);
    if (coupon.maxDiscount != null) discount = Math.min(discount, coupon.maxDiscount);
  } else {
    discount = Math.min(coupon.value, eligibleSubtotal);
  }
  // Never discount more than the order is worth.
  discount = Math.min(discount, subtotal);

  if (discount <= 0) {
    throw ApiError.badRequest('This coupon provides no discount on your order');
  }

  return {
    couponId: coupon.id,
    code: coupon.code,
    type: coupon.type,
    value: coupon.value,
    description: coupon.description,
    discount,
    eligibleSubtotal,
  };
}

/** POST /coupons/validate — previews a coupon against the user's live cart. */
export async function validateForCart(userId: string, code: string) {
  const { lines, subtotal } = await loadCartLines(userId);
  if (subtotal <= 0) {
    throw ApiError.badRequest('Your cart is empty');
  }
  const result = await evaluateCoupon(code, userId, lines, subtotal);
  return {
    valid: true,
    code: result.code,
    type: result.type,
    description: result.description,
    discount: result.discount,
    subtotal,
    total: subtotal - result.discount,
  };
}

// --------------------------- Admin operations ------------------------------

const adminCouponInclude = {
  applicableProducts: { select: { id: true, name: true, slug: true } },
  applicableCategories: { select: { id: true, name: true, slug: true } },
  _count: { select: { usages: true } },
} satisfies Prisma.CouponInclude;

type AdminCouponPayload = Prisma.CouponGetPayload<{ include: typeof adminCouponInclude }>;

function serializeCoupon(c: AdminCouponPayload) {
  return {
    id: c.id,
    code: c.code,
    description: c.description,
    type: c.type,
    value: c.value,
    minOrderAmount: c.minOrderAmount,
    maxDiscount: c.maxDiscount,
    usageLimit: c.usageLimit,
    perUserLimit: c.perUserLimit,
    usedCount: c.usedCount,
    timesRedeemed: c._count.usages,
    startsAt: c.startsAt,
    expiresAt: c.expiresAt,
    isActive: c.isActive,
    applicableProducts: c.applicableProducts,
    applicableCategories: c.applicableCategories,
    createdAt: c.createdAt,
    updatedAt: c.updatedAt,
  };
}

export interface CouponWriteInput {
  code: string;
  description?: string | null;
  type: CouponType;
  value: number;
  minOrderAmount?: number | null;
  maxDiscount?: number | null;
  usageLimit?: number | null;
  perUserLimit?: number | null;
  startsAt?: Date | null;
  expiresAt?: Date | null;
  isActive?: boolean;
  applicableProductIds?: string[];
  applicableCategoryIds?: string[];
}

export async function listCoupons(opts: { page: number; limit: number; skip: number }) {
  const [coupons, total] = await Promise.all([
    prisma.coupon.findMany({
      include: adminCouponInclude,
      orderBy: { createdAt: 'desc' },
      skip: opts.skip,
      take: opts.limit,
    }),
    prisma.coupon.count(),
  ]);
  return { coupons: coupons.map(serializeCoupon), total };
}

export async function getCoupon(id: string) {
  const coupon = await prisma.coupon.findUnique({ where: { id }, include: adminCouponInclude });
  if (!coupon) throw ApiError.notFound('Coupon not found');
  return serializeCoupon(coupon);
}

function buildScopeConnect(input: CouponWriteInput) {
  return {
    applicableProducts: input.applicableProductIds?.length
      ? { connect: input.applicableProductIds.map((id) => ({ id })) }
      : undefined,
    applicableCategories: input.applicableCategoryIds?.length
      ? { connect: input.applicableCategoryIds.map((id) => ({ id })) }
      : undefined,
  };
}

export async function createCoupon(input: CouponWriteInput) {
  const code = input.code.toUpperCase();
  const existing = await prisma.coupon.findUnique({ where: { code } });
  if (existing) throw ApiError.conflict('A coupon with this code already exists');

  const coupon = await prisma.coupon.create({
    data: {
      code,
      description: input.description ?? null,
      type: input.type,
      value: input.value,
      minOrderAmount: input.minOrderAmount ?? null,
      maxDiscount: input.maxDiscount ?? null,
      usageLimit: input.usageLimit ?? null,
      perUserLimit: input.perUserLimit ?? null,
      startsAt: input.startsAt ?? null,
      expiresAt: input.expiresAt ?? null,
      isActive: input.isActive ?? true,
      ...buildScopeConnect(input),
    },
    include: adminCouponInclude,
  });
  return serializeCoupon(coupon);
}

export async function updateCoupon(id: string, input: Partial<CouponWriteInput>) {
  const existing = await prisma.coupon.findUnique({ where: { id } });
  if (!existing) throw ApiError.notFound('Coupon not found');

  if (input.code && input.code.toUpperCase() !== existing.code) {
    const clash = await prisma.coupon.findUnique({ where: { code: input.code.toUpperCase() } });
    if (clash) throw ApiError.conflict('A coupon with this code already exists');
  }

  const data: Prisma.CouponUpdateInput = {};
  if (input.code !== undefined) data.code = input.code.toUpperCase();
  if (input.description !== undefined) data.description = input.description ?? null;
  if (input.type !== undefined) data.type = input.type;
  if (input.value !== undefined) data.value = input.value;
  if (input.minOrderAmount !== undefined) data.minOrderAmount = input.minOrderAmount ?? null;
  if (input.maxDiscount !== undefined) data.maxDiscount = input.maxDiscount ?? null;
  if (input.usageLimit !== undefined) data.usageLimit = input.usageLimit ?? null;
  if (input.perUserLimit !== undefined) data.perUserLimit = input.perUserLimit ?? null;
  if (input.startsAt !== undefined) data.startsAt = input.startsAt ?? null;
  if (input.expiresAt !== undefined) data.expiresAt = input.expiresAt ?? null;
  if (input.isActive !== undefined) data.isActive = input.isActive;
  // Replace scope only when explicitly provided (set = full replace).
  if (input.applicableProductIds !== undefined) {
    data.applicableProducts = { set: input.applicableProductIds.map((pid) => ({ id: pid })) };
  }
  if (input.applicableCategoryIds !== undefined) {
    data.applicableCategories = { set: input.applicableCategoryIds.map((cid) => ({ id: cid })) };
  }

  const coupon = await prisma.coupon.update({ where: { id }, data, include: adminCouponInclude });
  return serializeCoupon(coupon);
}

export async function deleteCoupon(id: string) {
  const existing = await prisma.coupon.findUnique({
    where: { id },
    include: { _count: { select: { usages: true, orders: true } } },
  });
  if (!existing) throw ApiError.notFound('Coupon not found');
  // Preserve history: deactivate coupons that have already been used/ordered.
  if (existing._count.usages > 0 || existing._count.orders > 0) {
    await prisma.coupon.update({ where: { id }, data: { isActive: false } });
    return { deleted: false, deactivated: true };
  }
  await prisma.coupon.delete({ where: { id } });
  return { deleted: true, deactivated: false };
}
