'use client';

import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { http, qs } from '@/lib/api';
import type {
  AdminOverview,
  AdminAnalytics,
  AdminCustomer,
  AdminCustomerDetail,
  AdminProduct,
  AdminReview,
  Coupon,
  CouponType,
  Order,
  OrderStatus,
  OrderSummary,
  PaginationMeta,
  Role,
} from '@/lib/types';

// ------------------------------- Input types --------------------------------

export interface ProductImageInput {
  url: string;
  publicId?: string;
  altText?: string;
  isPrimary?: boolean;
  sortOrder?: number;
}

export interface ProductVariantInput {
  sku: string;
  length?: number;
  color?: string;
  density?: string;
  capSize?: string;
  priceOverride?: number;
  stock?: number;
  isActive?: boolean;
}

export interface ProductInput {
  name: string;
  slug?: string;
  description: string;
  shortDesc?: string;
  sku: string;
  price: number;
  compareAtPrice?: number;
  stock?: number;
  lowStockAt?: number;
  texture?: string;
  origin?: string;
  weightGrams?: number;
  categoryId: string;
  isActive?: boolean;
  isFeatured?: boolean;
  isBestSeller?: boolean;
  isNewArrival?: boolean;
  metaTitle?: string;
  metaDescription?: string;
  images?: ProductImageInput[];
  variants?: ProductVariantInput[];
}

export interface CouponInput {
  code: string;
  description?: string | null;
  type: CouponType;
  value: number;
  minOrderAmount?: number | null;
  maxDiscount?: number | null;
  usageLimit?: number | null;
  perUserLimit?: number | null;
  startsAt?: string | null;
  expiresAt?: string | null;
  isActive?: boolean;
}

export interface UploadedImage {
  url: string;
  publicId?: string;
  width?: number;
  height?: number;
}

// -------------------------------- Dashboard ---------------------------------

export function useAdminOverview() {
  return useQuery({
    queryKey: ['admin', 'overview'],
    queryFn: () => http.get<AdminOverview>('/admin/overview'),
    staleTime: 30_000,
  });
}

export function useAdminAnalytics(range?: { from?: string; to?: string }) {
  return useQuery({
    queryKey: ['admin', 'analytics', range ?? {}],
    queryFn: () => http.get<AdminAnalytics>(`/admin/analytics${qs({ from: range?.from, to: range?.to })}`),
    staleTime: 60_000,
  });
}

// --------------------------------- Orders -----------------------------------

export function useAdminOrders(params: { page?: number; status?: OrderStatus | 'all'; q?: string }) {
  const status = params.status && params.status !== 'all' ? params.status : undefined;
  return useQuery({
    queryKey: ['admin', 'orders', params],
    queryFn: () =>
      http.getPaged<{ orders: OrderSummary[] }>(
        `/admin/orders${qs({ page: params.page, status, q: params.q })}`,
      ),
    select: (res) => ({ orders: res.data.orders, meta: res.meta }),
    placeholderData: keepPreviousData,
  });
}

export function useAdminOrder(orderNumber: string) {
  return useQuery({
    queryKey: ['admin', 'order', orderNumber],
    queryFn: () => http.get<{ order: Order }>(`/admin/orders/${orderNumber}`),
    select: (res) => res.order,
    enabled: Boolean(orderNumber),
  });
}

export function useUpdateOrder() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      orderNumber,
      input,
    }: {
      orderNumber: string;
      input: { status?: OrderStatus; trackingNumber?: string | null; adminNotes?: string | null };
    }) => http.patch<{ order: Order }>(`/admin/orders/${orderNumber}`, input),
    onSuccess: (_data, { orderNumber }) => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'order', orderNumber] });
      queryClient.invalidateQueries({ queryKey: ['admin', 'orders'] });
      queryClient.invalidateQueries({ queryKey: ['admin', 'overview'] });
    },
  });
}

// -------------------------------- Customers ---------------------------------

export function useAdminCustomers(params: { page?: number; q?: string; role?: Role }) {
  return useQuery({
    queryKey: ['admin', 'customers', params],
    queryFn: () =>
      http.getPaged<{ customers: AdminCustomer[] }>(
        `/admin/customers${qs({ page: params.page, q: params.q, role: params.role })}`,
      ),
    select: (res) => ({ customers: res.data.customers, meta: res.meta }),
    placeholderData: keepPreviousData,
  });
}

