'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  Lock,
  MapPin,
  Plus,
  Truck,
  Tag,
  Check,
  ShoppingBag,
  Loader2,
  Pencil,
  ShieldCheck,
} from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import { EmptyState } from '@/components/ui/empty-state';
import { AddressForm } from './address-form';
import { useAuth } from '@/hooks/use-auth';
import { useCart } from '@/hooks/use-cart';
import { useAddresses, type AddressInput } from '@/hooks/use-addresses';
import { http, ApiError } from '@/lib/api';
import { cn, formatNaira } from '@/lib/utils';
import type {
  Address,
  CouponValidation,
  CreateOrderResponse,
  ShippingQuote,
} from '@/lib/types';

function SectionCard({
  step,
  icon: Icon,
  title,
  children,
}: {
  step: number;
  icon: React.ElementType;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-2xl border bg-card p-5 sm:p-6">
      <h2 className="flex items-center gap-2.5 font-serif text-lg font-semibold">
        <span className="flex h-7 w-7 items-center justify-center rounded-full bg-primary/10 text-sm text-primary-deep">
          {step}
        </span>
        <Icon className="h-4 w-4 text-primary" />
        {title}
      </h2>
      <div className="mt-4">{children}</div>
    </section>
  );
}

function formatAddress(a: Address | AddressInput): string {
  return [a.addressLine1, a.addressLine2, a.city, a.state, a.country].filter(Boolean).join(', ');
}

