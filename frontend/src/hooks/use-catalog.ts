'use client';

import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { http, qs } from '@/lib/api';
import { productsPath, type ProductFilters } from '@/lib/catalog';
import type { ProductCard, ProductDetail, ProductReviews, Category } from '@/lib/types';

export type { ProductFilters };

export function productsQueryOptions(filters: ProductFilters) {
  return {
    queryKey: ['products', filters] as const,
    queryFn: () => http.getPaged<ProductCard[]>(productsPath(filters)),
    placeholderData: keepPreviousData,
  };
}

export function useProducts(filters: ProductFilters) {
  return useQuery(productsQueryOptions(filters));
}

export function useCategories() {
  return useQuery({
    queryKey: ['categories'],
    queryFn: () => http.get<Category[]>('/categories'),
    staleTime: 5 * 60_000,
  });
}

export function useProduct(slug: string) {
  return useQuery({
    queryKey: ['product', slug],
    queryFn: () => http.get<ProductDetail>(`/products/${slug}`),
    enabled: Boolean(slug),
  });
}

export function useRelatedProducts(slug: string) {
  return useQuery({
    queryKey: ['product', slug, 'related'],
    queryFn: () => http.get<ProductCard[]>(`/products/${slug}/related`),
    enabled: Boolean(slug),
  });
}

export function useProductReviews(slug: string, page = 1) {
  return useQuery({
    queryKey: ['reviews', slug, page],
    queryFn: () => http.getPaged<ProductReviews>(`/reviews/product/${slug}${qs({ page, limit: 10 })}`),
    placeholderData: keepPreviousData,
  });
}
