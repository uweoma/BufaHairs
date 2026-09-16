import Link from 'next/link';
import { Search, Home } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function NotFound() {
  return (
    <div className="container flex min-h-[60vh] flex-col items-center justify-center py-20 text-center">
      <p className="font-serif text-7xl font-semibold text-primary">404</p>
      <h1 className="mt-4 font-serif text-2xl font-semibold">This page slipped away</h1>
      <p className="mt-2 max-w-md text-muted-foreground">
        The page you’re looking for doesn’t exist or has moved. Let’s get you back to something
        beautiful.
      </p>
      <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
        <Button asChild>
          <Link href="/">
            <Home className="h-4 w-4" /> Back home
          </Link>
        </Button>
        <Button asChild variant="outline">
          <Link href="/shop">
            <Search className="h-4 w-4" /> Browse the shop
          </Link>
        </Button>
      </div>
    </div>
  );
}
