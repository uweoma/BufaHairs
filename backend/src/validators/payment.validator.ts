import { z } from 'zod';

export const verifyPaymentSchema = z.object({
  reference: z.string().trim().min(4, 'Payment reference is required').max(120),
});

export type VerifyPaymentInput = z.infer<typeof verifyPaymentSchema>;
