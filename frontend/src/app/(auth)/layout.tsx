import Link from 'next/link';
import { Sparkles } from 'lucide-react';
import { Logo } from '@/components/layout/logo';
import { BRAND_NAME } from '@/lib/constants';

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="grid min-h-[calc(100vh-6.25rem)] lg:grid-cols-2">
      {/* Brand panel */}
      <div className="relative hidden overflow-hidden bg-luxe text-white lg:flex lg:flex-col lg:justify-between lg:p-12">
        <Link href="/">
          <span className="font-serif text-2xl font-bold text-white">{BRAND_NAME}</span>
        </Link>
        <div className="relative z-10 max-w-md">
          <Sparkles className="h-10 w-10 text-gold" />
          <blockquote className="mt-6 font-serif text-3xl font-medium leading-snug">
            “The quality is unmatched. I feel like royalty every single day.”
          </blockquote>
          <p className="mt-4 text-white/70">— A very happy BufaHairs customer</p>
        </div>
        <p className="relative z-10 text-sm text-white/50">
          Premium human hair, crafted for confidence.
        </p>
        <div className="pointer-events-none absolute -right-24 top-1/3 h-96 w-96 rounded-full bg-primary-royal/40 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-24 -left-10 h-80 w-80 rounded-full bg-gold/20 blur-3xl" />
      </div>

      {/* Form panel */}
      <div className="flex items-center justify-center px-4 py-12 sm:px-8">
        <div className="w-full max-w-md">
          <div className="mb-8 lg:hidden">
            <Logo />
          </div>
          {children}
        </div>
      </div>
    </div>
  );
}
