/* eslint-disable no-console */
import { PrismaClient, HairTexture, CouponType } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

const naira = (n: number) => n * 100; // to kobo
const img = (seed: string, i = 1) => `https://picsum.photos/seed/${seed}-${i}/900/1100`;

// ---------------------------------------------------------------------------
// Category definitions
// ---------------------------------------------------------------------------
const categories = [
  { name: 'Human Hair Wigs', slug: 'human-hair-wigs', sortOrder: 1, description: 'Premium lace front & glueless human hair wigs.' },
  { name: 'Bundles', slug: 'bundles', sortOrder: 2, description: 'Luxury raw & virgin hair bundles.' },
  { name: 'Closures', slug: 'closures', sortOrder: 3, description: 'HD & transparent lace closures.' },
  { name: 'Frontals', slug: 'frontals', sortOrder: 4, description: '13x4 & 13x6 lace frontals.' },
  { name: 'Hair Extensions', slug: 'hair-extensions', sortOrder: 5, description: 'Clip-in, tape-in & ponytail extensions.' },
  { name: 'Hair Care', slug: 'hair-care', sortOrder: 6, description: 'Shampoos, serums & accessories.' },
];

interface VariantSeed {
  sku: string;
  length?: number;
  color?: string;
  density?: string;
  capSize?: string;
  priceOverride?: number;
  stock: number;
}

interface ProductSeed {
  name: string;
  category: string;
  description: string;
  shortDesc: string;
  sku: string;
  price: number; // kobo
  compareAtPrice?: number;
  stock: number;
  texture?: HairTexture;
  origin?: string;
  isFeatured?: boolean;
  isBestSeller?: boolean;
  isNewArrival?: boolean;
  images: string[];
  variants?: VariantSeed[];
}

/** Builds length-based variants with a price step per inch. */
function lengthVariants(
  baseSku: string,
  lengths: number[],
  basePrice: number,
  step: number,
  opts: { color?: string; density?: string; capSize?: string; stock?: number } = {},
): VariantSeed[] {
  const { color = 'Natural Black', density, capSize, stock = 15 } = opts;
  return lengths.map((len, i) => ({
    sku: `${baseSku}-${len}`,
    length: len,
    color,
    density,
    capSize,
    priceOverride: basePrice + i * step,
    stock,
  }));
}

