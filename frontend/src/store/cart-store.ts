'use client';

import { create } from 'zustand';
import { persist } from 'zustand/middleware';

/** A guest cart line — a display snapshot plus the identifiers needed to merge. */
export interface GuestCartItem {
  productId: string;
  variantId: string | null;
  quantity: number;
  name: string;
  slug: string;
  image: string | null;
  unitPrice: number; // kobo (snapshot; re-priced server-side at checkout)
  variantLabel: string | null;
  maxQuantity: number;
}

interface CartStore {
  items: GuestCartItem[];
  addItem: (item: GuestCartItem) => void;
  updateItem: (key: string, quantity: number) => void;
  removeItem: (key: string) => void;
  clear: () => void;
}

/** Stable identity for a guest line (product + variant). */
export const guestKey = (productId: string, variantId: string | null) =>
  `${productId}:${variantId ?? 'default'}`;

export const useCartStore = create<CartStore>()(
  persist(
    (set) => ({
      items: [],
      addItem: (item) =>
        set((state) => {
          const key = guestKey(item.productId, item.variantId);
          const existing = state.items.find(
            (i) => guestKey(i.productId, i.variantId) === key,
          );
          if (existing) {
            const quantity = Math.min(
              existing.quantity + item.quantity,
              item.maxQuantity || 99,
            );
            return {
              items: state.items.map((i) =>
                guestKey(i.productId, i.variantId) === key ? { ...i, quantity } : i,
              ),
            };
          }
          return { items: [...state.items, item] };
        }),
      updateItem: (key, quantity) =>
        set((state) => ({
          items: state.items.map((i) =>
            guestKey(i.productId, i.variantId) === key
              ? { ...i, quantity: Math.max(1, Math.min(quantity, i.maxQuantity || 99)) }
              : i,
          ),
        })),
      removeItem: (key) =>
        set((state) => ({
          items: state.items.filter((i) => guestKey(i.productId, i.variantId) !== key),
        })),
      clear: () => set({ items: [] }),
    }),
    { name: 'bufahairs_cart' },
  ),
);
