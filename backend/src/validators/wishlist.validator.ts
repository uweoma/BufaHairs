import { z } from 'zod';

export const productIdParam = z.object({
  productId: z.string().uuid('Invalid product id'),
});

export type ProductIdParam = z.infer<typeof productIdParam>;
