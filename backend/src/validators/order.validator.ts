import { z } from 'zod';
import { OrderStatus } from '@prisma/client';
import { addressBodySchema } from './address.validator';

export const createOrderSchema = z
  .object({
    // Either a saved address id OR an inline address is required.
    addressId: z.string().uuid().optional(),
    address: addressBodySchema.optional(),
    saveAddress: z.boolean().optional().default(false),
    shippingRateId: z.string().uuid('Select a shipping method'),
    couponCode: z
      .string()
      .trim()
      .min(2)
      .max(40)
      .transform((s) => s.toUpperCase())
      .optional(),
    note: z.string().trim().max(500).optional(),
  })
  .refine((v) => Boolean(v.addressId) !== Boolean(v.address), {
    message: 'Provide either a saved addressId or a new address',
    path: ['addressId'],
  });

export const orderNumberParam = z.object({
  orderNumber: z.string().trim().min(4).max(40),
});

export const listOrdersQuery = z.object({
  status: z.nativeEnum(OrderStatus).optional(),
});

export type CreateOrderInput = z.infer<typeof createOrderSchema>;
