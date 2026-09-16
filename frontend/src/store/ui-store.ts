'use client';

import { create } from 'zustand';

interface UIStore {
  cartOpen: boolean;
  openCart: () => void;
  closeCart: () => void;
  setCartOpen: (open: boolean) => void;
}

/** Ephemeral UI state (cart drawer visibility) shared across the header + pages. */
export const useUIStore = create<UIStore>((set) => ({
  cartOpen: false,
  openCart: () => set({ cartOpen: true }),
  closeCart: () => set({ cartOpen: false }),
  setCartOpen: (open) => set({ cartOpen: open }),
}));
