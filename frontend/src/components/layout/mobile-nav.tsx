'use client';

import Link from 'next/link';
import { useState } from 'react';
import { Menu, User as UserIcon, Package, Heart, LayoutDashboard } from 'lucide-react';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { SearchBar } from './search-bar';
import { Logo } from './logo';
import { MAIN_NAV } from '@/lib/constants';
import { useAuth } from '@/hooks/use-auth';

export function MobileNav() {
  const [open, setOpen] = useState(false);
  const { status, isAdmin } = useAuth();
  const isAuthed = status === 'authenticated';
  const close = () => setOpen(false);

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon" className="lg:hidden" aria-label="Open menu">
          <Menu className="h-5 w-5" />
        </Button>
      </SheetTrigger>
      <SheetContent side="left" className="flex w-full flex-col p-0 sm:max-w-sm">
        <SheetHeader className="border-b px-6 py-4 text-left">
          <SheetTitle className="sr-only">Menu</SheetTitle>
          <Logo onClick={close} />
        </SheetHeader>

        <div className="px-6 py-4">
          <SearchBar onSubmitted={close} />
        </div>

        <nav className="flex flex-col px-3">
          {MAIN_NAV.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              onClick={close}
              className="rounded-lg px-3 py-3 text-base font-medium transition-colors hover:bg-accent"
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <Separator className="my-3" />

        <nav className="flex flex-col px-3">
          {isAuthed ? (
            <>
              <Link href="/account" onClick={close} className="flex items-center gap-3 rounded-lg px-3 py-3 text-base transition-colors hover:bg-accent">
                <UserIcon className="h-5 w-5 text-muted-foreground" /> My Account
              </Link>
              <Link href="/account/orders" onClick={close} className="flex items-center gap-3 rounded-lg px-3 py-3 text-base transition-colors hover:bg-accent">
                <Package className="h-5 w-5 text-muted-foreground" /> Orders
              </Link>
              <Link href="/wishlist" onClick={close} className="flex items-center gap-3 rounded-lg px-3 py-3 text-base transition-colors hover:bg-accent">
                <Heart className="h-5 w-5 text-muted-foreground" /> Wishlist
              </Link>
              {isAdmin && (
                <Link href="/admin" onClick={close} className="flex items-center gap-3 rounded-lg px-3 py-3 text-base font-medium text-primary-deep transition-colors hover:bg-accent">
                  <LayoutDashboard className="h-5 w-5" /> Admin Dashboard
                </Link>
              )}
            </>
          ) : (
            <div className="flex flex-col gap-2 px-3 py-2">
              <Button asChild onClick={close}>
                <Link href="/login">Sign In</Link>
              </Button>
              <Button asChild variant="outline" onClick={close}>
                <Link href="/register">Create Account</Link>
              </Button>
            </div>
          )}
        </nav>
      </SheetContent>
    </Sheet>
  );
}
