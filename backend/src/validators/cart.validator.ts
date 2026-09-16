import { z } from 'zod';

export const addCartItemSchema = z.object({
  productId: z.string().uuid(),
  variantId: z.string().uuid().nullish(),
  quantity: z.number().int().positive().max(99).default(1),
});

export const updateCartItemSchema = z.object({
  quantity: z.number().int().positive().max(99),
});

export const cartItemIdParam = z.object({ id: z.string().uuid() });

export const mergeCartSchema = z.object({
  items: z
    .array(
      z.object({
        productId: z.string().uuid(),
        variantId: z.string().uuid().nullish(),
        quantity: z.number().int().positive().max(99),
      }),
    )
    .max(100),
});

export type AddCartItemInput = z.infer<typeof addCartItemSchema>;
export type MergeCartInput = z.infer<typeof mergeCartSchema>;
