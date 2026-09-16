import type { Metadata } from 'next';
import { AdminCustomers } from '@/components/admin/admin-customers';

export const metadata: Metadata = { title: 'Customers' };

export default function AdminCustomersPage() {
  return <AdminCustomers />;
}
