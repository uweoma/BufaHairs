'use client';

import { useMemo, useState } from 'react';
import { useRouter, useSearchParams, usePathname } from 'next/navigation';
import { SlidersHorizontal, X, PackageSearch } from 'lucide-react';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/ui/empty-state';
import { ProductGrid } from '@/components/product/product-grid';
import { ProductGridSkeleton } from '@/components/product/product-card-skeleton';
import { Pagination } from '@/components/ui/pagination';
import { ShopFilters, type ShopFilterValues } from './shop-filters';
import { useProducts, type ProductFilters } from '@/hooks/use-catalog';
import { useCategories } from '@/hooks/use-catalog';
import { SORT_OPTIONS, HAIR_TEXTURES } from '@/lib/constants';
import { formatNaira, nairaToKobo } from '@/lib/utils';

const PAGE_SIZE = 12;

export function ShopClient() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [filtersOpen, setFiltersOpen] = useState(false);

  const { data: categories = [] } = useCategories();

  // URL is the source of truth for all filters.
  const params = useMemo(() => {
    const get = (k: string) => searchParams.get(k) ?? undefined;
    return {
      q: get('q'),
      category: get('category'),
      texture: get('texture'),
      sort: get('sort'),
      minPrice: get('minPrice'),
      maxPrice: get('maxPrice'),
      minLength: get('minLength'),
      maxLength: get('maxLength'),
      inStock: get('inStock'),
      page: get('page'),
    };
  }, [searchParams]);

  const apiFilters: ProductFilters = useMemo(
    () => ({
      q: params.q,
      category: params.category,
      texture: params.texture,
      sort: params.sort,
      // URL prices are in Naira for readability; the API expects kobo.
      minPrice: params.minPrice ? nairaToKobo(Number(params.minPrice)) : undefined,
      maxPrice: params.maxPrice ? nairaToKobo(Number(params.maxPrice)) : undefined,
      minLength: params.minLength ? Number(params.minLength) : undefined,
      maxLength: params.maxLength ? Number(params.maxLength) : undefined,
      inStock: params.inStock === 'true' ? true : undefined,
      page: params.page ? Number(params.page) : 1,
      limit: PAGE_SIZE,
    }),
    [params],
  );

  const { data, isLoading, isError, isFetching } = useProducts(apiFilters);
  const products = data?.data ?? [];
  const meta = data?.meta;

  const updateParams = (patch: Record<string, string | undefined>, resetPage = true) => {
    const next = new URLSearchParams(searchParams.toString());
    for (const [key, value] of Object.entries(patch)) {
      if (value === undefined || value === '') next.delete(key);
      else next.set(key, value);
    }
    if (resetPage && !('page' in patch)) next.delete('page');
    router.push(`${pathname}?${next.toString()}`, { scroll: false });
  };

  const clearAll = () => router.push(pathname, { scroll: false });

  const filterValues: ShopFilterValues = {
    category: params.category,
    texture: params.texture,
    minPrice: params.minPrice,
    maxPrice: params.maxPrice,
    minLength: params.minLength,
    maxLength: params.maxLength,
    inStock: params.inStock,
  };

  // Active filter chips.
  const chips: { label: string; onRemove: () => void }[] = [];
  if (params.q) chips.push({ label: `“${params.q}”`, onRemove: () => updateParams({ q: undefined }) });
  if (params.category) {
    const cat = categories.find((c) => c.slug === params.category);
    chips.push({ label: cat?.name ?? params.category, onRemove: () => updateParams({ category: undefined }) });
  }
  if (params.texture) {
    const t = HAIR_TEXTURES.find((x) => x.value === params.texture);
    chips.push({ label: t?.label ?? params.texture, onRemove: () => updateParams({ texture: undefined }) });
  }
  if (params.minPrice || params.maxPrice) {
    const min = params.minPrice ? formatNaira(nairaToKobo(Number(params.minPrice))) : '₦0';
    const max = params.maxPrice ? formatNaira(nairaToKobo(Number(params.maxPrice))) : '∞';
    chips.push({ label: `${min} – ${max}`, onRemove: () => updateParams({ minPrice: undefined, maxPrice: undefined }) });
  }
  if (params.minLength && params.minLength === params.maxLength) {
    chips.push({ label: `${params.minLength}"`, onRemove: () => updateParams({ minLength: undefined, maxLength: undefined }) });
  }
  if (params.inStock === 'true') {
    chips.push({ label: 'In stock', onRemove: () => updateParams({ inStock: undefined }) });
  }

  const heading = params.q ? `Results for “${params.q}”` : 'Shop All';

  return (
    <div className="container py-8 lg:py-12">
      <div className="mb-6">
        <h1 className="font-serif text-3xl font-semibold sm:text-4xl">{heading}</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {meta ? `${meta.total} product${meta.total === 1 ? '' : 's'}` : 'Browse the collection'}
        </p>
      </div>

      {/* Toolbar */}
      <div className="mb-6 flex items-center justify-between gap-3">
        <Sheet open={filtersOpen} onOpenChange={setFiltersOpen}>
          <SheetTrigger asChild>
            <Button variant="outline" className="lg:hidden">
              <SlidersHorizontal className="h-4 w-4" /> Filters
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="w-full overflow-y-auto p-6 sm:max-w-sm">
            <ShopFilters
              values={filterValues}
              categories={categories}
              onChange={(patch) => updateParams(patch)}
              onClear={clearAll}
            />
          </SheetContent>
        </Sheet>

        <div className="ml-auto flex items-center gap-2">
          <span className="hidden text-sm text-muted-foreground sm:inline">Sort by</span>
          <Select
            value={params.sort ?? 'featured'}
            onValueChange={(v) => updateParams({ sort: v === 'featured' ? undefined : v })}
          >
            <SelectTrigger className="h-10 w-[190px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {SORT_OPTIONS.map((o) => (
                <SelectItem key={o.value} value={o.value}>
                  {o.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Active chips */}
      {chips.length > 0 && (
        <div className="mb-6 flex flex-wrap items-center gap-2">
          {chips.map((chip, i) => (
            <button
              key={i}
              onClick={chip.onRemove}
              className="inline-flex items-center gap-1 rounded-full bg-secondary px-3 py-1 text-xs font-medium text-secondary-foreground transition-colors hover:bg-secondary/70"
            >
              {chip.label}
              <X className="h-3 w-3" />
            </button>
          ))}
          <button onClick={clearAll} className="text-xs text-primary hover:underline">
            Clear all
          </button>
        </div>
      )}

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-[240px_1fr]">
        {/* Desktop sidebar */}
        <aside className="hidden lg:block">
          <div className="sticky top-28">
            <ShopFilters
              values={filterValues}
              categories={categories}
              onChange={(patch) => updateParams(patch)}
              onClear={clearAll}
            />
          </div>
        </aside>

        {/* Results */}
        <div>
          {isLoading ? (
            <ProductGridSkeleton count={9} />
          ) : isError ? (
            <EmptyState
              icon={PackageSearch}
              title="Couldn’t load products"
              description="Something went wrong while fetching the collection. Please try again."
              action={<Button onClick={() => router.refresh()}>Retry</Button>}
            />
          ) : products.length === 0 ? (
            <EmptyState
              icon={PackageSearch}
              title="No products found"
              description="Try adjusting your filters or search to find what you’re looking for."
              action={<Button onClick={clearAll}>Clear filters</Button>}
            />
          ) : (
            <div className={isFetching ? 'opacity-60 transition-opacity' : 'transition-opacity'}>
              <ProductGrid products={products} />
            </div>
          )}

          {meta && meta.totalPages > 1 && (
            <div className="mt-10">
              <Pagination
                meta={meta}
                onPageChange={(page) => updateParams({ page: String(page) }, false)}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
