'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect } from 'react';
import {
  LayoutDashboard,
  ShoppingBag,
  Package,
  Users,
  Ticket,
  Star,
  Store,
} from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { useAuth } from '@/hooks/use-auth';
import { cn } from '@/lib/utils';

const NAV = [
  { href: '/admin', label: 'Dashboard', icon: LayoutDashboard, exact: true },
  { href: '/admin/orders', label: 'Orders', icon: ShoppingBag },
  { href: '/admin/products', label: 'Products', icon: Package },
  { href: '/admin/customers', label: 'Customers', icon: Users },
  { href: '/admin/coupons', label: 'Coupons', icon: Ticket },
  { href: '/admin/reviews', label: 'Reviews', icon: Star },
];

export function AdminShell({ children }: { children: React.ReactNode }) {
  const { status, isAdmin } = useAuth();
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.replace(`/login?redirect=${encodeURIComponent(pathname)}`);
    } else if (status === 'authenticated' && !isAdmin) {
      router.replace('/account');
    }
  }, [status, isAdmin, pathname, router]);

  if (status !== 'authenticated' || !isAdmin) {
    return (
      <div className="container py-10">
        <div className="grid gap-8 lg:grid-cols-[240px_1fr]">
          <Skeleton className="h-96 rounded-2xl" />
          <Skeleton className="h-96 rounded-2xl" />
        </div>
      </div>
    );
  }

  return (
    <div className="container py-8 lg:py-10">
      <div className="grid gap-8 lg:grid-cols-[240px_1fr]">
        <aside className="lg:sticky lg:top-24 lg:self-start">
          <div className="rounded-2xl border bg-card p-4">
            <p className="px-3 pb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Admin
            </p>
            <nav className="space-y-1">
              {NAV.map((item) => {
                const active = item.exact ? pathname === item.href : pathname.startsWith(item.href);
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={cn(
                      'flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors',
                      active
                        ? 'bg-primary/10 text-primary-deep'
                        : 'text-muted-foreground hover:bg-secondary hover:text-foreground',
                    )}
                  >
                    <item.icon className="h-4 w-4" />
                    {item.label}
                  </Link>
                );
              })}
            </nav>
            <div className="mt-4 border-t pt-3">
              <Link
                href="/"
                className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
              >
                <Store className="h-4 w-4" />
                Back to store
              </Link>
            </div>
          </div>
        </aside>

        <div className="min-w-0">{children}</div>
      </div>
    </div>
  );
}
