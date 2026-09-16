'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { http } from '@/lib/api';
import type { NotificationList } from '@/lib/types';
import { useAuth } from './use-auth';

export function useNotifications() {
  const { status } = useAuth();
  const isAuthed = status === 'authenticated';
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ['notifications'],
    queryFn: () => http.get<NotificationList>('/notifications'),
    enabled: isAuthed,
    refetchInterval: isAuthed ? 60_000 : false,
  });

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ['notifications'] });

  const markRead = useMutation({
    mutationFn: (id: string) => http.post(`/notifications/${id}/read`),
    onSuccess: invalidate,
  });
  const markAllRead = useMutation({
    mutationFn: () => http.post('/notifications/read-all'),
    onSuccess: invalidate,
  });

  return {
    notifications: query.data?.notifications ?? [],
    unreadCount: query.data?.unreadCount ?? 0,
    isLoading: query.isLoading,
    markRead: (id: string) => markRead.mutate(id),
    markAllRead: () => markAllRead.mutate(),
  };
}
