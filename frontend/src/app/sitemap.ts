import type { MetadataRoute } from 'next';
import { SITE_URL } from '@/lib/constants';
import { fetchCategories, fetchProducts } from '@/lib/catalog';

/**
 * Dynamic sitemap. Static marketing/catalog routes are always included;
 * product and category URLs are pulled from the API. Data fetches are
 * defensive so a transient API outage still yields a valid sitemap.
 */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date();

  const staticRoutes: MetadataRoute.Sitemap = [
    { url: `${SITE_URL}/`, lastModified: now, changeFrequency: 'daily', priority: 1 },
    { url: `${SITE_URL}/shop`, lastModified: now, changeFrequency: 'daily', priority: 0.9 },
    { url: `${SITE_URL}/login`, lastModified: now, changeFrequency: 'yearly', priority: 0.3 },
    { url: `${SITE_URL}/register`, lastModified: now, changeFrequency: 'yearly', priority: 0.3 },
  ];

  const [products, categories] = await Promise.all([
    fetchProducts({ limit: 100, sort: 'newest' }).then((res) => res.data).catch(() => []),
    fetchCategories(),
  ]);

  const productRoutes: MetadataRoute.Sitemap = products.map((p) => ({
    url: `${SITE_URL}/products/${p.slug}`,
    lastModified: now,
    changeFrequency: 'weekly',
    priority: 0.8,
  }));

  const categoryRoutes: MetadataRoute.Sitemap = categories.map((c) => ({
    url: `${SITE_URL}/shop?category=${c.slug}`,
    lastModified: now,
    changeFrequency: 'weekly',
    priority: 0.7,
  }));

  return [...staticRoutes, ...productRoutes, ...categoryRoutes];
}
