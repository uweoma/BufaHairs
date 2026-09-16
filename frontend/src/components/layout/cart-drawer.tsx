'use client';

import Link from 'next/link';
import Image from 'next/image';
import { ShoppingBag, X } from 'lucide-react';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetFooter,
} from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { QuantityStepper } from '@/components/cart/quantity-stepper';
import { EmptyState } from '@/components/ui/empty-state';
import { useCart } from '@/hooks/use-cart';
import { useUIStore } from '@/store/ui-store';
import { formatNaira } from '@/lib/utils';

export function CartDrawer() {
  const { cartOpen, setCartOpen, closeCart } = useUIStore();
  const { items, summary, setQuantity, remove, isMutating } = useCart();

  return (
    <Sheet open={cartOpen} onOpenChange={setCartOpen}>
      <SheetContent side="right" className="flex w-full flex-col p-0 sm:max-w-md">
        <SheetHeader className="flex-row items-center justify-between border-b px-6 py-4">
          <SheetTitle className="flex items-center gap-2">
            <ShoppingBag className="h-5 w-5 text-primary" />
            Your Bag {summary.itemCount > 0 && `(${summary.itemCount})`}
          </SheetTitle>
        </SheetHeader>

        {items.length === 0 ? (
          <div className="flex flex-1 items-center justify-center p-6">
            <EmptyState
              icon={ShoppingBag}
              title="Your bag is empty"
              description="Discover our premium collection and find your perfect look."
              action={
                <Button asChild onClick={closeCart}>
                  <Link href="/shop">Start Shopping</Link>
                </Button>
              }
            />
          </div>
        ) : (
          <>
            <div className="flex-1 space-y-4 overflow-y-auto px-6 py-4">
              {items.map((item) => (
                <div key={item.id} className="flex gap-3">
                  <Link
                    href={`/products/${item.slug}`}
                    onClick={closeCart}
                    className="relative h-24 w-20 shrink-0 overflow-hidden rounded-xl bg-secondary"
                  >
                    {item.image ? (
                      <Image src={item.image} alt={item.name} fill className="object-cover" sizes="80px" />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center text-primary/30">AL</div>
                    )}
                  </Link>
                  <div className="flex flex-1 flex-col">
                    <div className="flex items-start justify-between gap-2">
                      <Link
                        href={`/products/${item.slug}`}
                        onClick={closeCart}
                        className="line-clamp-2 text-sm font-medium hover:text-primary"
                      >
                        {item.name}
                      </Link>
                      <button
                        onClick={() => remove(item)}
                        className="text-muted-foreground transition-colors hover:text-destructive"
                        aria-label="Remove item"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                    {item.variantLabel && (
                      <span className="mt-0.5 text-xs text-muted-foreground">{item.variantLabel}</span>
                    )}
                    {item.exceedsStock && (
                      <span className="mt-0.5 text-xs text-amber-600">
                        Only {item.availableStock} left
                      </span>
                    )}
                    <div className="mt-auto flex items-center justify-between pt-2">
                      <QuantityStepper
                        size="sm"
                        value={item.quantity}
                        max={item.maxQuantity}
                        onChange={(q) => setQuantity(item, q)}
                        disabled={isMutating}
                      />
                      <span className="text-sm font-semibold text-primary-deep">
                        {formatNaira(item.lineTotal)}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <SheetFooter className="border-t px-6 py-4">
              <div className="flex items-center justify-between text-base">
                <span className="text-muted-foreground">Subtotal</span>
                <span className="font-serif text-xl font-semibold">{formatNaira(summary.subtotal)}</span>
              </div>
              <p className="text-xs text-muted-foreground">
                Shipping &amp; discounts calculated at checkout.
              </p>
              <div className="grid grid-cols-2 gap-2">
                <Button variant="outline" asChild onClick={closeCart}>
                  <Link href="/cart">View Bag</Link>
                </Button>
                <Button asChild onClick={closeCart}>
                  <Link href="/checkout">Checkout</Link>
                </Button>
              </div>
            </SheetFooter>
          </>
        )}
      </SheetContent>
    </Sheet>
  );
}
