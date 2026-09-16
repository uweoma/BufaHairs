import type { MetadataRoute } from 'next';
import { BRAND_NAME, BRAND_TAGLINE } from '@/lib/constants';

/** PWA / installability manifest, themed to the BufaHairs purple palette. */
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: BRAND_NAME,
    short_name: BRAND_NAME,
    description: BRAND_TAGLINE,
    start_url: '/',
    display: 'standalone',
    background_color: '#FAFAFA',
    theme_color: '#5B21B6',
    icons: [
      { src: '/icon-192.png', sizes: '192x192', type: 'image/png' },
      { src: '/icon-512.png', sizes: '512x512', type: 'image/png' },
      { src: '/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
    ],
  };
}
