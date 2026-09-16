'use client';

import { useCallback, useMemo } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { http } from '@/lib/api';
import type { Cart, CartItem, CartSummary, ProductCard, ProductDetail, ProductVariant } from '@/lib/types';
import { useAuth } from './use-auth';
import { guestKey, useCartStore } from '@/store/cart-store';

interface AddArgs {
  product: Pick<ProductCard | ProductDetail, 'id' | 'name' | 'slug' | 'price' | 'stock' | 'images'>;
  variant?: ProductVariant | null;
  quantity?: number;
  silent?: boolean;
}

const EMPTY_SUMMARY: CartSummary = {
  itemCount: 0,
  distinctItems: 0,
  subtotal: 0,
  hasStockIssues: false,
};

export function useCart() {
  const { status } = useAuth();
  const isAuthed = status === 'authenticated';
  const queryClient = useQueryClient();
  const guestItems = useCartStore((s) => s.items);
  const guestAdd = useCartStore((s) => s.addItem);
  const guestUpdate = useCartStore((s) => s.updateItem);
  const guestRemove = useCartStore((s) => s.removeItem);
  const guestClear = useCartStore((s) => s.clear);

  const serverCart = useQuery({
    queryKey: ['cart'],
    queryFn: () => http.get<Cart>('/cart'),
    enabled: isAuthed,
    staleTime: 10_000,
  });

  const invalidate = useCallback(
    () => queryClient.invalidateQueries({ queryKey: ['cart'] }),
    [queryClient],
  );

  const addMutation = useMutation({
    mutationFn: (v: { productId: string; variantId: string | null; quantity: number }) =>
      http.post('/cart/items', { productId: v.productId, variantId: v.variantId ?? undefined, quantity: v.quantity }),
    onSuccess: invalidate,
  });
  const updateMutation = useMutation({
    mutationFn: (v: { id: string; quantity: number }) =>
      http.patch(`/cart/items/${v.id}`, { quantity: v.quantity }),
    onSuccess: invalidate,
  });
  const removeMutation = useMutation({
    mutationFn: (id: string) => http.del(`/cart/items/${id}`),
    onSuccess: invalidate,
  });
  const clearMutation = useMutation({
    mutationFn: () => http.del('/cart'),
    onSuccess: invalidate,
  });

  // Unified view of the cart regardless of auth state.
  const { items, summary } = useMemo<{ items: CartItem[]; summary: CartSummary }>(() => {
    if (isAuthed) {
      const cart = serverCart.data;
      return { items: cart?.items ?? [], summary: cart?.summary ?? EMPTY_SUMMARY };
    }
    const mapped: CartItem[] = guestItems.map((i) => ({
      id: guestKey(i.productId, i.variantId),
      productId: i.productId,
      variantId: i.variantId,
      name: i.name,
      slug: i.slug,
      image: i.image,
      variantLabel: i.variantLabel,
      unitPrice: i.unitPrice,
      quantity: i.quantity,
      lineTotal: i.unitPrice * i.quantity,
      availableStock: i.maxQuantity,
      inStock: i.maxQuantity > 0,
      exceedsStock: false,
      maxQuantity: i.maxQuantity,
    }));
    const subtotal = mapped.reduce((s, i) => s + i.lineTotal, 0);
    return {
      items: mapped,
      summary: {
        itemCount: mapped.reduce((s, i) => s + i.quantity, 0),
        distinctItems: mapped.length,
        subtotal,
        hasStockIssues: false,
      },
    };
  }, [isAuthed, serverCart.data, guestItems]);

  const add = useCallback(
    async ({ product, variant, quantity = 1, silent }: AddArgs) => {
      const unitPrice = variant?.price ?? product.price;
      const maxQuantity = variant ? variant.stock : product.stock;
      try {
        if (isAuthed) {
          await addMutation.mutateAsync({
            productId: product.id,
            variantId: variant?.id ?? null,
            quantity,
          });
        } else {
          guestAdd({
            productId: product.id,
            variantId: variant?.id ?? null,
            quantity,
            name: product.name,
            slug: product.slug,
            image: product.images?.[0]?.url ?? null,
            unitPrice,
            variantLabel: variant?.label ?? null,
            maxQuantity,
          });
        }
        if (!silent) toast.success('Added to bag', { description: product.name });
      } catch (err) {
        toast.error(err instanceof Error ? err.message : 'Could not add to bag');
        throw err;
      }
    },
    [isAuthed, addMutation, guestAdd],
  );

  const setQuantity = useCallback(
    async (item: CartItem, quantity: number) => {
      if (quantity < 1) return;
      if (isAuthed) await updateMutation.mutateAsync({ id: item.id, quantity });
      else guestUpdate(item.id, quantity);
    },
    [isAuthed, updateMutation, guestUpdate],
  );

  const remove = useCallback(
    async (item: CartItem) => {
      if (isAuthed) await removeMutation.mutateAsync(item.id);
      else guestRemove(item.id);
    },
    [isAuthed, removeMutation, guestRemove],
  );

  const clear = useCallback(async () => {
    if (isAuthed) await clearMutation.mutateAsync();
    else guestClear();
  }, [isAuthed, clearMutation, guestClear]);

  return {
    items,
    summary,
    itemCount: summary.itemCount,
    isLoading: isAuthed ? serverCart.isLoading : false,
    isMutating:
      addMutation.isPending ||
      updateMutation.isPending ||
      removeMutation.isPending ||
      clearMutation.isPending,
    add,
    setQuantity,
    remove,
    clear,
    refetch: serverCart.refetch,
  };
}