const products: ProductSeed[] = [
  // ---------------- Wigs ----------------
  {
    name: 'Luxe Body Wave Lace Front Wig',
    category: 'human-hair-wigs',
    description:
      'Our signature body wave lace front wig, hand-crafted from 100% virgin human hair. Pre-plucked hairline, bleached knots and a natural-looking parting. Soft, bouncy waves that hold beautifully wash after wash.',
    shortDesc: '100% virgin human hair, pre-plucked HD lace front.',
    sku: 'WIG-BW-001',
    price: naira(85000),
    compareAtPrice: naira(110000),
    stock: 0,
    texture: HairTexture.BODY_WAVE,
    origin: 'Brazilian',
    isFeatured: true,
    isBestSeller: true,
    images: [img('bodywave-wig', 1), img('bodywave-wig', 2), img('bodywave-wig', 3)],
    variants: lengthVariants('WIG-BW-001', [16, 18, 20, 22, 24], naira(85000), naira(12000), {
      density: '180%',
      capSize: 'Medium',
    }),
  },
  {
    name: 'Silky Straight 360 Lace Wig',
    category: 'human-hair-wigs',
    description:
      'Sleek, glass-like straight hair on a 360 lace cap for versatile styling — high ponytails, middle or side parts. Tangle-free and heat friendly.',
    shortDesc: 'Silky straight, 360 lace cap for full flexibility.',
    sku: 'WIG-ST-002',
    price: naira(92000),
    compareAtPrice: naira(120000),
    stock: 0,
    texture: HairTexture.STRAIGHT,
    origin: 'Vietnamese',
    isFeatured: true,
    images: [img('straight-wig', 1), img('straight-wig', 2)],
    variants: lengthVariants('WIG-ST-002', [18, 20, 22, 24], naira(92000), naira(13000), {
      density: '180%',
      capSize: 'Medium',
    }),
  },
  {
    name: 'Deep Wave HD Lace Frontal Wig',
    category: 'human-hair-wigs',
    description:
      'Rich, defined deep waves on an invisible HD lace frontal that melts into any skin tone. Full and luxurious with a natural density.',
    shortDesc: 'Defined deep waves on invisible HD lace.',
    sku: 'WIG-DW-003',
    price: naira(98000),
    stock: 0,
    texture: HairTexture.DEEP_WAVE,
    origin: 'Peruvian',
    isBestSeller: true,
    images: [img('deepwave-wig', 1), img('deepwave-wig', 2)],
    variants: lengthVariants('WIG-DW-003', [16, 18, 20, 22], naira(98000), naira(12000), {
      density: '200%',
      capSize: 'Medium',
    }),
  },
  {
    name: 'Kinky Straight Glueless Wig',
    category: 'human-hair-wigs',
    description:
      'A natural kinky-straight texture that blends seamlessly with relaxed 4C hair. Beginner-friendly glueless cap with adjustable straps and combs.',
    shortDesc: 'Natural blend, beginner-friendly glueless cap.',
    sku: 'WIG-KS-004',
    price: naira(78000),
    stock: 0,
    texture: HairTexture.KINKY_STRAIGHT,
    origin: 'Brazilian',
    isNewArrival: true,
    images: [img('kinky-wig', 1), img('kinky-wig', 2)],
    variants: lengthVariants('WIG-KS-004', [14, 16, 18, 20], naira(78000), naira(11000), {
      density: '180%',
      capSize: 'Medium',
    }),
  },
  {
    name: 'Curly Bob Lace Wig',
    category: 'human-hair-wigs',
    description:
      'A chic, low-maintenance curly bob on a transparent lace closure. Playful volume with a flattering length for everyday glam.',
    shortDesc: 'Chic curly bob, transparent lace.',
    sku: 'WIG-CB-005',
    price: naira(65000),
    compareAtPrice: naira(80000),
    stock: 0,
    texture: HairTexture.CURLY,
    origin: 'Brazilian',
    images: [img('curlybob-wig', 1), img('curlybob-wig', 2)],
    variants: lengthVariants('WIG-CB-005', [10, 12, 14], naira(65000), naira(8000), {
      density: '180%',
      capSize: 'Small',
    }),
  },
  // ---------------- Bundles ----------------
  {
    name: 'Brazilian Body Wave Bundles',
    category: 'bundles',
    description:
      'Double-drawn Brazilian body wave bundles — thick from root to tip. Minimal shedding, soft luster and long-lasting waves. Sold per bundle.',
    shortDesc: 'Double-drawn, thick from root to tip.',
    sku: 'BDL-BW-101',
    price: naira(35000),
    compareAtPrice: naira(45000),
    stock: 0,
    texture: HairTexture.BODY_WAVE,
    origin: 'Brazilian',
    isBestSeller: true,
    isFeatured: true,
    images: [img('bw-bundle', 1), img('bw-bundle', 2)],
    variants: lengthVariants('BDL-BW-101', [12, 14, 16, 18, 20, 22, 24, 26], naira(35000), naira(6000)),
  },
  {
    name: 'Peruvian Deep Wave Bundles',
    category: 'bundles',
    description:
      'Luxurious Peruvian deep wave with springy, well-defined curls. Blends beautifully and dries with gorgeous natural pattern.',
    shortDesc: 'Springy, well-defined deep wave.',
    sku: 'BDL-DW-102',
    price: naira(38000),
    stock: 0,
    texture: HairTexture.DEEP_WAVE,
    origin: 'Peruvian',
    images: [img('dw-bundle', 1), img('dw-bundle', 2)],
    variants: lengthVariants('BDL-DW-102', [12, 14, 16, 18, 20, 22, 24], naira(38000), naira(6500)),
  },
  {
    name: 'Vietnamese Straight Bundles',
    category: 'bundles',
    description:
      'Raw Vietnamese straight hair — sleek, dense and full-bodied with an unmatched natural shine. A true premium staple.',
    shortDesc: 'Raw, sleek and full-bodied.',
    sku: 'BDL-ST-103',
    price: naira(42000),
    compareAtPrice: naira(52000),
    stock: 0,
    texture: HairTexture.STRAIGHT,
    origin: 'Vietnamese',
    isFeatured: true,
    images: [img('st-bundle', 1), img('st-bundle', 2)],
    variants: lengthVariants('BDL-ST-103', [14, 16, 18, 20, 22, 24, 26, 28], naira(42000), naira(7000)),
  },
  {
    name: 'Water Wave Bundle Deal (3 Bundles)',
    category: 'bundles',
    description:
      'A complete 3-bundle set of glossy water wave hair — everything you need for a full sew-in. Great value luxury.',
    shortDesc: 'Full 3-bundle set for a complete install.',
    sku: 'BDL-WW-104',
    price: naira(105000),
    compareAtPrice: naira(135000),
    stock: 0,
    texture: HairTexture.WATER_WAVE,
    origin: 'Brazilian',
    isNewArrival: true,
    images: [img('ww-bundle', 1), img('ww-bundle', 2)],
    variants: lengthVariants('BDL-WW-104', [16, 18, 20, 22], naira(105000), naira(15000)),
  },
  // ---------------- Closures ----------------
  {
    name: '5x5 HD Lace Closure — Body Wave',
    category: 'closures',
    description:
      'A generous 5x5 HD lace closure for a natural, versatile parting. Pre-plucked with baby hairs, melts seamlessly.',
    shortDesc: '5x5 HD lace, pre-plucked with baby hairs.',
    sku: 'CLS-BW-201',
    price: naira(28000),
    stock: 0,
    texture: HairTexture.BODY_WAVE,
    origin: 'Brazilian',
    images: [img('bw-closure', 1), img('bw-closure', 2)],
    variants: lengthVariants('CLS-BW-201', [12, 14, 16, 18], naira(28000), naira(3000)),
  },
  {
    name: '4x4 Straight Lace Closure',
    category: 'closures',
    description:
      'Classic 4x4 transparent lace closure in silky straight. Neat knots and a realistic scalp appearance.',
    shortDesc: '4x4 transparent lace, silky straight.',
    sku: 'CLS-ST-202',
    price: naira(24000),
    compareAtPrice: naira(30000),
    stock: 0,
    texture: HairTexture.STRAIGHT,
    origin: 'Vietnamese',
    images: [img('st-closure', 1), img('st-closure', 2)],
    variants: lengthVariants('CLS-ST-202', [12, 14, 16], naira(24000), naira(3000)),
  },
  // ---------------- Frontals ----------------
  {
    name: '13x4 HD Lace Frontal — Deep Wave',
    category: 'frontals',
    description:
      'Ear-to-ear 13x4 HD lace frontal in deep wave. Achieve a flawless hairline and unlimited parting freedom.',
    shortDesc: '13x4 HD lace, ear-to-ear coverage.',
    sku: 'FRT-DW-301',
    price: naira(45000),
    compareAtPrice: naira(58000),
    stock: 0,
    texture: HairTexture.DEEP_WAVE,
    origin: 'Peruvian',
    isFeatured: true,
    images: [img('dw-frontal', 1), img('dw-frontal', 2)],
    variants: lengthVariants('FRT-DW-301', [14, 16, 18, 20], naira(45000), naira(4500)),
  },
  {
    name: '13x6 Transparent Lace Frontal — Straight',
    category: 'frontals',
    description:
      'Deeper 13x6 transparent lace frontal for a wider, more natural part space. Silky straight and pre-plucked.',
    shortDesc: '13x6 transparent lace, deep parting.',
    sku: 'FRT-ST-302',
    price: naira(52000),
    stock: 0,
    texture: HairTexture.STRAIGHT,
    origin: 'Vietnamese',
    images: [img('st-frontal', 1), img('st-frontal', 2)],
    variants: lengthVariants('FRT-ST-302', [16, 18, 20, 22], naira(52000), naira(5000)),
  },
  // ---------------- Extensions ----------------
  {
    name: 'Clip-In Hair Extensions — Straight (7 pcs)',
    category: 'hair-extensions',
    description:
      'A 7-piece clip-in set of 100% human hair for instant length and volume. Secure clips, seamless blend, reusable.',
    shortDesc: '7-piece clip-in set, instant length.',
    sku: 'EXT-CL-401',
    price: naira(32000),
    compareAtPrice: naira(40000),
    stock: 0,
    texture: HairTexture.STRAIGHT,
    origin: 'Brazilian',
    isNewArrival: true,
    images: [img('clipin-ext', 1), img('clipin-ext', 2)],
    variants: [
      { sku: 'EXT-CL-401-16-NB', length: 16, color: 'Natural Black', stock: 20 },
      { sku: 'EXT-CL-401-18-NB', length: 18, color: 'Natural Black', priceOverride: naira(35000), stock: 18 },
      { sku: 'EXT-CL-401-18-BR', length: 18, color: 'Chestnut Brown', priceOverride: naira(35000), stock: 10 },
      { sku: 'EXT-CL-401-20-613', length: 20, color: 'Blonde 613', priceOverride: naira(39000), stock: 8 },
    ],
  },
  {
    name: 'Tape-In Extensions — Body Wave',
    category: 'hair-extensions',
    description:
      'Lightweight tape-in wefts with a gentle, seamless hold. Body wave texture for soft movement.',
    shortDesc: 'Seamless tape-in wefts, body wave.',
    sku: 'EXT-TP-402',
    price: naira(29000),
    stock: 0,
    texture: HairTexture.BODY_WAVE,
    origin: 'Brazilian',
    images: [img('tapein-ext', 1), img('tapein-ext', 2)],
    variants: [
      { sku: 'EXT-TP-402-16-NB', length: 16, color: 'Natural Black', stock: 25 },
      { sku: 'EXT-TP-402-18-NB', length: 18, color: 'Natural Black', priceOverride: naira(32000), stock: 20 },
    ],
  },
  {
    name: 'Ponytail Extension — Curly',
    category: 'hair-extensions',
    description:
      'Drawstring curly ponytail for a quick, glamorous updo. Wrap-around design that clips securely in seconds.',
    shortDesc: 'Drawstring curly ponytail, quick glam.',
    sku: 'EXT-PT-403',
    price: naira(18000),
    compareAtPrice: naira(24000),
    stock: 30,
    texture: HairTexture.CURLY,
    origin: 'Brazilian',
    images: [img('ponytail-ext', 1), img('ponytail-ext', 2)],
  },
  // ---------------- Hair Care ----------------
  {
    name: 'Sulfate-Free Hydrating Shampoo',
    category: 'hair-care',
    description:
      'A gentle, sulfate-free shampoo formulated to cleanse human hair extensions and wigs without stripping moisture. Keeps hair soft and extends longevity.',
    shortDesc: 'Gentle, sulfate-free, extends hair life.',
    sku: 'CARE-SH-501',
    price: naira(9500),
    stock: 60,
    images: [img('shampoo', 1)],
  },
  {
    name: 'Argan Oil Hair Serum',
    category: 'hair-care',
    description:
      'A lightweight argan oil serum that tames frizz and adds a luxurious shine to wigs, bundles and natural hair. Non-greasy finish.',
    shortDesc: 'Frizz-taming shine, non-greasy.',
    sku: 'CARE-SR-502',
    price: naira(12000),
    compareAtPrice: naira(15000),
    stock: 45,
    isNewArrival: true,
    images: [img('serum', 1)],
  },
  {
    name: 'Satin Wig Cap (2-Pack)',
    category: 'hair-care',
    description:
      'Breathable satin wig caps that protect your natural hair and create a smooth base for a flawless install. Pack of two.',
    shortDesc: 'Breathable satin base, pack of 2.',
    sku: 'CARE-CP-503',
    price: naira(3500),
    stock: 100,
    images: [img('wigcap', 1)],
  },
];

