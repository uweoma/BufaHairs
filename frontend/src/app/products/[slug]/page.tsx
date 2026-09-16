import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ChevronRight } from 'lucide-react';
import { fetchProduct } from '@/lib/catalog';
import { ProductDetailView } from '@/components/product/product-detail';
import { ProductReviews } from '@/components/product/product-reviews';
import { RelatedProducts } from '@/components/product/related-products';
import {
  Accordion,
  AccordionItem,
  AccordionTrigger,
  AccordionContent,
} from '@/components/ui/accordion';
import { BRAND_NAME, SITE_URL } from '@/lib/constants';

export const revalidate = 120;

interface Props {
  params: { slug: string };
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const product = await fetchProduct(params.slug);
  if (!product) {
    return { title: 'Product not found' };
  }
  const title = product.metaTitle || product.name;
  const description =
    product.metaDescription || product.shortDesc || `Shop ${product.name} at ${BRAND_NAME}.`;
  const image = product.images.find((i) => i.isPrimary)?.url ?? product.images[0]?.url;

  return {
    title,
    description,
    alternates: { canonical: `/products/${product.slug}` },
    openGraph: {
      type: 'website',
      title,
      description,
      url: `${SITE_URL}/products/${product.slug}`,
      images: image ? [{ url: image, alt: product.name }] : undefined,
    },
  };
}

export default async function ProductPage({ params }: Props) {
  const product = await fetchProduct(params.slug);
  if (!product) notFound();

  const image = product.images.find((i) => i.isPrimary)?.url ?? product.images[0]?.url;

  // Product structured data for rich results.
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: product.name,
    description: product.shortDesc || product.description,
    sku: product.sku,
    image: image ? [image] : undefined,
    brand: { '@type': 'Brand', name: BRAND_NAME },
    offers: {
      '@type': 'Offer',
      priceCurrency: 'NGN',
      price: (product.price / 100).toFixed(2),
      availability: product.inStock
        ? 'https://schema.org/InStock'
        : 'https://schema.org/OutOfStock',
      url: `${SITE_URL}/products/${product.slug}`,
    },
    ...(product.ratingCount > 0
      ? {
          aggregateRating: {
            '@type': 'AggregateRating',
            ratingValue: product.ratingAvg.toFixed(1),
            reviewCount: product.ratingCount,
          },
        }
      : {}),
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />

      <div className="container py-6 lg:py-10">
        {/* Breadcrumb */}
        <nav className="mb-6 flex items-center gap-1.5 text-sm text-muted-foreground" aria-label="Breadcrumb">
          <Link href="/" className="hover:text-foreground">Home</Link>
          <ChevronRight className="h-3.5 w-3.5" />
          <Link href="/shop" className="hover:text-foreground">Shop</Link>
          {product.category && (
            <>
              <ChevronRight className="h-3.5 w-3.5" />
              <Link href={`/shop?category=${product.category.slug}`} className="hover:text-foreground">
                {product.category.name}
              </Link>
            </>
          )}
          <ChevronRight className="h-3.5 w-3.5" />
          <span className="truncate text-foreground">{product.name}</span>
        </nav>

        <ProductDetailView product={product} />

        {/* Details */}
        <div className="mt-14 max-w-3xl">
          <Accordion type="single" collapsible defaultValue="description">
            <AccordionItem value="description">
              <AccordionTrigger className="text-base">Description</AccordionTrigger>
              <AccordionContent>
                <div className="whitespace-pre-line leading-relaxed">{product.description}</div>
              </AccordionContent>
            </AccordionItem>
            <AccordionItem value="shipping">
              <AccordionTrigger className="text-base">Shipping &amp; Delivery</AccordionTrigger>
              <AccordionContent>
                <p>
                  We ship nationwide across Nigeria and worldwide. Orders are processed within 1–2
                  business days. Free express shipping on orders over ₦150,000. Delivery timelines and
                  fees are calculated at checkout based on your location.
                </p>
              </AccordionContent>
            </AccordionItem>
            <AccordionItem value="care">
              <AccordionTrigger className="text-base">Hair Care</AccordionTrigger>
              <AccordionContent>
                <p>
                  Wash with sulfate-free shampoo, condition regularly, and store on a wig stand. Use
                  heat protectant before styling to keep your {BRAND_NAME} hair lasting longer and
                  looking flawless.
                </p>
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </div>
      </div>

      <ProductReviews slug={product.slug} />
      <RelatedProducts slug={product.slug} />
    </>
  );
}
