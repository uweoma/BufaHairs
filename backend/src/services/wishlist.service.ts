import { prisma } from '../config/prisma';
import { ApiError } from '../utils/ApiError';
import { productCardInclude, serializeProductCard } from '../serializers/product.serializer';
import * as cartService from './cart.service';

async function getOrCreateWishlistId(userId: string): Promise<string> {
  const wishlist = await prisma.wishlist.upsert({
    where: { userId },
    update: {},
    create: { userId },
    select: { id: true },
  });
  return wishlist.id;
}

export async function listWishlist(userId: string) {
  await getOrCreateWishlistId(userId);
  const wishlist = await prisma.wishlist.findUnique({
    where: { userId },
    include: {
      items: {
        orderBy: { createdAt: 'desc' },
        include: { product: { include: productCardInclude } },
      },
    },
  });
  const items = (wishlist?.items ?? [])
    // Product could have been archived; keep the row but mark unavailable.
    .filter((i) => i.product && !i.product.deletedAt)
    .map((i) => ({
      id: i.id,
      productId: i.productId,
      createdAt: i.createdAt,
      product: serializeProductCard(i.product),
      available: i.product.isActive,
    }));
  return { items };
}

export async function addItem(userId: string, productId: string) {
  const product = await prisma.product.findFirst({
    where: { id: productId, isActive: true, deletedAt: null },
    select: { id: true },
  });
  if (!product) throw ApiError.notFound('Product not available');

  const wishlistId = await getOrCreateWishlistId(userId);
  await prisma.wishlistItem.upsert({
    where: { wishlistId_productId: { wishlistId, productId } },
    update: {},
    create: { wishlistId, productId },
  });
  return listWishlist(userId);
}

export async function removeItem(userId: string, productId: string) {
  const wishlistId = await getOrCreateWishlistId(userId);
  await prisma.wishlistItem.deleteMany({ where: { wishlistId, productId } });
  return listWishlist(userId);
}

export async function moveToCart(userId: string, productId: string) {
  const product = await prisma.product.findFirst({
    where: { id: productId, isActive: true, deletedAt: null },
    include: { variants: { where: { isActive: true }, select: { id: true } } },
  });
  if (!product) throw ApiError.notFound('Product not available');
  if (product.variants.length > 0) {
    throw ApiError.badRequest('This product has options — open it to choose before adding to cart');
  }
  const cart = await cartService.addItem(userId, { productId, variantId: null, quantity: 1 });
  const wishlist = await removeItem(userId, productId);
  return { cart, wishlist };
}
