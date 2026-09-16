'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Search, Package, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Skeleton } from '@/components/ui/skeleton';
import { EmptyState } from '@/components/ui/empty-state';
import { Pagination } from '@/components/ui/pagination';
import { useAdminProducts } from '@/hooks/use-admin';
import { formatNaira, cn } from '@/lib/utils';

export function AdminProducts() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [q, setQ] = useState('');
  const [includeDeleted, setIncludeDeleted] = useState(false);

  const query = useAdminProducts({ page, q: q || undefined, includeDeleted });
  const products = query.data?.products ?? [];
  const meta = query.data?.meta;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="font-serif text-3xl font-semibold">Products</h1>
        <Button asChild>
          <Link href="/admin/products/new">
            <Plus className="h-4 w-4" /> Add product
          </Link>
        </Button>
      </div>

      <div className="flex flex-wrap items-center gap-4">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            setQ(search.trim());
            setPage(1);
          }}
          className="relative max-w-md flex-1"
        >
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search products"
            className="pl-9"
          />
        </form>
        <label className="flex cursor-pointer items-center gap-2 text-sm">
          <Checkbox
            checked={includeDeleted}
            onCheckedChange={(v) => {
              setIncludeDeleted(v === true);
              setPage(1);
            }}
          />
          Show archived
        </label>
      </div>

      {query.isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-16 rounded-xl" />
          ))}
        </div>
      ) : products.length === 0 ? (
        <EmptyState
          icon={Package}
          title="No products found"
          description="Add your first product to start selling."
          action={
            <Button asChild>
              <Link href="/admin/products/new">
                <Plus className="h-4 w-4" /> Add product
              </Link>
            </Button>
          }
        />
      ) : (
        <>
          <div className="overflow-hidden rounded-2xl border">
            <table className="w-full text-sm">
              <thead className="bg-secondary/50 text-left text-xs uppercase tracking-wide text-muted-foreground">
                <tr>
                  <th className="px-4 py-3 font-medium">Product</th>
                  <th className="px-4 py-3 font-medium">Category</th>
                  <th className="px-4 py-3 font-medium">Price</th>
                  <th className="px-4 py-3 font-medium">Stock</th>
                  <th className="px-4 py-3 font-medium">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {products.map((product) => {
                  const image = product.images.find((i) => i.isPrimary) ?? product.images[0];
                  const archived = !product.isActive || product.deletedAt != null;
                  return (
                    <tr key={product.id} className="transition-colors hover:bg-secondary/30">
                      <td className="px-4 py-3">
                        <Link href={`/admin/products/${product.id}`} className="flex items-center gap-3">
                          <div className="relative h-11 w-9 shrink-0 overflow-hidden rounded-md bg-secondary">
                            {image ? (
                              <Image src={image.url} alt={product.name} fill className="object-cover" sizes="36px" />
                            ) : null}
                          </div>
                          <div className="min-w-0">
                            <p className="truncate font-medium text-primary">{product.name}</p>
                            <p className="text-xs text-muted-foreground">{product.sku}</p>
                          </div>
                        </Link>
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">{product.category?.name ?? '—'}</td>
                      <td className="px-4 py-3 font-medium">{formatNaira(product.price)}</td>
                      <td className="px-4 py-3">
                        <span className={cn(product.stock <= product.lowStockAt && 'text-amber-600 font-medium')}>
                          {product.stock}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={cn(
                            'inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium',
                            archived ? 'bg-muted text-muted-foreground' : 'bg-emerald-100 text-emerald-700',
                          )}
                        >
                          {product.deletedAt ? 'Archived' : product.isActive ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          {meta && <Pagination meta={meta} onPageChange={setPage} />}
        </>
      )}
    </div>
  );
}
