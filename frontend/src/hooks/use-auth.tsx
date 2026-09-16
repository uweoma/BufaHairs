'use client';

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { http, setAccessToken } from '@/lib/api';
import type { AuthPayload, User } from '@/lib/types';
import { useCartStore } from '@/store/cart-store';

type AuthStatus = 'loading' | 'authenticated' | 'unauthenticated';

interface LoginInput {
  email: string;
  password: string;
}
interface RegisterInput {
  fullName: string;
  email: string;
  phone?: string;
  password: string;
  confirmPassword: string;
}

interface AuthContextValue {
  user: User | null;
  status: AuthStatus;
  isAdmin: boolean;
  login: (input: LoginInput) => Promise<User>;
  register: (input: RegisterInput) => Promise<User>;
  logout: () => Promise<void>;
  refresh: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [status, setStatus] = useState<AuthStatus>('loading');
  const queryClient = useQueryClient();

  /** Push any guest (localStorage) cart items to the server after auth. */
  const mergeGuestCart = useCallback(async () => {
    const guestItems = useCartStore.getState().items;
    if (guestItems.length > 0) {
      try {
        await http.post('/cart/merge', {
          items: guestItems.map((i) => ({
            productId: i.productId,
            variantId: i.variantId ?? undefined,
            quantity: i.quantity,
          })),
        });
        useCartStore.getState().clear();
      } catch {
        // Non-fatal: keep the local cart if the merge fails.
      }
    }
    queryClient.invalidateQueries({ queryKey: ['cart'] });
    queryClient.invalidateQueries({ queryKey: ['wishlist'] });
  }, [queryClient]);

  const bootstrap = useCallback(async () => {
    try {
      const { user } = await http.get<{ user: User }>('/auth/me');
      setUser(user);
      setStatus('authenticated');
    } catch {
      setAccessToken(null);
      setUser(null);
      setStatus('unauthenticated');
    }
  }, []);

  useEffect(() => {
    bootstrap();
  }, [bootstrap]);

  const login = useCallback(
    async (input: LoginInput) => {
      const { user, accessToken } = await http.post<AuthPayload>('/auth/login', input, {
        auth: false,
      });
      setAccessToken(accessToken);
      setUser(user);
      setStatus('authenticated');
      await mergeGuestCart();
      return user;
    },
    [mergeGuestCart],
  );

  const register = useCallback(
    async (input: RegisterInput) => {
      const { user, accessToken } = await http.post<AuthPayload>('/auth/register', input, {
        auth: false,
      });
      setAccessToken(accessToken);
      setUser(user);
      setStatus('authenticated');
      await mergeGuestCart();
      return user;
    },
    [mergeGuestCart],
  );

  const logout = useCallback(async () => {
    try {
      await http.post('/auth/logout');
    } catch {
      // ignore — clear client state regardless
    }
    setAccessToken(null);
    setUser(null);
    setStatus('unauthenticated');
    queryClient.clear();
  }, [queryClient]);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      status,
      isAdmin: user?.role === 'ADMIN',
      login,
      register,
      logout,
      refresh: bootstrap,
    }),
    [user, status, login, register, logout, bootstrap],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within <AuthProvider>');
  return ctx;
}
