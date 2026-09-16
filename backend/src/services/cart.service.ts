import { prisma } from '../config/prisma';
import { ApiError } from '../utils/ApiError';
import { availableStock } from '../utils/pricing';
import { cartInclude, serializeCart } from '../serializers/cart.serializer';
import type { AddCartItemInput, MergeCartInput } from '../validators/cart.validator';

async function getOrCreateCartId(userId: string): Promise<string> {
  const cart = await prisma.cart.upsert({
    where: { userId },
    update: {},
    create: { userId },
    select: { id: true },
  });
  return cart.id;
}

async function loadCart(userId: string) {
  const cart = await prisma.cart.findUnique({ where: { userId }, include: cartInclude });
  if (cart) return serializeCart(cart);
  // Create empty cart lazily.
  await getOrCreateCartId(userId);
  const created = await prisma.cart.findUnique({ where: { userId }, include: cartInclude });
  return serializeCart(created!);
}

/**
 * Resolves a purchasable (product + optional variant), enforcing that a
 * variant is chosen when the product has active variants.
 */
async function resolvePurchasable(productId: string, variantId?: string | null) {
  const product = await prisma.product.findFirst({
    where: { id: productId, isActive: true, deletedAt: null },
    include: { variants: { where: { isActive: true } } },
  });
  if (!product) throw ApiError.notFound('Product not available');

  const hasVariants = product.variants.length > 0;
  if (hasVariants && !variantId) {
    throw ApiError.badRequest('Please select a product option before adding to cart');
  }

  let variant = null;
  if (variantId) {
    variant = product.variants.find((v) => v.id === variantId) ?? null;
    if (!variant) throw ApiError.badRequest('Selected option is unavailable');
  }
  return { product, variant };
}

export function getCart(userId: string) {
  return loadCart(userId);
}

export async function addItem(userId: string, input: AddCartItemInput) {
  const { product, variant } = await resolvePurchasable(input.productId, input.variantId);
  const stock = availableStock(product, variant);
  if (stock <= 0) throw ApiError.badRequest('This item is currently out of stock');

  const cartId = await getOrCreateCartId(userId);
  const existing = await prisma.cartItem.findFirst({
    where: { cartId, productId: input.productId, variantId: input.variantId ?? null },
  });

  const desired = (existing?.quantity ?? 0) + input.quantity;
  const quantity = Math.min(desired, stock); // never exceed inventory

  if (existing) {
    await prisma.cartItem.update({ where: { id: existing.id }, data: { quantity } });
  } else {
    await prisma.cartItem.create({
      data: { cartId, productId: input.productId, variantId: input.variantId ?? null, quantity },
    });
  }
  return loadCart(userId);
}

export async function updateItem(userId: string, itemId: string, quantity: number) {
  const item = await prisma.cartItem.findFirst({
    where: { id: itemId, cart: { userId } },
    include: { product: true, variant: true },
  });
  if (!item) throw ApiError.notFound('Cart item not found');

  const stock = availableStock(item.product, item.variant);
  if (stock <= 0) {
    await prisma.cartItem.delete({ where: { id: itemId } });
    throw ApiError.badRequest('This item is now out of stock and was removed from your cart');
  }
  await prisma.cartItem.update({ where: { id: itemId }, data: { quantity: Math.min(quantity, stock) } });
  return loadCart(userId);
}

export async function removeItem(userId: string, itemId: string) {
  const item = await prisma.cartItem.findFirst({ where: { id: itemId, cart: { userId } } });
  if (!item) throw ApiError.notFound('Cart item not found');
  await prisma.cartItem.delete({ where: { id: itemId } });
  return loadCart(userId);
}

export async function clearCart(userId: string) {
  const cartId = await getOrCreateCartId(userId);
  await prisma.cartItem.deleteMany({ where: { cartId } });
  return loadCart(userId);
}

/** Merges a guest cart into the user's cart on login (quantities combined, capped by stock). */
export async function mergeGuestCart(userId: string, input: MergeCartInput) {
  for (const line of input.items) {
    try {
      await addItem(userId, {
        productId: line.productId,
        variantId: line.variantId ?? null,
        quantity: line.quantity,
      });
    } catch {
      // Skip invalid/unavailable guest lines silently — never fail the merge.
    }
  }
  return loadCart(userId);
}
