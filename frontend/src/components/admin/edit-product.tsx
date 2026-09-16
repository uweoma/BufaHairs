'use client';

import Link from 'next/link';
import { Package } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { EmptyState } from '@/components/ui/empty-state';
import { ProductForm } from './product-form';
import { useAdminProduct } from '@/hooks/use-admin';

export function EditProduct({ id }: { id: string }) {
  const { data: product, isLoading, isError } = useAdminProduct(id);

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-9 w-48" />
        <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
          <Skeleton className="h-96 rounded-2xl" />
          <Skeleton className="h-96 rounded-2xl" />
        </div>
      </div>
    );
  }

  if (isError || !product) {
    return (
      <EmptyState
        icon={Package}
        title="Product not found"
        description="This product could not be loaded."
        action={
          <Button asChild>
            <Link href="/admin/products">Back to products</Link>
          </Button>
        }
      />
    );
  }

  return <ProductForm product={product} />;
}
