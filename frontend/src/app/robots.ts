import type { MetadataRoute } from 'next';
import { SITE_URL } from '@/lib/constants';

/**
 * Robots policy. Public catalog is crawlable; account, admin, checkout and
 * transactional routes are kept out of the index.
 */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: ['/admin', '/account', '/checkout', '/cart', '/wishlist', '/api'],
    },
    sitemap: `${SITE_URL}/sitemap.xml`,
    host: SITE_URL,
  };
}
