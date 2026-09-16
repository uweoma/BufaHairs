'use client';

import Link from 'next/link';
import { Bell, CheckCheck } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { useNotifications } from '@/hooks/use-notifications';
import { useAuth } from '@/hooks/use-auth';
import { cn, timeAgo } from '@/lib/utils';

export function NotificationBell() {
  const { status } = useAuth();
  const { notifications, unreadCount, markRead, markAllRead } = useNotifications();

  if (status !== 'authenticated') return null;

  const recent = notifications.slice(0, 6);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="relative" aria-label="Notifications">
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <span className="absolute right-1 top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-primary px-1 text-[10px] font-semibold leading-none text-primary-foreground">
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80 p-0">
        <div className="flex items-center justify-between border-b px-4 py-3">
          <span className="font-serif text-sm font-semibold">Notifications</span>
          {unreadCount > 0 && (
            <button
              onClick={markAllRead}
              className="flex items-center gap-1 text-xs text-primary hover:underline"
            >
              <CheckCheck className="h-3.5 w-3.5" /> Mark all read
            </button>
          )}
        </div>

        {recent.length === 0 ? (
          <div className="px-4 py-8 text-center text-sm text-muted-foreground">
            You&apos;re all caught up.
          </div>
        ) : (
          <ul className="max-h-96 overflow-y-auto">
            {recent.map((n) => (
              <li key={n.id}>
                <button
                  onClick={() => !n.isRead && markRead(n.id)}
                  className={cn(
                    'flex w-full flex-col items-start gap-0.5 border-b px-4 py-3 text-left transition-colors last:border-b-0 hover:bg-accent',
                    !n.isRead && 'bg-primary/[0.04]',
                  )}
                >
                  <div className="flex w-full items-center justify-between gap-2">
                    <span className="text-sm font-medium">{n.title}</span>
                    {!n.isRead && <span className="h-2 w-2 shrink-0 rounded-full bg-primary" />}
                  </div>
                  {n.body && <span className="line-clamp-2 text-xs text-muted-foreground">{n.body}</span>}
                  <span className="text-[11px] text-muted-foreground">{timeAgo(n.createdAt)}</span>
                </button>
              </li>
            ))}
          </ul>
        )}

        <div className="border-t p-2">
          <Button asChild variant="ghost" size="sm" className="w-full">
            <Link href="/account/notifications">View all</Link>
          </Button>
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
