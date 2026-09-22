import Link from 'next/link';
import { cn } from '@/lib/utils';
import { BRAND_NAME } from '@/lib/constants';

/** Wordmark logo. Split brand name into first word (serif) + rest. */
export function Logo({
  className,
  onClick,
  inverted,
}: {
  className?: string;
  onClick?: () => void;
  /** Render in white for use on dark / coloured backgrounds (e.g. footer). */
  inverted?: boolean;
}) {
  const [first, ...rest] = BRAND_NAME.split(' ');
  return (
    <Link
      href="/"
      onClick={onClick}
      className={cn('inline-flex items-baseline gap-1.5 font-serif', className)}
      aria-label={`${BRAND_NAME} home`}
    >
      <span
        className={cn(
          'text-2xl font-bold tracking-tight',
          inverted ? 'text-white' : 'text-primary-deep',
        )}
      >
        {first}
      </span>
      {rest.length > 0 && (
        <span
          className={cn(
            'text-2xl font-light tracking-widest',
            inverted ? 'text-white/80' : 'text-primary-royal',
          )}
        >
          {rest.join(' ')}
        </span>
      )}
    </Link>
  );
}
