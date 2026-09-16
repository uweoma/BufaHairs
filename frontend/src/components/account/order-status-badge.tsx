import { cn } from '@/lib/utils';
import { ORDER_STATUS_META, PAYMENT_STATUS_META } from '@/lib/constants';
import type { OrderStatus, PaymentStatus } from '@/lib/types';

export function OrderStatusBadge({ status, className }: { status: OrderStatus; className?: string }) {
  const meta = ORDER_STATUS_META[status] ?? { label: status, className: 'bg-zinc-100 text-zinc-700 border-zinc-200' };
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium',
        meta.className,
        className,
      )}
    >
      {meta.label}
    </span>
  );
}

export function PaymentStatusBadge({ status, className }: { status: PaymentStatus; className?: string }) {
  const meta = PAYMENT_STATUS_META[status] ?? { label: status, className: 'bg-zinc-100 text-zinc-700' };
  return (
    <span
      className={cn('inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium', meta.className, className)}
    >
      {meta.label}
    </span>
  );
}
