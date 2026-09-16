import { z } from 'zod';
import { CouponType, OrderStatus, Role } from '@prisma/client';

const money = z.number().int().nonnegative();

/** ?from=YYYY-MM-DD&to=YYYY-MM-DD — defaults to the last 30 days. */
export const analyticsQuerySchema = z.object({
  from: z.coerce.date().optional(),
  to: z.coerce.date().optional(),
});
export type AnalyticsQuery = z.infer<typeof analyticsQuerySchema>;

export const adminOrderListQuery = z.object({
  status: z.nativeEnum(OrderStatus).optional(),
  q: z.string().trim().max(120).optional(),
});

export const updateOrderSchema = z
  .object({
    status: z.nativeEnum(OrderStatus).optional(),
    trackingNumber: z.string().trim().max(120).nullish(),
    adminNotes: z.string().trim().max(2000).nullish(),
  })
  .refine((v) => v.status !== undefined || v.trackingNumber !== undefined || v.adminNotes !== undefined, {
    message: 'Provide at least one field to update',
  });
export type UpdateOrderInput = z.infer<typeof updateOrderSchema>;

export const customerListQuery = z.object({
  q: z.string().trim().max(120).optional(),
  role: z.nativeEnum(Role).optional(),
});

export const setActiveSchema = z.object({ isActive: z.boolean() });

export const reviewModerationQuery = z.object({
  approved: z
    .enum(['true', 'false'])
    .transform((v) => v === 'true')
    .optional(),
  productId: z.string().uuid().optional(),
});

export const setApprovalSchema = z.object({ isApproved: z.boolean() });

export const adminProductListQuery = z.object({
  q: z.string().trim().max(120).optional(),
  includeDeleted: z
    .enum(['true', 'false'])
    .transform((v) => v === 'true')
    .optional(),
});

// --- Coupons ---

const couponBase = z.object({
  code: z.string().trim().min(2).max(40),
  description: z.string().trim().max(200).nullish(),
  type: z.nativeEnum(CouponType),
  value: z.number().int().positive(),
  minOrderAmount: money.nullish(),
  maxDiscount: money.nullish(),
  usageLimit: z.number().int().positive().nullish(),
  perUserLimit: z.number().int().positive().nullish(),
  startsAt: z.coerce.date().nullish(),
  expiresAt: z.coerce.date().nullish(),
  isActive: z.boolean().optional(),
  applicableProductIds: z.array(z.string().uuid()).max(200).optional(),
  applicableCategoryIds: z.array(z.string().uuid()).max(100).optional(),
});

// Percentage coupons must be 1..100; fixed coupons are an amount in kobo.
const percentRefine = (v: { type: CouponType; value: number }) =>
  v.type !== CouponType.PERCENTAGE || (v.value >= 1 && v.value <= 100);
const dateRefine = (v: { startsAt?: Date | null; expiresAt?: Date | null }) =>
  !v.startsAt || !v.expiresAt || v.startsAt < v.expiresAt;

export const createCouponSchema = couponBase
  .refine(percentRefine, { message: 'Percentage coupons must have a value between 1 and 100', path: ['value'] })
  .refine(dateRefine, { message: 'startsAt must be before expiresAt', path: ['expiresAt'] });

export const updateCouponSchema = couponBase
  .partial()
  .refine((v) => v.type === undefined || v.value === undefined || percentRefine(v as { type: CouponType; value: number }), {
    message: 'Percentage coupons must have a value between 1 and 100',
    path: ['value'],
  })
  .refine(dateRefine, { message: 'startsAt must be before expiresAt', path: ['expiresAt'] });
