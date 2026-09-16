import type { Metadata } from 'next';
import { AdminOrderDetail } from '@/components/admin/admin-order-detail';

export const metadata: Metadata = { title: 'Order' };

interface Props {
  params: { orderNumber: string };
}

export default function AdminOrderPage({ params }: Props) {
  return <AdminOrderDetail orderNumber={params.orderNumber} />;
}
