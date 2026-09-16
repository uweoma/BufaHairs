'use client';

import { useMutation, useQuery, useQueryClient, keepPreviousData } from '@tanstack/react-query';
import { toast } from 'sonner';
import { http, qs, type Paged } from '@/lib/api';
import type { Order, OrderSummary, OrderStatus } from '@/lib/types';
import { useAuth } from './use-auth';

/** Paginated order history for the account area. */
export function useOrders(params: { page?: number; status?: OrderStatus } = {}) {
  const { status } = useAuth();
  const isAuthed = status === 'authenticated';
  const query = qs({ page: params.page, status: params.status });

  return useQuery({
    queryKey: ['orders', params.page ?? 1, params.status ?? 'all'],
    queryFn: () => http.getPaged<{ orders: OrderSummary[] }>(`/orders${query}`),
    enabled: isAuthed,
    placeholderData: keepPreviousData,
    staleTime: 15_000,
    select: (res: Paged<{ orders: OrderSummary[] }>) => ({
      orders: res.data.orders,
      meta: res.meta,
    }),
  });
}

/** Single order detail by order number. */
export function useOrder(orderNumber: string | undefined) {
  const { status } = useAuth();
  const isAuthed = status === 'authenticated';

  return useQuery({
    queryKey: ['order', orderNumber],
    queryFn: () => http.get<{ order: Order }>(`/orders/${orderNumber}`),
    enabled: isAuthed && Boolean(orderNumber),
    select: (res) => res.order,
  });
}

/** Cancel a pending order. */
export function useCancelOrder() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (orderNumber: string) => http.post<{ order: Order }>(`/orders/${orderNumber}/cancel`),
    onSuccess: (_data, orderNumber) => {
      queryClient.invalidateQueries({ queryKey: ['order', orderNumber] });
      queryClient.invalidateQueries({ queryKey: ['orders'] });
      toast.success('Order cancelled');
    },
    onError: (err) => toast.error(err instanceof Error ? err.message : 'Could not cancel order'),
  });
}
