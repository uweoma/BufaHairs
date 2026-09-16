import type { Metadata } from 'next';
import { OrderDetail } from '@/components/account/order-detail';

export const metadata: Metadata = {
  title: 'Order Details',
  robots: { index: false, follow: false },
};

interface Props {
  params: { orderNumber: string };
}

export default function OrderDetailPage({ params }: Props) {
  return <OrderDetail orderNumber={params.orderNumber} />;
}
