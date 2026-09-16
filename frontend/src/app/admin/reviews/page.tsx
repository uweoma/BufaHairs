import type { Metadata } from 'next';
import { AdminReviews } from '@/components/admin/admin-reviews';

export const metadata: Metadata = { title: 'Reviews' };

export default function AdminReviewsPage() {
  return <AdminReviews />;
}
