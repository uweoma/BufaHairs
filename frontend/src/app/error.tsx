'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { AlertTriangle, RotateCw, Home } from 'lucide-react';
import { Button } from '@/components/ui/button';

/**
 * Global error boundary. Never renders raw error messages or stack traces to
 * the user — only a friendly recovery UI plus the opaque digest for support.
 */
export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Surface to the console for local debugging / error reporting tools.
    console.error(error);
  }, [error]);

  return (
    <div className="container flex min-h-[60vh] flex-col items-center justify-center py-20 text-center">
      <div className="flex h-16 w-16 items-center justify-center rounded-full bg-destructive/10">
        <AlertTriangle className="h-8 w-8 text-destructive" />
      </div>
      <h1 className="mt-6 font-serif text-2xl font-semibold">Something went wrong</h1>
      <p className="mt-2 max-w-md text-muted-foreground">
        We hit an unexpected error. Please try again — if it keeps happening, our team is on it.
      </p>
      {error.digest && (
        <p className="mt-2 text-xs text-muted-foreground">Reference: {error.digest}</p>
      )}
      <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
        <Button onClick={reset}>
          <RotateCw className="h-4 w-4" /> Try again
        </Button>
        <Button asChild variant="outline">
          <Link href="/">
            <Home className="h-4 w-4" /> Back home
          </Link>
        </Button>
      </div>
    </div>
  );
}
