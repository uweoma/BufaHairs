'use client';

import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useState } from 'react';
import { AlertCircle } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { PasswordInput } from './password-input';
import { http, ApiError } from '@/lib/api';

const schema = z
  .object({
    password: z
      .string()
      .min(8, 'At least 8 characters')
      .regex(/[a-z]/, 'Include a lowercase letter')
      .regex(/[A-Z]/, 'Include an uppercase letter')
      .regex(/[0-9]/, 'Include a number'),
    confirmPassword: z.string(),
  })
  .refine((d) => d.password === d.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  });

type FormValues = z.infer<typeof schema>;

export function ResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get('token') ?? '';
  const [formError, setFormError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({ resolver: zodResolver(schema) });

  const onSubmit = async (values: FormValues) => {
    setFormError(null);
    try {
      await http.post(
        '/auth/reset-password',
        { token, password: values.password, confirmPassword: values.confirmPassword },
        { auth: false },
      );
      toast.success('Password updated. Please sign in with your new password.');
      router.push('/login');
    } catch (err) {
      setFormError(
        err instanceof ApiError
          ? err.message
          : 'Unable to reset your password. Please request a new link.',
      );
    }
  };

  if (!token) {
    return (
      <div>
        <h1 className="font-serif text-3xl font-semibold">Invalid reset link</h1>
        <p className="mt-2 text-muted-foreground">
          This password reset link is missing or has expired. Please request a new one.
        </p>
        <Button asChild className="mt-6">
          <Link href="/forgot-password">Request new link</Link>
        </Button>
      </div>
    );
  }

  return (
    <div>
      <h1 className="font-serif text-3xl font-semibold">Set a new password</h1>
      <p className="mt-2 text-muted-foreground">Choose a strong password for your account.</p>

      <form onSubmit={handleSubmit(onSubmit)} className="mt-8 space-y-5" noValidate>
        {formError && (
          <div className="flex items-start gap-2 rounded-xl border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive">
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
            <span>{formError}</span>
          </div>
        )}

        <div className="space-y-1.5">
          <Label htmlFor="password">New password</Label>
          <PasswordInput id="password" autoComplete="new-password" {...register('password')} aria-invalid={!!errors.password} />
          {errors.password && <p className="text-xs text-destructive">{errors.password.message}</p>}
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="confirmPassword">Confirm new password</Label>
          <PasswordInput id="confirmPassword" autoComplete="new-password" {...register('confirmPassword')} aria-invalid={!!errors.confirmPassword} />
          {errors.confirmPassword && <p className="text-xs text-destructive">{errors.confirmPassword.message}</p>}
        </div>

        <Button type="submit" className="w-full" size="lg" loading={isSubmitting}>
          Reset Password
        </Button>
      </form>

      <p className="mt-6 text-center text-sm">
        <Link href="/login" className="font-medium text-primary hover:underline">
          Back to sign in
        </Link>
      </p>
    </div>
  );
}
