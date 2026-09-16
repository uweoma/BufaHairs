import type { Metadata } from 'next';
import { Suspense } from 'react';
import { ResetPasswordForm } from '@/components/auth/reset-password-form';

export const metadata: Metadata = {
  title: 'Reset Password',
  description: 'Set a new password for your BufaHairs account.',
};

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={<div className="h-96" />}>
      <ResetPasswordForm />
    </Suspense>
  );
}
