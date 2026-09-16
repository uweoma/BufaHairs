import { Prisma } from '@prisma/client';
import { effectiveUnitPrice, availableStock, variantLabel } from '../utils/pricing';

export const cartItemInclude = {
  product: {
    include: {
      images: { orderBy: [{ isPrimary: 'desc' }, { sortOrder: 'asc' }], take: 1 },
    },
  },
  variant: true,
} satisfies Prisma.CartItemInclude;

export const cartInclude = {
  items: {
    include: cartItemInclude,
    orderBy: { createdAt: 'asc' },
  },
} satisfies Prisma.CartInclude;

type CartItemPayload = Prisma.CartItemGetPayload<{ include: typeof cartItemInclude }>;
type CartPayload = Prisma.CartGetPayload<{ include: typeof cartInclude }>;

export function serializeCartItem(item: CartItemPayload) {
  const unitPrice = effectiveUnitPrice(item.product, item.variant);
  const stock = availableStock(item.product, item.variant);
  const quantity = Math.min(item.quantity, Math.max(stock, 0));
  return {
    id: item.id,
    productId: item.productId,
    variantId: item.variantId,
    name: item.product.name,
    slug: item.product.slug,
    image: item.product.images[0]?.url ?? null,
    variantLabel: variantLabel(item.variant),
    unitPrice,
    quantity: item.quantity,
    lineTotal: unitPrice * item.quantity,
    availableStock: stock,
    inStock: stock > 0,
    // Flags a quantity that exceeds current stock (e.g. stock dropped after add).
    exceedsStock: item.quantity > stock,
    maxQuantity: Math.max(stock, 0),
    _clampedQuantity: quantity,
  };
}

export function serializeCart(cart: CartPayload) {
  const items = cart.items.map(serializeCartItem);
  const subtotal = items.reduce((sum, i) => sum + i.unitPrice * i.quantity, 0);
  const itemCount = items.reduce((sum, i) => sum + i.quantity, 0);
  return {
    id: cart.id,
    items,
    summary: {
      itemCount,
      distinctItems: items.length,
      subtotal,
      hasStockIssues: items.some((i) => i.exceedsStock || !i.inStock),
    },
  };
}
