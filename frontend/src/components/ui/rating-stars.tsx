import { Star } from 'lucide-react';
import { cn } from '@/lib/utils';

interface RatingStarsProps {
  value: number;
  size?: number;
  className?: string;
  showValue?: boolean;
  count?: number;
}

/** Read-only star rating (supports half-stars via width clipping). */
export function RatingStars({ value, size = 16, className, showValue, count }: RatingStarsProps) {
  return (
    <div className={cn('flex items-center gap-1.5', className)}>
      <div className="relative inline-flex" style={{ width: size * 5 + 8, height: size }}>
        {/* base (empty) */}
        <div className="absolute inset-0 flex gap-0.5">
          {Array.from({ length: 5 }).map((_, i) => (
            <Star key={i} style={{ width: size, height: size }} className="text-muted-foreground/30" />
          ))}
        </div>
        {/* filled overlay */}
        <div
          className="absolute inset-0 flex gap-0.5 overflow-hidden"
          style={{ width: `${(Math.max(0, Math.min(5, value)) / 5) * 100}%` }}
        >
          {Array.from({ length: 5 }).map((_, i) => (
            <Star
              key={i}
              style={{ width: size, height: size }}
              className="shrink-0 fill-gold text-gold"
            />
          ))}
        </div>
      </div>
      {showValue && (
        <span className="text-sm font-medium text-foreground">{value.toFixed(1)}</span>
      )}
      {count !== undefined && (
        <span className="text-xs text-muted-foreground">
          ({count} review{count === 1 ? '' : 's'})
        </span>
      )}
    </div>
  );
}
