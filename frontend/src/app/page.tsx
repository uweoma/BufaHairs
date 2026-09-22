import Link from 'next/link';
import Image from 'next/image';
import { ArrowRight, Truck, ShieldCheck, Sparkles, Headphones } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ProductGrid } from '@/components/product/product-grid';
import { fetchProducts, fetchCategories, type ProductFilters } from '@/lib/catalog';
import type { ProductCard } from '@/lib/types';

// Product data is time-sensitive; revalidate periodically rather than baking in at build.
export const revalidate = 120;

async function safeProducts(filters: ProductFilters): Promise<ProductCard[]> {
  try {
    const res = await fetchProducts(filters);
    return res.data ?? [];
  } catch {
    return [];
  }
}

function SectionHeading({
  eyebrow,
  title,
  href,
  linkLabel = 'View all',
}: {
  eyebrow?: string;
  title: string;
  href?: string;
  linkLabel?: string;
}) {
  return (
    <div className="mb-8 flex items-end justify-between gap-4">
      <div>
        {eyebrow && (
          <span className="text-xs font-semibold uppercase tracking-widest text-primary">{eyebrow}</span>
        )}
        <h2 className="mt-1 font-serif text-2xl font-semibold sm:text-3xl">{title}</h2>
      </div>
      {href && (
        <Link
          href={href}
          className="group flex shrink-0 items-center gap-1 text-sm font-medium text-primary hover:underline"
        >
          {linkLabel}
          <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
        </Link>
      )}
    </div>
  );
}

const BENEFITS = [
  { icon: Truck, title: 'Free Express Shipping', desc: 'On orders over ₦150,000' },
  { icon: Sparkles, title: '100% Human Hair', desc: 'Ethically sourced, premium grade' },
  { icon: ShieldCheck, title: 'Secure Checkout', desc: 'Paystack-protected payments' },
  { icon: Headphones, title: 'Concierge Support', desc: 'WhatsApp us anytime' },
];

export default async function HomePage() {
  const [featured, bestSellers, newArrivals, categories] = await Promise.all([
    safeProducts({ featured: true, limit: 8 }),
    safeProducts({ bestSeller: true, limit: 4 }),
    safeProducts({ newArrival: true, limit: 4 }),
    fetchCategories().catch(() => []),
  ]);

  return (
    <>
      {/* Hero */}
      <section className="relative overflow-hidden bg-luxe text-white">
        <div className="container relative z-10 grid gap-10 py-20 lg:grid-cols-2 lg:py-28">
          <div className="flex flex-col justify-center">
            <span className="mb-4 inline-flex w-fit items-center gap-2 rounded-full bg-white/10 px-4 py-1.5 text-xs font-medium backdrop-blur">
              <Sparkles className="h-3.5 w-3.5 text-gold" /> New season, new crown
            </span>
            <h1 className="font-serif text-4xl font-bold leading-[1.1] sm:text-5xl lg:text-6xl">
              Luxury hair,<br />crowned for you.
            </h1>
            <p className="mt-5 max-w-md text-base text-white/80 sm:text-lg">
              Discover premium 100% human hair wigs, bundles and closures — meticulously crafted and
              delivered across Nigeria and worldwide.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Button asChild size="lg" variant="secondary">
                <Link href="/shop">
                  Shop the Collection <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
              <Button asChild size="lg" variant="outline" className="border-white/30 bg-transparent text-white hover:bg-white/10 hover:text-white">
                <Link href="/shop?sort=bestselling">Best Sellers</Link>
              </Button>
            </div>
          </div>

          <div className="relative hidden lg:block">
            <div className="relative ml-auto aspect-[4/5] w-full max-w-md overflow-hidden rounded-3xl bg-white/10 shadow-2xl ring-1 ring-white/20">
              <Image
                src="/hero-model.jpg"
                alt="Model with voluminous, premium natural hair"
                fill
                priority
                sizes="(max-width: 1024px) 0px, 400px"
                className="object-cover"
              />
            </div>
          </div>
        </div>
        <div className="pointer-events-none absolute -right-24 -top-24 h-96 w-96 rounded-full bg-primary-royal/40 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-32 left-1/3 h-96 w-96 rounded-full bg-gold/20 blur-3xl" />
      </section>

      {/* Benefits */}
      <section className="border-b bg-primary-light/40">
        <div className="container grid grid-cols-2 gap-6 py-8 lg:grid-cols-4">
          {BENEFITS.map((b) => (
            <div key={b.title} className="flex items-center gap-3">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary-deep">
                <b.icon className="h-5 w-5" />
              </div>
              <div>
                <p className="text-sm font-semibold leading-tight">{b.title}</p>
                <p className="text-xs text-muted-foreground">{b.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Categories */}
      {categories.length > 0 && (
        <section className="container py-16">
          <SectionHeading eyebrow="Browse" title="Shop by Category" href="/shop" linkLabel="All products" />
          <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
            {categories.slice(0, 4).map((cat) => (
              <Link
                key={cat.id}
                href={`/shop?category=${cat.slug}`}
                className="group relative flex aspect-[4/3] items-end overflow-hidden rounded-2xl bg-gradient-to-br from-primary-deep to-primary-royal p-5 text-white"
              >
                {cat.imageUrl && (
                  <Image
                    src={cat.imageUrl}
                    alt={cat.name}
                    fill
                    sizes="(max-width: 768px) 50vw, 25vw"
                    className="object-cover opacity-70 transition-transform duration-500 group-hover:scale-105"
                  />
                )}
                <div className="relative z-10">
                  <h3 className="font-serif text-lg font-semibold">{cat.name}</h3>
                  <span className="text-xs text-white/80">{cat.productCount} products</span>
                </div>
                <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* Featured */}
      {featured.length > 0 && (
        <section className="container py-16">
          <SectionHeading eyebrow="Handpicked" title="Featured Favourites" href="/shop" />
          <ProductGrid products={featured} />
        </section>
      )}

      {/* Best sellers */}
      {bestSellers.length > 0 && (
        <section className="bg-secondary/40 py-16">
          <div className="container">
            <SectionHeading eyebrow="Loved by many" title="Best Sellers" href="/shop?sort=bestselling" />
            <ProductGrid products={bestSellers} />
          </div>
        </section>
      )}

      {/* New arrivals */}
      {newArrivals.length > 0 && (
        <section className="container py-16">
          <SectionHeading eyebrow="Fresh in" title="New Arrivals" href="/shop?sort=newest" />
          <ProductGrid products={newArrivals} />
        </section>
      )}

      {/* Brand promise band */}
      <section className="bg-luxe text-white">
        <div className="container flex flex-col items-center gap-6 py-16 text-center">
          <Sparkles className="h-8 w-8 text-gold" />
          <h2 className="max-w-2xl font-serif text-3xl font-semibold">
            Every strand tells a story of confidence, artistry and grace.
          </h2>
          <p className="max-w-xl text-white/70">
            From our atelier to your crown — experience hair that moves, shines and lasts.
          </p>
          <Button asChild size="lg" variant="secondary">
            <Link href="/shop">
              Find Your Look <ArrowRight className="h-4 w-4" />
            </Link>
          </Button>
        </div>
      </section>
    </>
  );
}
