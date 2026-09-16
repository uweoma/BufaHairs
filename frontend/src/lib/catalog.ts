import { http, qs, type Paged } from './api';
import type { Category, ProductCard, ProductDetail } from './types';

/**
 * Server-safe catalog data access. This module is intentionally NOT a
 * `'use client'` module so its helpers can be called from Server Components
 * and `generateMetadata` without becoming client references.
 */

export interface ProductFilters {
  q?: string;
  category?: string;
  minPrice?: number;
  maxPrice?: number;
  texture?: string;
  color?: string;
  minLength?: number;
  maxLength?: number;
  inStock?: boolean;
  featured?: boolean;
  bestSeller?: boolean;
  newArrival?: boolean;
  sort?: string;
  page?: number;
  limit?: number;
}

export function productsPath(filters: ProductFilters): string {
  return `/products${qs(filters as Record<string, string | number | boolean | undefined>)}`;
}

export async function fetchProduct(slug: string): Promise<ProductDetail | null> {
  try {
    return await http.get<ProductDetail>(`/products/${slug}`);
  } catch {
    return null;
  }
}

export async function fetchProducts(filters: ProductFilters): Promise<Paged<ProductCard[]>> {
  return http.getPaged<ProductCard[]>(productsPath(filters));
}

export async function fetchCategories(): Promise<Category[]> {
  try {
    return await http.get<Category[]>('/categories');
  } catch {
    return [];
  }
}
