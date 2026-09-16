import type { Metadata } from 'next';
import { AdminCustomerDetail } from '@/components/admin/admin-customer-detail';

export const metadata: Metadata = { title: 'Customer' };

interface Props {
  params: { id: string };
}

export default function AdminCustomerPage({ params }: Props) {
  return <AdminCustomerDetail id={params.id} />;
}
