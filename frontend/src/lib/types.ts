/**
 * API types — mirror the backend serializers/response shapes.
 * All monetary values are integer KOBO (NGN minor units).
 */

export type Role = 'CUSTOMER' | 'ADMIN';

export type OrderStatus =
  | 'PENDING'
  | 'PAID'
  | 'PROCESSING'
  | 'SHIPPED'
  | 'DELIVERED'
  | 'CANCELLED'
  | 'REFUNDED';

export type PaymentStatus = 'PENDING' | 'PROCESSING' | 'SUCCESS' | 'FAILED' | 'REFUNDED';

export type HairTexture =
  | 'STRAIGHT'
  | 'BODY_WAVE'
  | 'DEEP_WAVE'
  | 'WATER_WAVE'
  | 'LOOSE_WAVE'
  | 'CURLY'
  | 'KINKY_STRAIGHT'
  | 'JERRY_CURL'
  | 'NATURAL';

export type CouponType = 'PERCENTAGE' | 'FIXED';

export type NotificationType = 'ORDER_UPDATE' | 'PAYMENT' | 'PROMO' | 'SYSTEM';

/** Standard success envelope. */
export interface ApiEnvelope<T> {
  success: true;
  message: string;
  data: T;
  meta?: PaginationMeta;
}

export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
}