export function useAdminCustomer(id: string) {
  return useQuery({
    queryKey: ['admin', 'customer', id],
    queryFn: () => http.get<{ customer: AdminCustomerDetail }>(`/admin/customers/${id}`),
    select: (res) => res.customer,
    enabled: Boolean(id),
  });
}

export function useSetCustomerActive() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, isActive }: { id: string; isActive: boolean }) =>
      http.patch<{ customer: AdminCustomer }>(`/admin/customers/${id}`, { isActive }),
    onSuccess: (_data, { id }) => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'customer', id] });
      queryClient.invalidateQueries({ queryKey: ['admin', 'customers'] });
    },
  });
}

// --------------------------------- Products ---------------------------------

export function useAdminProducts(params: { page?: number; q?: string; includeDeleted?: boolean }) {
  return useQuery({
    queryKey: ['admin', 'products', params],
    queryFn: () =>
      http.getPaged<{ products: AdminProduct[] }>(
        `/admin/products${qs({ page: params.page, q: params.q, includeDeleted: params.includeDeleted })}`,
      ),
    select: (res) => ({ products: res.data.products, meta: res.meta }),
    placeholderData: keepPreviousData,
  });
}

export function useAdminProduct(id: string) {
  return useQuery({
    queryKey: ['admin', 'product', id],
    queryFn: () => http.get<{ product: AdminProduct }>(`/admin/products/${id}`),
    select: (res) => res.product,
    enabled: Boolean(id),
  });
}

export function useCreateProduct() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: ProductInput) => http.post<{ product: AdminProduct }>('/admin/products', input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'products'] });
      queryClient.invalidateQueries({ queryKey: ['admin', 'overview'] });
    },
  });
}

export function useUpdateProduct() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: Partial<ProductInput> }) =>
      http.patch<{ product: AdminProduct }>(`/admin/products/${id}`, input),
    onSuccess: (_data, { id }) => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'product', id] });
      queryClient.invalidateQueries({ queryKey: ['admin', 'products'] });
    },
  });
}

export function useDeleteProduct() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => http.del<{ hardDeleted: boolean }>(`/admin/products/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'products'] });
      queryClient.invalidateQueries({ queryKey: ['admin', 'overview'] });
    },
  });
}

// ---------------------------------- Coupons ---------------------------------

export function useCoupons(params: { page?: number }) {
  return useQuery({
    queryKey: ['admin', 'coupons', params],
    queryFn: () => http.getPaged<{ coupons: Coupon[] }>(`/admin/coupons${qs({ page: params.page })}`),
    select: (res) => ({ coupons: res.data.coupons, meta: res.meta }),
    placeholderData: keepPreviousData,
  });
}

export function useCreateCoupon() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: CouponInput) => http.post<{ coupon: Coupon }>('/admin/coupons', input),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin', 'coupons'] }),
  });
}

export function useUpdateCoupon() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: Partial<CouponInput> }) =>
      http.patch<{ coupon: Coupon }>(`/admin/coupons/${id}`, input),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin', 'coupons'] }),
  });
}

export function useDeleteCoupon() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => http.del<{ deleted: boolean }>(`/admin/coupons/${id}`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin', 'coupons'] }),
  });
}

// ---------------------------------- Reviews ---------------------------------

export function useAdminReviews(params: { page?: number; approved?: boolean; productId?: string }) {
  return useQuery({
    queryKey: ['admin', 'reviews', params],
    queryFn: () =>
      http.getPaged<{ reviews: AdminReview[] }>(
        `/admin/reviews${qs({ page: params.page, approved: params.approved, productId: params.productId })}`,
      ),
    select: (res) => ({ reviews: res.data.reviews, meta: res.meta }),
    placeholderData: keepPreviousData,
  });
}

export function useModerateReview() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, isApproved }: { id: string; isApproved: boolean }) =>
      http.patch<{ review: AdminReview }>(`/admin/reviews/${id}`, { isApproved }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin', 'reviews'] }),
  });
}

export function useDeleteReview() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => http.del(`/admin/reviews/${id}`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin', 'reviews'] }),
  });
}

// ---------------------------------- Uploads ---------------------------------

export function useUploadImages() {
  return useMutation({
    mutationFn: async (files: File[]) => {
      const form = new FormData();
      files.forEach((file) => form.append('images', file));
      const res = await http.post<{ images: UploadedImage[] }>('/admin/uploads', form);
      return res.images;
    },
  });
}

export type { PaginationMeta };
