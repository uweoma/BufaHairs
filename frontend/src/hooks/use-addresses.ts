'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { http } from '@/lib/api';
import type { Address } from '@/lib/types';
import { useAuth } from './use-auth';

export interface AddressInput {
  label?: string | null;
  fullName: string;
  phone: string;
  addressLine1: string;
  addressLine2?: string | null;
  city: string;
  state: string;
  country: string;
  postalCode?: string | null;
  isDefault?: boolean;
}

export function useAddresses() {
  const { status } = useAuth();
  const isAuthed = status === 'authenticated';
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ['addresses'],
    queryFn: () => http.get<{ addresses: Address[] }>('/addresses'),
    enabled: isAuthed,
    staleTime: 30_000,
  });

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ['addresses'] });

  const create = useMutation({
    mutationFn: (input: AddressInput) => http.post<{ address: Address }>('/addresses', input),
    onSuccess: invalidate,
  });
  const update = useMutation({
    mutationFn: ({ id, input }: { id: string; input: Partial<AddressInput> }) =>
      http.patch<{ address: Address }>(`/addresses/${id}`, input),
    onSuccess: invalidate,
  });
  const setDefault = useMutation({
    mutationFn: (id: string) => http.patch<{ addresses: Address[] }>(`/addresses/${id}/default`),
    onSuccess: invalidate,
  });
  const remove = useMutation({
    mutationFn: (id: string) => http.del<{ addresses: Address[] }>(`/addresses/${id}`),
    onSuccess: invalidate,
  });

  return {
    addresses: query.data?.addresses ?? [],
    isLoading: isAuthed ? query.isLoading : false,
    create,
    update,
    setDefault,
    remove,
  };
}
