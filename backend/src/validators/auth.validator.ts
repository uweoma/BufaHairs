import { z } from 'zod';

const password = z
  .string()
  .min(8, 'Password must be at least 8 characters')
  .max(72, 'Password must be at most 72 characters')
  .regex(/[a-z]/, 'Password must contain a lowercase letter')
  .regex(/[A-Z]/, 'Password must contain an uppercase letter')
  .regex(/[0-9]/, 'Password must contain a number');

const email = z.string().trim().toLowerCase().email('Enter a valid email address');

export const registerSchema = z
  .object({
    fullName: z.string().trim().min(2, 'Name is too short').max(100),
    email,
    phone: z
      .string()
      .trim()
      .min(7)
      .max(20)
      .regex(/^[+0-9()\-\s]+$/, 'Enter a valid phone number')
      .optional(),
    password,
    confirmPassword: z.string(),
  })
  .refine((d) => d.password === d.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  });

export const loginSchema = z.object({
  email,
  password: z.string().min(1, 'Password is required'),
});

export const forgotPasswordSchema = z.object({ email });

export const resetPasswordSchema = z
  .object({
    token: z.string().min(10, 'Invalid reset token'),
    password,
    confirmPassword: z.string(),
  })
  .refine((d) => d.password === d.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  });

export const verifyEmailSchema = z.object({
  token: z.string().min(10, 'Invalid verification token'),
});

export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
