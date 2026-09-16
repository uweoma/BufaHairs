'use client';

import { useState } from 'react';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { HAIR_TEXTURES, LENGTH_OPTIONS } from '@/lib/constants';
import { cn } from '@/lib/utils';
import type { Category } from '@/lib/types';

export interface ShopFilterValues {
  category?: string;
  texture?: string;
  minPrice?: string;
  maxPrice?: string;
  minLength?: string;
  maxLength?: string;
  inStock?: string;
}

interface ShopFiltersProps {
  values: ShopFilterValues;
  categories: Category[];
  onChange: (patch: Record<string, string | undefined>) => void;
  onClear: () => void;
}

function FilterSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="py-5">
      <h3 className="mb-3 text-sm font-semibold uppercase tracking-wide text-foreground">{title}</h3>
      {children}
    </div>
  );
}

export function ShopFilters({ values, categories, onChange, onClear }: ShopFiltersProps) {
  const [minPrice, setMinPrice] = useState(values.minPrice ?? '');
  const [maxPrice, setMaxPrice] = useState(values.maxPrice ?? '');

  const toggle = (key: keyof ShopFilterValues, value: string) => {
    onChange({ [key]: values[key] === value ? undefined : value });
  };

  const applyPrice = () => {
    onChange({
      minPrice: minPrice.trim() || undefined,
      maxPrice: maxPrice.trim() || undefined,
    });
  };

  const hasFilters =
    values.category ||
    values.texture ||
    values.minPrice ||
    values.maxPrice ||
    values.minLength ||
    values.maxLength ||
    values.inStock;

  return (
    <div className="divide-y">
      <div className="flex items-center justify-between pb-1">
        <span className="font-serif text-lg font-semibold">Filters</span>
        {hasFilters && (
          <button onClick={onClear} className="text-xs text-primary hover:underline">
            Clear all
          </button>
        )}
      </div>

      {categories.length > 0 && (
        <FilterSection title="Category">
          <ul className="space-y-1">
            {categories.map((cat) => (
              <li key={cat.id}>
                <button
                  onClick={() => toggle('category', cat.slug)}
                  className={cn(
                    'flex w-full items-center justify-between rounded-lg px-2 py-1.5 text-sm transition-colors hover:bg-accent',
                    values.category === cat.slug && 'bg-primary/10 font-medium text-primary-deep',
                  )}
                >
                  <span>{cat.name}</span>
                  <span className="text-xs text-muted-foreground">{cat.productCount}</span>
                </button>
              </li>
            ))}
          </ul>
        </FilterSection>
      )}

      <FilterSection title="Price (₦)">
        <div className="flex items-center gap-2">
          <Input
            type="number"
            min={0}
            inputMode="numeric"
            placeholder="Min"
            value={minPrice}
            onChange={(e) => setMinPrice(e.target.value)}
            className="h-10"
          />
          <span className="text-muted-foreground">–</span>
          <Input
            type="number"
            min={0}
            inputMode="numeric"
            placeholder="Max"
            value={maxPrice}
            onChange={(e) => setMaxPrice(e.target.value)}
            className="h-10"
          />
        </div>
        <Button variant="outline" size="sm" className="mt-3 w-full" onClick={applyPrice}>
          Apply
        </Button>
      </FilterSection>

      <FilterSection title="Texture">
        <div className="flex flex-wrap gap-2">
          {HAIR_TEXTURES.map((t) => (
            <button
              key={t.value}
              onClick={() => toggle('texture', t.value)}
              className={cn(
                'rounded-full border px-3 py-1.5 text-xs transition-colors hover:border-primary',
                values.texture === t.value
                  ? 'border-primary bg-primary/10 font-medium text-primary-deep'
                  : 'border-input',
              )}
            >
              {t.label}
            </button>
          ))}
        </div>
      </FilterSection>

      <FilterSection title="Length (inches)">
        <div className="flex flex-wrap gap-2">
          {LENGTH_OPTIONS.map((len) => {
            const active = values.minLength === String(len) && values.maxLength === String(len);
            return (
              <button
                key={len}
                onClick={() =>
                  onChange(
                    active
                      ? { minLength: undefined, maxLength: undefined }
                      : { minLength: String(len), maxLength: String(len) },
                  )
                }
                className={cn(
                  'h-9 w-9 rounded-full border text-xs transition-colors hover:border-primary',
                  active
                    ? 'border-primary bg-primary/10 font-medium text-primary-deep'
                    : 'border-input',
                )}
              >
                {len}&quot;
              </button>
            );
          })}
        </div>
      </FilterSection>

      <FilterSection title="Availability">
        <label className="flex cursor-pointer items-center gap-2.5 text-sm">
          <Checkbox
            checked={values.inStock === 'true'}
            onCheckedChange={(c) => onChange({ inStock: c ? 'true' : undefined })}
          />
          In stock only
        </label>
      </FilterSection>

      <Separator className="opacity-0" />
    </div>
  );
}
