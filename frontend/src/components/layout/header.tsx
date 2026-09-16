'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Heart, ShoppingBag } from 'lucide-react';
import { Logo } from './logo';
import { SearchBar } from './search-bar';
import { AccountMenu } from './account-menu';
import { NotificationBell } from './notification-bell';
import { MobileNav } from './mobile-nav';
import { Button } from '@/components/ui/button';
import { MAIN_NAV } from '@/lib/constants';
import { cn } from '@/lib/utils';
import { useCart } from '@/hooks/use-cart';
import { useWishlist } from '@/hooks/use-wishlist';
import { useUIStore } from '@/store/ui-store';

function CountBadge({ count }: { count: number }) {
  if (count <= 0) return null;
  return (
    <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-primary px-1 text-[10px] font-semibold leading-none text-primary-foreground">
      {count > 9 ? '9+' : count}
    </span>
  );
}

export function Header() {
  const pathname = usePathname();
  const { itemCount } = useCart();
  const { count: wishlistCount } = useWishlist();
  const openCart = useUIStore((s) => s.openCart);

  return (
    <header className="sticky top-0 z-40 w-full">
      {/* Announcement bar */}
      <div className="bg-primary-deep text-center text-xs font-medium text-white">
        <div className="container flex h-9 items-center justify-center gap-2">
          <span>✨ Free express shipping on orders over ₦150,000 — nationwide</span>
        </div>
      </div>

      {/* Main bar */}
      <div className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80">
        <div className="container flex h-16 items-center gap-3 lg:h-20">
          <MobileNav />
          <Logo className="mr-2 shrink-0" />

          {/* Desktop nav */}
          <nav className="hidden items-center gap-1 lg:flex">
            {MAIN_NAV.map((item) => {
              const active = pathname === item.href.split('?')[0];
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    'rounded-full px-3 py-2 text-sm font-medium text-foreground/80 transition-colors hover:bg-accent hover:text-foreground',
                    active && 'text-primary',
                  )}
                >
                  {item.label}
                </Link>
              );
            })}
          </nav>

          {/* Search — takes remaining space on desktop */}
          <div className="ml-auto hidden max-w-sm flex-1 lg:block">
            <SearchBar />
          </div>

          {/* Actions */}
          <div className="ml-auto flex items-center gap-0.5 lg:ml-2">
            <Button
              asChild
              variant="ghost"
              size="icon"
              className="relative hidden sm:inline-flex"
              aria-label="Wishlist"
            >
              <Link href="/wishlist">
                <Heart className="h-5 w-5" />
                <CountBadge count={wishlistCount} />
              </Link>
            </Button>

            <NotificationBell />
            <AccountMenu />

            <Button
              variant="ghost"
              size="icon"
              className="relative"
              aria-label={`Bag (${itemCount} items)`}
              onClick={openCart}
            >
              <ShoppingBag className="h-5 w-5" />
              <CountBadge count={itemCount} />
            </Button>
          </div>
        </div>
      </div>
    </header>
  );
}
