'use client';

import { Bell, Package, CreditCard, Tag, Info, CheckCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { EmptyState } from '@/components/ui/empty-state';
import { useNotifications } from '@/hooks/use-notifications';
import { formatDateTime, cn } from '@/lib/utils';
import type { NotificationType } from '@/lib/types';

const TYPE_ICON: Record<NotificationType, typeof Bell> = {
  ORDER_UPDATE: Package,
  PAYMENT: CreditCard,
  PROMO: Tag,
  SYSTEM: Info,
};

export function NotificationsView() {
  const { notifications, unreadCount, isLoading, markRead, markAllRead } = useNotifications();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-3">
        <h1 className="font-serif text-3xl font-semibold">Notifications</h1>
        {unreadCount > 0 && (
          <Button size="sm" variant="outline" onClick={() => markAllRead()}>
            <CheckCheck className="h-4 w-4" /> Mark all read
          </Button>
        )}
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-20 rounded-2xl" />
          ))}
        </div>
      ) : notifications.length === 0 ? (
        <EmptyState
          icon={Bell}
          title="No notifications"
          description="Updates about your orders and offers will show up here."
        />
      ) : (
        <ul className="space-y-3">
          {notifications.map((n) => {
            const Icon = TYPE_ICON[n.type] ?? Info;
            return (
              <li key={n.id}>
                <button
                  type="button"
                  onClick={() => !n.isRead && markRead(n.id)}
                  className={cn(
                    'flex w-full items-start gap-4 rounded-2xl border p-4 text-left transition-colors',
                    n.isRead ? 'bg-card' : 'border-primary/30 bg-primary/5 hover:bg-primary/10',
                  )}
                >
                  <span
                    className={cn(
                      'flex h-10 w-10 shrink-0 items-center justify-center rounded-full',
                      n.isRead ? 'bg-secondary text-muted-foreground' : 'bg-primary/15 text-primary',
                    )}
                  >
                    <Icon className="h-5 w-5" />
                  </span>
                  <div className="flex-1">
                    <div className="flex items-start justify-between gap-2">
                      <p className={cn('font-medium', !n.isRead && 'text-foreground')}>{n.title}</p>
                      {!n.isRead && <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-primary" />}
                    </div>
                    {n.body && <p className="mt-0.5 text-sm text-muted-foreground">{n.body}</p>}
                    <p className="mt-1 text-xs text-muted-foreground">{formatDateTime(n.createdAt)}</p>
                  </div>
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
