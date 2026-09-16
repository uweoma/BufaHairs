'use client';

import { useState } from 'react';
import { MapPin, Plus, Pencil, Trash2, Check, Star } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { EmptyState } from '@/components/ui/empty-state';
import { AddressForm } from '@/components/checkout/address-form';
import { useAddresses, type AddressInput } from '@/hooks/use-addresses';
import { cn } from '@/lib/utils';
import type { Address } from '@/lib/types';

export function AddressesView() {
  const { addresses, isLoading, create, update, setDefault, remove } = useAddresses();
  const [adding, setAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  const handleCreate = async (input: AddressInput) => {
    try {
      await create.mutateAsync(input);
      toast.success('Address added');
      setAdding(false);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Could not add address');
    }
  };

  const handleUpdate = async (id: string, input: AddressInput) => {
    try {
      await update.mutateAsync({ id, input });
      toast.success('Address updated');
      setEditingId(null);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Could not update address');
    }
  };

  const handleSetDefault = async (id: string) => {
    try {
      await setDefault.mutateAsync(id);
      toast.success('Default address updated');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Could not update default');
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await remove.mutateAsync(id);
      toast.success('Address removed');
      setConfirmDeleteId(null);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Could not remove address');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-3">
        <h1 className="font-serif text-3xl font-semibold">Addresses</h1>
        {!adding && (
          <Button onClick={() => setAdding(true)} size="sm">
            <Plus className="h-4 w-4" /> Add address
          </Button>
        )}
      </div>

      {adding && (
        <div className="rounded-2xl border bg-card p-5">
          <h2 className="mb-4 font-medium">New address</h2>
          <AddressForm
            onSubmit={handleCreate}
            submitLabel="Add address"
            onCancel={() => setAdding(false)}
          />
        </div>
      )}

      {isLoading ? (
        <div className="grid gap-4 sm:grid-cols-2">
          <Skeleton className="h-48 rounded-2xl" />
          <Skeleton className="h-48 rounded-2xl" />
        </div>
      ) : addresses.length === 0 && !adding ? (
        <EmptyState
          icon={MapPin}
          title="No saved addresses"
          description="Add a delivery address to speed up checkout."
          action={
            <Button onClick={() => setAdding(true)}>
              <Plus className="h-4 w-4" /> Add address
            </Button>
          }
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {addresses.map((address) =>
            editingId === address.id ? (
              <div key={address.id} className="rounded-2xl border bg-card p-5 sm:col-span-2">
                <h2 className="mb-4 font-medium">Edit address</h2>
                <AddressForm
                  defaultValues={toFormValues(address)}
                  onSubmit={(input) => handleUpdate(address.id, input)}
                  submitLabel="Save changes"
                  onCancel={() => setEditingId(null)}
                />
              </div>
            ) : (
              <div
                key={address.id}
                className={cn(
                  'flex flex-col rounded-2xl border bg-card p-5',
                  address.isDefault && 'border-primary/50 ring-1 ring-primary/20',
                )}
              >
                <div className="mb-2 flex items-center justify-between gap-2">
                  <span className="font-medium">{address.label || 'Address'}</span>
                  {address.isDefault && (
                    <span className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-medium text-primary">
                      <Star className="h-3 w-3 fill-current" /> Default
                    </span>
                  )}
                </div>
                <div className="flex-1 text-sm text-muted-foreground">
                  <p className="font-medium text-foreground">{address.fullName}</p>
                  <p>{address.addressLine1}</p>
                  {address.addressLine2 && <p>{address.addressLine2}</p>}
                  <p>
                    {address.city}, {address.state}
                  </p>
                  <p>{address.country}{address.postalCode ? ` · ${address.postalCode}` : ''}</p>
                  <p className="mt-1">{address.phone}</p>
                </div>

                {confirmDeleteId === address.id ? (
                  <div className="mt-4 flex items-center gap-2 rounded-lg bg-destructive/5 p-2 text-sm">
                    <span className="text-destructive">Remove this address?</span>
                    <div className="ml-auto flex gap-2">
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => handleDelete(address.id)}
                        loading={remove.isPending}
                      >
                        Remove
                      </Button>
                      <Button size="sm" variant="ghost" onClick={() => setConfirmDeleteId(null)}>
                        Cancel
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="mt-4 flex flex-wrap items-center gap-2 border-t pt-4">
                    {!address.isDefault && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleSetDefault(address.id)}
                        disabled={setDefault.isPending}
                      >
                        <Check className="h-4 w-4" /> Set default
                      </Button>
                    )}
                    <Button size="sm" variant="ghost" onClick={() => setEditingId(address.id)}>
                      <Pencil className="h-4 w-4" /> Edit
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="text-destructive hover:bg-destructive/10 hover:text-destructive"
                      onClick={() => setConfirmDeleteId(address.id)}
                    >
                      <Trash2 className="h-4 w-4" /> Delete
                    </Button>
                  </div>
                )}
              </div>
            ),
          )}
        </div>
      )}
    </div>
  );
}

function toFormValues(address: Address): Partial<AddressInput> {
  return {
    label: address.label,
    fullName: address.fullName,
    phone: address.phone,
    addressLine1: address.addressLine1,
    addressLine2: address.addressLine2,
    city: address.city,
    state: address.state,
    country: address.country,
    postalCode: address.postalCode,
    isDefault: address.isDefault,
  };
}
