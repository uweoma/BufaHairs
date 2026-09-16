import { z } from 'zod';

export const shippingQuoteSchema = z.object({
  country: z.string().trim().min(1).max(60).optional(),
  state: z.string().trim().min(1).max(60).optional(),
  // Client-supplied estimate for preview only; order shipping is recomputed
  // server-side from the authoritative cart subtotal.
  subtotal: z.coerce.number().int().nonnegative().optional(),
});

export type ShippingQuoteInput = z.infer<typeof shippingQuoteSchema>;
