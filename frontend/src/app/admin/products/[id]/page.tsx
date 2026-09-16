import type { Metadata } from 'next';
import { EditProduct } from '@/components/admin/edit-product';

export const metadata: Metadata = { title: 'Edit Product' };

interface Props {
  params: { id: string };
}

export default function EditProductPage({ params }: Props) {
  return <EditProduct id={params.id} />;
}
