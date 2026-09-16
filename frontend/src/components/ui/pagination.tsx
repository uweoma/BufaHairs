'use client';

import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from './button';
import type { PaginationMeta } from '@/lib/types';

interface PaginationProps {
  meta: PaginationMeta;
  onPageChange: (page: number) => void;
}

/** Compact numeric pager with prev/next and a windowed page list. */
export function Pagination({ meta, onPageChange }: PaginationProps) {
  if (meta.totalPages <= 1) return null;

  const { page, totalPages } = meta;
  const pages: (number | '…')[] = [];
  const push = (n: number | '…') => pages.push(n);

  const window = 1;
  for (let i = 1; i <= totalPages; i++) {
    if (i === 1 || i === totalPages || (i >= page - window && i <= page + window)) {
      push(i);
    } else if (pages[pages.length - 1] !== '…') {
      push('…');
    }
  }

  return (
    <nav className="flex items-center justify-center gap-1.5" aria-label="Pagination">
      <Button
        variant="outline"
        size="icon"
        className="h-9 w-9"
        disabled={!meta.hasPrev}
        onClick={() => onPageChange(page - 1)}
        aria-label="Previous page"
      >
        <ChevronLeft className="h-4 w-4" />
      </Button>
      {pages.map((p, i) =>
        p === '…' ? (
          <span key={`e${i}`} className="px-2 text-muted-foreground">
            …
          </span>
        ) : (
          <Button
            key={p}
            variant={p === page ? 'default' : 'outline'}
            size="icon"
            className="h-9 w-9"
            onClick={() => onPageChange(p)}
            aria-current={p === page ? 'page' : undefined}
          >
            {p}
          </Button>
        ),
      )}
      <Button
        variant="outline"
        size="icon"
        className="h-9 w-9"
        disabled={!meta.hasNext}
        onClick={() => onPageChange(page + 1)}
        aria-label="Next page"
      >
        <ChevronRight className="h-4 w-4" />
      </Button>
    </nav>
  );
}
