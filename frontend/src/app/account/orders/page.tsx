import type { Metadata } from 'next';
import { OrdersList } from '@/components/account/orders-list';

export const metadata: Metadata = {
  title: 'Your Orders',
  robots: { index: false, follow: false },
};

export default function OrdersPage() {
  return <OrdersList />;
}