const shippingZones = [
  {
    name: 'Lagos',
    description: 'Within Lagos State',
    states: ['Lagos'],
    sortOrder: 1,
    rates: [
      { name: 'Standard (2–3 days)', price: naira(1500), minDeliveryDays: 2, maxDeliveryDays: 3, freeShippingThreshold: naira(150000) },
      { name: 'Express (Next day)', price: naira(3500), minDeliveryDays: 1, maxDeliveryDays: 1 },
    ],
  },
  {
    name: 'South-West',
    description: 'Ogun, Oyo, Osun, Ondo, Ekiti',
    states: ['Ogun', 'Oyo', 'Osun', 'Ondo', 'Ekiti'],
    sortOrder: 2,
    rates: [
      { name: 'Standard (3–5 days)', price: naira(2500), minDeliveryDays: 3, maxDeliveryDays: 5, freeShippingThreshold: naira(200000) },
      { name: 'Express (2 days)', price: naira(5000), minDeliveryDays: 2, maxDeliveryDays: 2 },
    ],
  },
  {
    name: 'Other Nigerian States',
    description: 'Nationwide delivery',
    states: [] as string[], // catch-all within Nigeria
    sortOrder: 3,
    rates: [
      { name: 'Standard (4–7 days)', price: naira(3500), minDeliveryDays: 4, maxDeliveryDays: 7 },
      { name: 'Express (2–3 days)', price: naira(7000), minDeliveryDays: 2, maxDeliveryDays: 3 },
    ],
  },
  {
    name: 'International',
    description: 'Outside Nigeria',
    country: 'International',
    states: [] as string[],
    sortOrder: 4,
    rates: [{ name: 'International (7–14 days)', price: naira(25000), minDeliveryDays: 7, maxDeliveryDays: 14 }],
  },
];

