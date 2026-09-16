import { z } from 'zod';

export const validateCouponSchema = z.object({
  code: z
    .string()
    .trim()
    .min(2, 'Enter a coupon code')
    .max(40)
    .transform((s) => s.toUpperCase()),
});

export type ValidateCouponInput = z.infer<typeof validateCouponSchema>;
