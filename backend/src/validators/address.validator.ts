import { z } from 'zod';

const phone = z
  .string()
  .trim()
  .min(7, 'Enter a valid phone number')
  .max(20)
  .regex(/^\+?[0-9\s-]{7,20}$/, 'Enter a valid phone number');

export const addressBodySchema = z.object({
  label: z.string().trim().max(40).nullish(),
  fullName: z.string().trim().min(2, 'Full name is required').max(120),
  phone,
  addressLine1: z.string().trim().min(3, 'Address is required').max(200),
  addressLine2: z.string().trim().max(200).nullish(),
  city: z.string().trim().min(2, 'City is required').max(80),
  state: z.string().trim().min(2, 'State is required').max(80),
  country: z.string().trim().min(2).max(60).default('Nigeria'),
  postalCode: z.string().trim().max(20).nullish(),
  isDefault: z.boolean().optional(),
});

export const updateAddressSchema = addressBodySchema.partial();

export const addressIdParam = z.object({ id: z.string().uuid('Invalid address id') });

export type AddressBodyInput = z.infer<typeof addressBodySchema>;
export type UpdateAddressInput = z.infer<typeof updateAddressSchema>;
