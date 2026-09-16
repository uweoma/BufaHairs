/** Runtime + display constants for the BufaHairs storefront. */

export const BRAND_NAME = process.env.NEXT_PUBLIC_BRAND_NAME || 'BufaHairs';
export const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';
export const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api';
export const WHATSAPP_NUMBER = process.env.NEXT_PUBLIC_WHATSAPP_NUMBER || '';
export const PAYSTACK_PUBLIC_KEY = process.env.NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY || '';

export const BRAND_TAGLINE = 'Luxury hair, crowned for you.';
export const BRAND_DESCRIPTION =
  'Premium 100% human hair wigs, bundles, frontals and closures — ethically sourced, meticulously crafted, and delivered across Nigeria and worldwide.';

/** Hair textures — mirrors the backend HairTexture enum. */
export const HAIR_TEXTURES = [
  { value: 'STRAIGHT', label: 'Straight' },
  { value: 'BODY_WAVE', label: 'Body Wave' },
  { value: 'DEEP_WAVE', label: 'Deep Wave' },
  { value: 'WATER_WAVE', label: 'Water Wave' },
  { value: 'LOOSE_WAVE', label: 'Loose Wave' },
  { value: 'CURLY', label: 'Curly' },
  { value: 'KINKY_STRAIGHT', label: 'Kinky Straight' },
  { value: 'JERRY_CURL', label: 'Jerry Curl' },
  { value: 'NATURAL', label: 'Natural' },
] as const;

export const SORT_OPTIONS = [
  { value: 'featured', label: 'Featured' },
  { value: 'newest', label: 'Newest' },
  { value: 'price_asc', label: 'Price: Low to High' },
  { value: 'price_desc', label: 'Price: High to Low' },
  { value: 'rating', label: 'Top Rated' },
  { value: 'bestselling', label: 'Best Selling' },
] as const;

/** Order status → badge styling + human label. */
export const ORDER_STATUS_META: Record<
  string,
  { label: string; className: string }
> = {
  PENDING: { label: 'Pending Payment', className: 'bg-amber-100 text-amber-800 border-amber-200' },
  PAID: { label: 'Paid', className: 'bg-emerald-100 text-emerald-800 border-emerald-200' },
  PROCESSING: { label: 'Processing', className: 'bg-blue-100 text-blue-800 border-blue-200' },
  SHIPPED: { label: 'Shipped', className: 'bg-indigo-100 text-indigo-800 border-indigo-200' },
  DELIVERED: { label: 'Delivered', className: 'bg-green-100 text-green-800 border-green-200' },
  CANCELLED: { label: 'Cancelled', className: 'bg-rose-100 text-rose-800 border-rose-200' },
  REFUNDED: { label: 'Refunded', className: 'bg-zinc-100 text-zinc-700 border-zinc-200' },
};

export const PAYMENT_STATUS_META: Record<string, { label: string; className: string }> = {
  PENDING: { label: 'Awaiting Payment', className: 'bg-amber-100 text-amber-800' },
  PROCESSING: { label: 'Processing', className: 'bg-blue-100 text-blue-800' },
  SUCCESS: { label: 'Paid', className: 'bg-emerald-100 text-emerald-800' },
  FAILED: { label: 'Failed', className: 'bg-rose-100 text-rose-800' },
  REFUNDED: { label: 'Refunded', className: 'bg-zinc-100 text-zinc-700' },
};

export const MAIN_NAV = [
  { label: 'Shop All', href: '/shop' },
  { label: 'Wigs', href: '/shop?category=lace-wigs' },
  { label: 'Bundles', href: '/shop?category=hair-bundles' },
  { label: 'Closures & Frontals', href: '/shop?category=closures-frontals' },
  { label: 'Best Sellers', href: '/shop?sort=bestselling' },
];

export const FOOTER_LINKS = {
  shop: [
    { label: 'All Products', href: '/shop' },
    { label: 'New Arrivals', href: '/shop?sort=newest' },
    { label: 'Best Sellers', href: '/shop?sort=bestselling' },
    { label: 'On Sale', href: '/shop' },
  ],
  support: [
    { label: 'Shipping & Delivery', href: '/shipping' },
    { label: 'Track Your Order', href: '/account/orders' },
    { label: 'FAQ', href: '/faq' },
    { label: 'Contact Us', href: '/contact' },
  ],
  company: [
    { label: 'About BufaHairs', href: '/about' },
    { label: 'Hair Care Guide', href: '/care-guide' },
    { label: 'Reviews', href: '/shop' },
  ],
};

/** Common wig/bundle lengths in inches, for the shop length filter. */
export const LENGTH_OPTIONS = [10, 12, 14, 16, 18, 20, 22, 24, 26, 28, 30];

/** Nigerian states + FCT, for address forms and shipping-zone matching. */
export const NIGERIA_STATES = [
  'Abia', 'Adamawa', 'Akwa Ibom', 'Anambra', 'Bauchi', 'Bayelsa', 'Benue',
  'Borno', 'Cross River', 'Delta', 'Ebonyi', 'Edo', 'Ekiti', 'Enugu',
  'FCT - Abuja', 'Gombe', 'Imo', 'Jigawa', 'Kaduna', 'Kano', 'Katsina',
  'Kebbi', 'Kogi', 'Kwara', 'Lagos', 'Nasarawa', 'Niger', 'Ogun', 'Ondo',
  'Osun', 'Oyo', 'Plateau', 'Rivers', 'Sokoto', 'Taraba', 'Yobe', 'Zamfara',
] as const;