export interface User {
  id: string;
  email: string;
  fullName: string;
  phone: string | null;
  role: Role;
  avatarUrl: string | null;
  isActive: boolean;
  emailVerified: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface AuthPayload {
  user: User;
  accessToken: string;
}

export interface CategoryRef {
  id: string;
  name: string;
  slug: string;
}

export interface Category extends CategoryRef {
  description: string | null;
  imageUrl: string | null;
  sortOrder: number;
  isActive: boolean;
  productCount: number;
  createdAt?: string;
}

export interface ProductImage {
  id: string;
  url: string;
  altText: string | null;
  isPrimary?: boolean;
}

export interface ProductVariant {
  id: string;
  sku: string;
  label: string;
  length: number | null;
  color: string | null;
  density: string | null;
  capSize: string | null;
  price: number;
  stock: number;
  inStock: boolean;
}

export interface ProductCard {
  id: string;
  name: string;
  slug: string;
  sku: string;
  price: number;
  compareAtPrice: number | null;
  stock: number;
  texture: HairTexture | null;
  origin: string | null;
  isFeatured: boolean;
  isBestSeller: boolean;
  isNewArrival: boolean;
  ratingAvg: number;
  ratingCount: number;
  salesCount: number;
  category: CategoryRef | null;
  images: ProductImage[];
  inStock: boolean;
  onSale: boolean;
  createdAt: string;
}

export interface ProductDetail extends ProductCard {
  description: string;
  shortDesc: string | null;
  lowStockAt: number;
  weightGrams: number | null;
  metaTitle: string | null;
  metaDescription: string | null;
  updatedAt: string;
  variants: ProductVariant[];
}

export interface CartItem {
  id: string;
  productId: string;
  variantId: string | null;
  name: string;
  slug: string;
  image: string | null;
  variantLabel: string | null;
  unitPrice: number;
  quantity: number;
  lineTotal: number;
  availableStock: number;
  inStock: boolean;
  exceedsStock: boolean;
  maxQuantity: number;
}

export interface CartSummary {
  itemCount: number;
  distinctItems: number;
  subtotal: number;
  hasStockIssues: boolean;
}

export interface Cart {
  id: string;
  items: CartItem[];
  summary: CartSummary;
}

export interface WishlistItem extends ProductCard {}

export interface ShippingOption {
  rateId: string;
  name: string;
  price: number;
  cost: number;
  isFree: boolean;
  freeShippingThreshold: number | null;
  minDeliveryDays: number;
  maxDeliveryDays: number;
  estimate: string;
}

export interface ShippingQuote {
  zone: { id: string; name: string; description: string | null } | null;
  options: ShippingOption[];
  message?: string;
}

export interface ShippingZone {
  id: string;
  name: string;
  description: string | null;
  country: string;
  states: string[];
  rates: {
    id: string;
    name: string;
    price: number;
    minDeliveryDays: number;
    maxDeliveryDays: number;
    freeShippingThreshold: number | null;
  }[];
}

export interface Address {
  id: string;
  label: string | null;
  fullName: string;
  phone: string;
  addressLine1: string;
  addressLine2: string | null;
  city: string;
  state: string;
  country: string;
  postalCode: string | null;
  isDefault: boolean;
  createdAt?: string;
}

export interface CouponValidation {
  valid: boolean;
  code: string;
  type: CouponType;
  description: string | null;
  discount: number;
  subtotal: number;
  total: number;
}

export interface OrderItem {
  id: string;
  productId: string | null;
  variantId: string | null;
  productName: string;
  productSlug: string | null;
  variantLabel: string | null;
  sku: string | null;
  imageUrl: string | null;
  unitPrice: number;
  quantity: number;
  lineTotal: number;
}

export interface OrderPayment {
  status: PaymentStatus;
  reference: string;
  authorizationUrl: string | null;
  channel: string | null;
  amount: number;
  paidAt: string | null;
}

export interface Order {
  id: string;
  orderNumber: string;
  status: OrderStatus;
  contact: { email: string; phone: string; fullName: string };
  shippingAddress: {
    fullName: string;
    phone: string;
    addressLine1: string;
    addressLine2: string | null;
    city: string;
    state: string;
    country: string;
    postalCode: string | null;
  };
  totals: {
    subtotal: number;
    discountTotal: number;
    shippingTotal: number;
    total: number;
  };
  couponCode: string | null;
  shippingMethod: string | null;
  shippingZone: string | null;
  trackingNumber: string | null;
  deliveryNotes: string | null;
  items: OrderItem[];
  payment: OrderPayment | null;
  placedAt: string;
  paidAt: string | null;
  shippedAt: string | null;
  deliveredAt: string | null;
  cancelledAt: string | null;
  updatedAt: string;
}

export interface OrderSummary {
  id: string;
  orderNumber: string;
  status: OrderStatus;
  total: number;
  itemCount: number;
  paymentStatus: PaymentStatus | null;
  placedAt: string;
}

/** Shape returned by initializeForOrder (POST /orders and /payments/:n/initialize). */
export interface PaymentInit {
  reference: string;
  authorizationUrl: string | null;
  paystackEnabled: boolean;
  publicKey: string;
}

export interface CreateOrderResponse {
  order: Order;
  payment: PaymentInit;
}

/** Result of POST /payments/verify. */
export interface PaymentVerifyResult {
  status: string;
  order: Order | null;
}

export interface Review {
  id: string;
  rating: number;
  title: string | null;
  comment: string;
  isVerified: boolean;
  isApproved?: boolean;
  createdAt: string;
  author: { fullName: string };
}

export interface ReviewSummary {
  average: number;
  total: number;
  distribution: Record<'1' | '2' | '3' | '4' | '5', number>;
}

export interface ProductReviews {
  reviews: Review[];
  summary: ReviewSummary;
}

export interface Notification {
  id: string;
  type: NotificationType;
  title: string;
  body: string | null;
  isRead: boolean;
  data: Record<string, unknown> | null;
  createdAt: string;
}

export interface NotificationList {
  notifications: Notification[];
  total: number;
  unreadCount: number;
}

// ---------------------------- Admin ----------------------------------------

export interface AdminOverview {
  revenue: { total: number; today: number; last30Days: number; averageOrderValue: number };
  orders: {
    total: number;
    byStatus: Record<string, number>;
    pending: number;
    awaitingFulfilment: number;
  };
  customers: { total: number };
  products: { total: number; lowStock: number };
  recentOrders: OrderSummary[];
  topProducts: { id: string; name: string; slug: string; salesCount: number; price: number }[];
}

export interface AdminAnalytics {
  range: { from: string; to: string };
  series: { date: string; revenue: number; orders: number }[];
  summary: { totalRevenue: number; totalOrders: number; averageOrderValue: number };
  newCustomers: number;
  topProducts: { id: string; name: string; slug: string; unitsSold: number; revenue: number }[];
}

export interface AdminCustomer {
  id: string;
  fullName: string;
  email: string;
  phone: string | null;
  role: Role;
  isActive: boolean;
  emailVerified: boolean;
  orderCount: number;
  totalSpent: number;
  createdAt: string;
}

export interface AdminCustomerDetail extends AdminCustomer {
  addressCount: number;
  reviewCount: number;
  recentOrders: OrderSummary[];
}

export interface AdminReview extends Review {
  isApproved: boolean;
  product: { name: string; slug: string };
  author: { fullName: string; email: string };
}

export interface Coupon {
  id: string;
  code: string;
  description: string | null;
  type: CouponType;
  value: number;
  minSpend: number | null;
  maxDiscount: number | null;
  usageLimit: number | null;
  perUserLimit: number | null;
  usedCount: number;
  timesRedeemed: number;
  startsAt: string | null;
  expiresAt: string | null;
  isActive: boolean;
  applicableProducts?: { id: string; name: string; slug: string }[];
  applicableCategories?: { id: string; name: string; slug: string }[];
  createdAt: string;
}

/** Admin product shape (from productService.getAdminProduct) — superset of detail. */
export interface AdminProduct extends ProductDetail {
  isActive: boolean;
  deletedAt: string | null;
}
