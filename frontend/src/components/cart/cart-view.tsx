'use client';

import Link from 'next/link';
import Image from 'next/image';
import { ShoppingBag, X, Trash2, ArrowRight, Truck, ShieldCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import { EmptyState } from '@/components/ui/empty-state';
import { QuantityStepper } from '@/components/cart/quantity-stepper';
import { useCart } from '@/hooks/use-cart';
import { formatNaira } from '@/lib/utils';

export function CartView() {
  const { items, summary, setQuantity, remove, clear, isLoading, isMutating } = useCart();

  if (isLoading) {
    return (
      <div className="grid gap-8 lg:grid-cols-[1fr_360px]">
        <div className="space-y-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="flex gap-4 rounded-2xl border p-4">
              <Skeleton className="h-28 w-24 rounded-xl" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-4 w-2/3" />
                <Skeleton className="h-3 w-1/3" />
                <Skeleton className="h-8 w-32" />
              </div>
            </div>
          ))}
        </div>
        <Skeleton className="h-72 rounded-2xl" />
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <EmptyState
        icon={ShoppingBag}
        title="Your bag is empty"
        description="You haven't added anything yet. Explore our premium collection to find your perfect look."
        action={
          <Button asChild size="lg">
            <Link href="/shop">Start Shopping</Link>
          </Button>
        }
      />
    );
  }

  return (
    <div className="grid gap-8 lg:grid-cols-[1fr_360px]">
      {/* Line items */}
      <div>
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            {summary.distinctItems} {summary.distinctItems === 1 ? 'item' : 'items'} · {summary.itemCount} total
          </p>
          <button
            onClick={() => clear()}
            disabled={isMutating}
            className="inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-destructive disabled:opacity-50"
          >
            <Trash2 className="h-4 w-4" /> Clear bag
          </button>
        </div>

        {summary.hasStockIssues && (
          <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
            Some items exceed available stock. Please adjust quantities before checkout.
          </div>
        )}

        <ul className="mt-4 divide-y rounded-2xl border">
          {items.map((item) => (
            <li key={item.id} className="flex gap-4 p-4 sm:p-5">
              <Link
                href={`/products/${item.slug}`}
                className="relative h-28 w-24 shrink-0 overflow-hidden rounded-xl bg-secondary"
              >
                {item.image ? (
                  <Image src={item.image} alt={item.name} fill className="object-cover" sizes="96px" />
                ) : (
                  <div className="flex h-full w-full items-center justify-center text-primary/30">AL</div>
                )}
              </Link>

              <div className="flex flex-1 flex-col">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <Link
                      href={`/products/${item.slug}`}
                      className="font-medium leading-snug hover:text-primary"
                    >
                      {item.name}
                    </Link>
                    {item.variantLabel && (
                      <p className="mt-0.5 text-sm text-muted-foreground">{item.variantLabel}</p>
                    )}
                    <p className="mt-0.5 text-sm text-muted-foreground">{formatNaira(item.unitPrice)} each</p>
                  </div>
                  <button
                    onClick={() => remove(item)}
                    disabled={isMutating}
                    className="text-muted-foreground transition-colors hover:text-destructive disabled:opacity-50"
                    aria-label={`Remove ${item.name}`}
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>

                {!item.inStock ? (
                  <p className="mt-1 text-sm font-medium text-destructive">Out of stock</p>
                ) : (
                  item.exceedsStock && (
                    <p className="mt-1 text-sm text-amber-600">Only {item.availableStock} available</p>
                  )
                )}

                <div className="mt-auto flex items-center justify-between pt-3">
                  <QuantityStepper
                    value={item.quantity}
                    max={item.maxQuantity}
                    onChange={(q) => setQuantity(item, q)}
                    disabled={isMutating}
                  />
                  <span className="font-serif text-lg font-semibold text-primary-deep">
                    {formatNaira(item.lineTotal)}
                  </span>
                </div>
              </div>
            </li>
          ))}
        </ul>

        <Button asChild variant="link" className="mt-4 px-0 text-primary">
          <Link href="/shop">← Continue shopping</Link>
        </Button>
      </div>

      {/* Order summary */}
      <div className="lg:sticky lg:top-24 lg:self-start">
        <div className="rounded-2xl border bg-card p-6">
          <h2 className="font-serif text-xl font-semibold">Order Summary</h2>
          <Separator className="my-4" />
          <dl className="space-y-3 text-sm">
            <div className="flex items-center justify-between">
              <dt className="text-muted-foreground">Subtotal</dt>
              <dd className="font-medium">{formatNaira(summary.subtotal)}</dd>
            </div>
            <div className="flex items-center justify-between">
              <dt className="text-muted-foreground">Shipping</dt>
              <dd className="text-muted-foreground">Calculated at checkout</dd>
            </div>
            <div className="flex items-center justify-between">
              <dt className="text-muted-foreground">Discounts</dt>
              <dd className="text-muted-foreground">Apply code at checkout</dd>
            </div>
          </dl>
          <Separator className="my-4" />
          <div className="flex items-center justify-between">
            <span className="font-medium">Estimated total</span>
            <span className="font-serif text-2xl font-semibold">{formatNaira(summary.subtotal)}</span>
          </div>

          {summary.hasStockIssues ? (
            <Button size="lg" className="mt-6 w-full" disabled>
              Resolve stock issues to continue
            </Button>
          ) : (
            <Button asChild size="lg" className="mt-6 w-full">
              <Link href="/checkout">
                Proceed to Checkout <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
          )}

          <ul className="mt-5 space-y-2 text-xs text-muted-foreground">
            <li className="flex items-center gap-2">
              <ShieldCheck className="h-4 w-4 text-primary" /> Secure checkout with Paystack
            </li>
            <li className="flex items-center gap-2">
              <Truck className="h-4 w-4 text-primary" /> Fast, tracked nationwide delivery
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
}
