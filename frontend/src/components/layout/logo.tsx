import Link from 'next/link';
import { cn } from '@/lib/utils';
import { BRAND_NAME } from '@/lib/constants';

/** Wordmark logo. Split brand name into first word (serif) + rest. */
export function Logo({ className, onClick }: { className?: string; onClick?: () => void }) {
  const [first, ...rest] = BRAND_NAME.split(' ');
  return (
    <Link
      href="/"
      onClick={onClick}
      className={cn('inline-flex items-baseline gap-1.5 font-serif', className)}
      aria-label={`${BRAND_NAME} home`}
    >
      <span className="text-2xl font-bold tracking-tight text-primary-deep">{first}</span>
      {rest.length > 0 && (
        <span className="text-2xl font-light tracking-widest text-primary-royal">
          {rest.join(' ')}
        </span>
      )}
    </Link>
  );
}