export function CheckoutView() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { status, user } = useAuth();
  const { items, summary, isLoading: cartLoading } = useCart();
  const { addresses, isLoading: addressesLoading } = useAddresses();

  const [selectedAddressId, setSelectedAddressId] = useState<string | 'new' | null>(null);
  const [newAddress, setNewAddress] = useState<AddressInput | null>(null);
  const [showNewForm, setShowNewForm] = useState(false);
  const [saveNewAddress, setSaveNewAddress] = useState(true);
  const [selectedRateId, setSelectedRateId] = useState<string | null>(null);
  const [couponInput, setCouponInput] = useState('');
  const [coupon, setCoupon] = useState<CouponValidation | null>(null);
  const [note, setNote] = useState('');

  // Default the address selection once saved addresses load.
  useEffect(() => {
    if (selectedAddressId !== null) return;
    if (addresses.length > 0) {
      const def = addresses.find((a) => a.isDefault) ?? addresses[0];
      setSelectedAddressId(def.id);
    } else if (!addressesLoading && status === 'authenticated') {
      setSelectedAddressId('new');
      setShowNewForm(true);
    }
  }, [addresses, addressesLoading, selectedAddressId, status]);

  const effectiveAddress: Address | AddressInput | null = useMemo(() => {
    if (selectedAddressId === 'new') return newAddress;
    return addresses.find((a) => a.id === selectedAddressId) ?? null;
  }, [selectedAddressId, newAddress, addresses]);

  const destState = effectiveAddress?.state ?? '';
  const destCountry = effectiveAddress?.country ?? 'Nigeria';

  // Shipping quote for the chosen destination.
  const shippingQuery = useQuery({
    queryKey: ['shipping-quote', destState, destCountry, summary.subtotal],
    queryFn: () =>
      http.post<ShippingQuote>(
        '/shipping/quote',
        { state: destState, country: destCountry, subtotal: summary.subtotal },
        { auth: false },
      ),
    enabled: Boolean(destState) && summary.subtotal > 0,
    staleTime: 60_000,
  });
  const shippingOptions = useMemo(() => shippingQuery.data?.options ?? [], [shippingQuery.data]);

  // Default / reconcile the selected shipping rate as options change.
  useEffect(() => {
    if (shippingOptions.length === 0) {
      setSelectedRateId(null);
      return;
    }
    setSelectedRateId((current) =>
      current && shippingOptions.some((o) => o.rateId === current) ? current : shippingOptions[0].rateId,
    );
  }, [shippingOptions]);

  const selectedOption = shippingOptions.find((o) => o.rateId === selectedRateId) ?? null;
  const shippingCost = selectedOption?.cost ?? 0;
  const discount = coupon?.discount ?? 0;
  const total = Math.max(0, summary.subtotal - discount + shippingCost);

  const couponMutation = useMutation({
    mutationFn: (code: string) => http.post<CouponValidation>('/coupons/validate', { code }),
    onSuccess: (data) => {
      setCoupon(data);
      toast.success(`Coupon applied — you saved ${formatNaira(data.discount)}`);
    },
    onError: (err) => {
      setCoupon(null);
      toast.error(err instanceof ApiError ? err.message : 'That coupon could not be applied');
    },
  });

  const orderMutation = useMutation({
    mutationFn: (body: Record<string, unknown>) => http.post<CreateOrderResponse>('/orders', body),
    onSuccess: ({ order, payment }) => {
      queryClient.invalidateQueries({ queryKey: ['cart'] });
      if (payment.authorizationUrl) {
        // Hand off to Paystack's hosted checkout.
        window.location.assign(payment.authorizationUrl);
      } else {
        router.push(`/account/orders/${order.orderNumber}?placed=1`);
      }
    },
    onError: (err) => {
      toast.error(err instanceof ApiError ? err.message : 'We could not place your order. Please try again.');
    },
  });

  const canPlaceOrder =
    Boolean(effectiveAddress) &&
    Boolean(selectedRateId) &&
    items.length > 0 &&
    !summary.hasStockIssues &&
    !orderMutation.isPending;

  const placeOrder = () => {
    if (!effectiveAddress || !selectedRateId) {
      toast.error('Please choose a delivery address and shipping method');
      return;
    }
    const body: Record<string, unknown> = {
      shippingRateId: selectedRateId,
      couponCode: coupon?.code,
      note: note.trim() || undefined,
    };
    if (selectedAddressId === 'new') {
      body.address = newAddress;
      body.saveAddress = saveNewAddress;
    } else {
      body.addressId = selectedAddressId;
    }
    orderMutation.mutate(body);
  };

  // ---- Gates -------------------------------------------------------------

  if (status === 'loading' || cartLoading) {
    return (
      <div className="grid gap-8 lg:grid-cols-[1fr_380px]">
        <div className="space-y-4">
          <Skeleton className="h-40 rounded-2xl" />
          <Skeleton className="h-40 rounded-2xl" />
        </div>
        <Skeleton className="h-80 rounded-2xl" />
      </div>
    );
  }

  if (status === 'unauthenticated') {
    return (
      <EmptyState
        icon={Lock}
        title="Sign in to check out"
        description="Please sign in or create an account to complete your order securely."
        action={
          <div className="flex gap-3">
            <Button asChild size="lg">
              <Link href="/login?redirect=/checkout">Sign In</Link>
            </Button>
            <Button asChild size="lg" variant="outline">
              <Link href="/register?redirect=/checkout">Create Account</Link>
            </Button>
          </div>
        }
      />
    );
  }

  if (items.length === 0) {
    return (
      <EmptyState
        icon={ShoppingBag}
        title="Your bag is empty"
        description="Add some products before heading to checkout."
        action={
          <Button asChild size="lg">
            <Link href="/shop">Start Shopping</Link>
          </Button>
        }
      />
    );
  }

  // ---- Main --------------------------------------------------------------

  return (
    <div className="grid gap-8 lg:grid-cols-[1fr_380px]">
      <div className="space-y-6">
        {/* 1. Contact */}
        <SectionCard step={1} icon={MapPin} title="Contact">
          <p className="text-sm text-muted-foreground">
            Order updates will be sent to{' '}
            <span className="font-medium text-foreground">{user?.email}</span>.
          </p>
        </SectionCard>

        {/* 2. Delivery address */}
        <SectionCard step={2} icon={MapPin} title="Delivery Address">
          {addressesLoading ? (
            <Skeleton className="h-20 rounded-xl" />
          ) : (
            <div className="space-y-3">
              {addresses.map((a) => (
                <button
                  key={a.id}
                  type="button"
                  onClick={() => {
                    setSelectedAddressId(a.id);
                    setShowNewForm(false);
                  }}
                  className={cn(
                    'flex w-full items-start gap-3 rounded-xl border p-4 text-left transition-colors',
                    selectedAddressId === a.id ? 'border-primary bg-primary/5 ring-1 ring-primary' : 'hover:border-primary/40',
                  )}
                >
                  <span
                    className={cn(
                      'mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border',
                      selectedAddressId === a.id ? 'border-primary bg-primary text-primary-foreground' : 'border-input',
                    )}
                  >
                    {selectedAddressId === a.id && <Check className="h-3 w-3" />}
                  </span>
                  <span className="text-sm">
                    <span className="font-medium">
                      {a.fullName}
                      {a.label && <span className="ml-2 text-xs text-muted-foreground">({a.label})</span>}
                      {a.isDefault && (
                        <span className="ml-2 rounded-full bg-secondary px-2 py-0.5 text-[10px] font-medium uppercase text-primary-deep">
                          Default
                        </span>
                      )}
                    </span>
                    <span className="mt-0.5 block text-muted-foreground">{formatAddress(a)}</span>
                    <span className="mt-0.5 block text-muted-foreground">{a.phone}</span>
                  </span>
                </button>
              ))}

              {/* New address (entered but not yet using the form) */}
              {selectedAddressId === 'new' && newAddress && !showNewForm && (
                <div className="flex items-start justify-between gap-3 rounded-xl border border-primary bg-primary/5 p-4 ring-1 ring-primary">
                  <div className="text-sm">
                    <span className="font-medium">{newAddress.fullName}</span>
                    <span className="mt-0.5 block text-muted-foreground">{formatAddress(newAddress)}</span>
                    <span className="mt-0.5 block text-muted-foreground">{newAddress.phone}</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowNewForm(true)}
                    className="inline-flex shrink-0 items-center gap-1 text-sm text-primary hover:underline"
                  >
                    <Pencil className="h-3.5 w-3.5" /> Edit
                  </button>
                </div>
              )}

              {showNewForm ? (
                <div className="rounded-xl border border-dashed p-4">
                  <AddressForm
                    defaultValues={newAddress ?? undefined}
                    showDefaultToggle={false}
                    submitLabel="Use this address"
                    onCancel={
                      addresses.length > 0
                        ? () => {
                            setShowNewForm(false);
                            if (!newAddress) {
                              const def = addresses.find((a) => a.isDefault) ?? addresses[0];
                              setSelectedAddressId(def.id);
                            }
                          }
                        : undefined
                    }
                    onSubmit={(values) => {
                      setNewAddress(values);
                      setSelectedAddressId('new');
                      setShowNewForm(false);
                    }}
                  />
                  <label className="mt-3 flex cursor-pointer items-center gap-2.5 text-sm">
                    <Checkbox
                      checked={saveNewAddress}
                      onCheckedChange={(v) => setSaveNewAddress(v === true)}
                    />
                    Save this address to my account
                  </label>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => setShowNewForm(true)}
                  className="inline-flex items-center gap-1.5 text-sm font-medium text-primary hover:underline"
                >
                  <Plus className="h-4 w-4" /> Use a new address
                </button>
              )}
            </div>
          )}
        </SectionCard>

        {/* 3. Shipping method */}
        <SectionCard step={3} icon={Truck} title="Shipping Method">
          {!destState ? (
            <p className="text-sm text-muted-foreground">Choose a delivery address to see shipping options.</p>
          ) : shippingQuery.isLoading ? (
            <div className="space-y-3">
              <Skeleton className="h-16 rounded-xl" />
              <Skeleton className="h-16 rounded-xl" />
            </div>
          ) : shippingOptions.length === 0 ? (
            <p className="text-sm text-amber-600">
              {shippingQuery.data?.message ??
                'No shipping options are available for this location yet. Please contact support.'}
            </p>
          ) : (
            <div className="space-y-3">
              {shippingOptions.map((o) => (
                <button
                  key={o.rateId}
                  type="button"
                  onClick={() => setSelectedRateId(o.rateId)}
                  className={cn(
                    'flex w-full items-center justify-between gap-3 rounded-xl border p-4 text-left transition-colors',
                    selectedRateId === o.rateId ? 'border-primary bg-primary/5 ring-1 ring-primary' : 'hover:border-primary/40',
                  )}
                >
                  <span className="flex items-start gap-3">
                    <span
                      className={cn(
                        'mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border',
                        selectedRateId === o.rateId ? 'border-primary bg-primary text-primary-foreground' : 'border-input',
                      )}
                    >
                      {selectedRateId === o.rateId && <Check className="h-3 w-3" />}
                    </span>
                    <span className="text-sm">
                      <span className="font-medium">{o.name}</span>
                      <span className="mt-0.5 block text-muted-foreground">{o.estimate}</span>
                    </span>
                  </span>
                  <span className="text-sm font-semibold">
                    {o.isFree ? 'Free' : formatNaira(o.cost)}
                  </span>
                </button>
              ))}
            </div>
          )}
        </SectionCard>

        {/* 4. Delivery note */}
        <SectionCard step={4} icon={Pencil} title="Delivery Note (optional)">
          <Textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            maxLength={500}
            placeholder="Any special instructions for delivery?"
          />
        </SectionCard>
      </div>

      {/* Order summary */}
      <div className="lg:sticky lg:top-24 lg:self-start">
        <div className="rounded-2xl border bg-card p-6">
          <h2 className="font-serif text-xl font-semibold">Order Summary</h2>

          {/* Items */}
          <ul className="mt-4 space-y-3">
            {items.map((item) => (
              <li key={item.id} className="flex gap-3">
                <div className="relative h-16 w-14 shrink-0 overflow-hidden rounded-lg bg-secondary">
                  {item.image ? (
                    <Image src={item.image} alt={item.name} fill className="object-cover" sizes="56px" />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center text-xs text-primary/30">AL</div>
                  )}
                  <span className="absolute -right-1.5 -top-1.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-primary px-1 text-[10px] font-semibold text-primary-foreground">
                    {item.quantity}
                  </span>
                </div>
                <div className="flex flex-1 items-start justify-between gap-2 text-sm">
                  <div>
                    <p className="line-clamp-2 font-medium leading-snug">{item.name}</p>
                    {item.variantLabel && (
                      <p className="text-xs text-muted-foreground">{item.variantLabel}</p>
                    )}
                  </div>
                  <span className="shrink-0 font-medium">{formatNaira(item.lineTotal)}</span>
                </div>
              </li>
            ))}
          </ul>

          <Separator className="my-4" />

          {/* Coupon */}
          <div>
            <Label htmlFor="coupon" className="flex items-center gap-1.5 text-sm">
              <Tag className="h-3.5 w-3.5 text-primary" /> Promo code
            </Label>
            {coupon ? (
              <div className="mt-2 flex items-center justify-between rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm">
                <span className="font-medium text-emerald-800">
                  {coupon.code} applied
                  <span className="ml-1 font-normal text-emerald-700">(−{formatNaira(coupon.discount)})</span>
                </span>
                <button
                  type="button"
                  onClick={() => {
                    setCoupon(null);
                    setCouponInput('');
                  }}
                  className="text-emerald-700 hover:underline"
                >
                  Remove
                </button>
              </div>
            ) : (
              <div className="mt-2 flex gap-2">
                <Input
                  id="coupon"
                  value={couponInput}
                  onChange={(e) => setCouponInput(e.target.value.toUpperCase())}
                  placeholder="Enter code"
                  className="uppercase"
                />
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => couponInput.trim() && couponMutation.mutate(couponInput.trim())}
                  loading={couponMutation.isPending}
                  disabled={!couponInput.trim()}
                >
                  Apply
                </Button>
              </div>
            )}
          </div>

          <Separator className="my-4" />

          {/* Totals */}
          <dl className="space-y-2.5 text-sm">
            <div className="flex items-center justify-between">
              <dt className="text-muted-foreground">Subtotal</dt>
              <dd className="font-medium">{formatNaira(summary.subtotal)}</dd>
            </div>
            {discount > 0 && (
              <div className="flex items-center justify-between text-emerald-700">
                <dt>Discount</dt>
                <dd className="font-medium">−{formatNaira(discount)}</dd>
              </div>
            )}
            <div className="flex items-center justify-between">
              <dt className="text-muted-foreground">Shipping</dt>
              <dd className="font-medium">
                {!selectedOption
                  ? '—'
                  : selectedOption.isFree
                    ? 'Free'
                    : formatNaira(shippingCost)}
              </dd>
            </div>
          </dl>

          <Separator className="my-4" />

          <div className="flex items-center justify-between">
            <span className="font-medium">Total</span>
            <span className="font-serif text-2xl font-semibold">{formatNaira(total)}</span>
          </div>

          <Button
            size="lg"
            className="mt-6 w-full"
            onClick={placeOrder}
            disabled={!canPlaceOrder}
          >
            {orderMutation.isPending ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" /> Placing order…
              </>
            ) : (
              <>
                <Lock className="h-4 w-4" /> Pay {formatNaira(total)}
              </>
            )}
          </Button>

          <p className="mt-3 flex items-center justify-center gap-1.5 text-xs text-muted-foreground">
            <ShieldCheck className="h-3.5 w-3.5 text-primary" /> Secured by Paystack
          </p>
        </div>
      </div>
    </div>
  );
}
