'use client';

import { useCallback, useMemo } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { http } from '@/lib/api';
import type { ProductCard } from '@/lib/types';
import { useAuth } from './use-auth';

export interface WishlistEntry {
  id: string;
  productId: string;
  createdAt: string;
  product: ProductCard;
  available: boolean;
}

export function useWishlist() {
  const { status } = useAuth();
  const isAuthed = status === 'authenticated';
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ['wishlist'],
    queryFn: () => http.get<{ items: WishlistEntry[] }>('/wishlist'),
    enabled: isAuthed,
    staleTime: 30_000,
  });

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ['wishlist'] });

  const addMutation = useMutation({
    mutationFn: (productId: string) => http.post(`/wishlist/${productId}`),
    onSuccess: invalidate,
  });
  const removeMutation = useMutation({
    mutationFn: (productId: string) => http.del(`/wishlist/${productId}`),
    onSuccess: invalidate,
  });
  const moveMutation = useMutation({
    mutationFn: (productId: string) => http.post(`/wishlist/${productId}/move-to-cart`),
    onSuccess: () => {
      invalidate();
      queryClient.invalidateQueries({ queryKey: ['cart'] });
    },
  });

  const items = useMemo(() => query.data?.items ?? [], [query.data]);
  const ids = useMemo(() => new Set(items.map((i) => i.productId)), [items]);

  const isWishlisted = useCallback((productId: string) => ids.has(productId), [ids]);

  const toggle = useCallback(
    async (productId: string, name?: string) => {
      if (!isAuthed) {
        toast.error('Please sign in to save items to your wishlist');
        return false;
      }
      try {
        if (ids.has(productId)) {
          await removeMutation.mutateAsync(productId);
          toast.success('Removed from wishlist');
          return false;
        }
        await addMutation.mutateAsync(productId);
        toast.success('Saved to wishlist', { description: name });
        return true;
      } catch (err) {
        toast.error(err instanceof Error ? err.message : 'Something went wrong');
        return ids.has(productId);
      }
    },
    [isAuthed, ids, addMutation, removeMutation],
  );

  const moveToCart = useCallback(
    async (productId: string) => {
      try {
        await moveMutation.mutateAsync(productId);
        toast.success('Moved to bag');
      } catch (err) {
        toast.error(err instanceof Error ? err.message : 'Could not move to bag');
      }
    },
    [moveMutation],
  );

  return {
    items,
    count: items.length,
    isLoading: isAuthed ? query.isLoading : false,
    isWishlisted,
    toggle,
    moveToCart,
  };
}