const coupons = [
  {
    code: 'WELCOME10',
    description: '10% off your first order (min ₦20,000)',
    type: CouponType.PERCENTAGE,
    value: 10,
    minOrderAmount: naira(20000),
    maxDiscount: naira(10000),
    usageLimit: 1000,
    perUserLimit: 1,
  },
  {
    code: 'SAVE5000',
    description: '₦5,000 off orders above ₦50,000',
    type: CouponType.FIXED,
    value: naira(5000),
    minOrderAmount: naira(50000),
    usageLimit: 500,
    perUserLimit: 3,
  },
];

async function main() {
  console.log('🌱 Seeding BufaHairs...');

  // --- Users ---
  const adminHash = await bcrypt.hash('Admin123!', 12);
  const custHash = await bcrypt.hash('Password123', 12);

  await prisma.user.upsert({
    where: { email: 'admin@bufahairs.com' },
    update: {},
    create: {
      email: 'admin@bufahairs.com',
      passwordHash: adminHash,
      fullName: 'Bufa Admin',
      role: 'ADMIN',
      emailVerified: true,
      cart: { create: {} },
      wishlist: { create: {} },
    },
  });

  await prisma.user.upsert({
    where: { email: 'customer@bufahairs.com' },
    update: {},
    create: {
      email: 'customer@bufahairs.com',
      passwordHash: custHash,
      fullName: 'Chidera Nwosu',
      phone: '+2348030000000',
      emailVerified: true,
      cart: { create: {} },
      wishlist: { create: {} },
    },
  });
  console.log('✅ Users seeded (admin@bufahairs.com / Admin123!, customer@bufahairs.com / Password123)');

  // --- Categories ---
  const categoryMap = new Map<string, string>();
  for (const c of categories) {
    const cat = await prisma.category.upsert({
      where: { slug: c.slug },
      update: { name: c.name, description: c.description, sortOrder: c.sortOrder },
      create: { name: c.name, slug: c.slug, description: c.description, sortOrder: c.sortOrder, imageUrl: img(`cat-${c.slug}`) },
    });
    categoryMap.set(c.slug, cat.id);
  }
  console.log(`✅ ${categories.length} categories seeded`);

  // --- Products (idempotent via slug upsert; images/variants replaced) ---
  for (const p of products) {
    const slug = p.name
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-');
    const categoryId = categoryMap.get(p.category)!;
    const totalVariantStock = p.variants?.reduce((s, v) => s + v.stock, 0) ?? p.stock;

    const imageData = p.images.map((url, i) => ({
      url,
      altText: p.name,
      isPrimary: i === 0,
      sortOrder: i,
    }));

    await prisma.product.upsert({
      where: { slug },
      update: {
        name: p.name,
        description: p.description,
        shortDesc: p.shortDesc,
        price: p.price,
        compareAtPrice: p.compareAtPrice ?? null,
        stock: p.variants ? totalVariantStock : p.stock,
        texture: p.texture ?? null,
        origin: p.origin ?? null,
        categoryId,
        isFeatured: !!p.isFeatured,
        isBestSeller: !!p.isBestSeller,
        isNewArrival: !!p.isNewArrival,
        metaTitle: `${p.name} | BufaHairs`,
        variants: p.variants ? { deleteMany: {}, create: p.variants } : { deleteMany: {} },
      },
      create: {
        name: p.name,
        slug,
        sku: p.sku,
        description: p.description,
        shortDesc: p.shortDesc,
        price: p.price,
        compareAtPrice: p.compareAtPrice ?? null,
        stock: p.variants ? totalVariantStock : p.stock,
        texture: p.texture ?? null,
        origin: p.origin ?? null,
        categoryId,
        isFeatured: !!p.isFeatured,
        isBestSeller: !!p.isBestSeller,
        isNewArrival: !!p.isNewArrival,
        metaTitle: `${p.name} | BufaHairs`,
        metaDescription: p.shortDesc,
        images: { create: imageData },
        variants: p.variants ? { create: p.variants } : undefined,
      },
    });
  }
  console.log(`✅ ${products.length} products seeded`);

  // --- Shipping zones (config — replace) ---
  await prisma.shippingRate.deleteMany({});
  await prisma.shippingZone.deleteMany({});
  for (const z of shippingZones) {
    await prisma.shippingZone.create({
      data: {
        name: z.name,
        description: z.description,
        country: z.country ?? 'Nigeria',
        states: z.states,
        sortOrder: z.sortOrder,
        rates: { create: z.rates },
      },
    });
  }
  console.log(`✅ ${shippingZones.length} shipping zones seeded`);

  // --- Coupons ---
  for (const c of coupons) {
    await prisma.coupon.upsert({
      where: { code: c.code },
      update: { ...c },
      create: { ...c },
    });
  }
  console.log(`✅ ${coupons.length} coupons seeded (WELCOME10, SAVE5000)`);

  console.log('🎉 Seed complete.');
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
