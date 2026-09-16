'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Trash2, Star, Upload, Plus, Loader2, ImageIcon } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useCategories } from '@/hooks/use-catalog';
import {
  useCreateProduct,
  useUpdateProduct,
  useDeleteProduct,
  useUploadImages,
  type ProductInput,
} from '@/hooks/use-admin';
import { HAIR_TEXTURES } from '@/lib/constants';
import { nairaToKobo, koboToNaira } from '@/lib/utils';
import type { AdminProduct } from '@/lib/types';

const wholeNumber = (v: string) => v === '' || (Number.isInteger(Number(v)) && Number(v) >= 0);

// Numeric fields are kept as strings (text inputs) and converted on submit —
// this keeps RHF defaultValues and error handling simple and typed.
const schema = z.object({
  name: z.string().trim().min(2, 'Name is required').max(160),
  slug: z.string().trim().max(180).optional(),
  sku: z.string().trim().min(1, 'SKU is required').max(80),
  description: z.string().trim().min(10, 'Description must be at least 10 characters'),
  shortDesc: z.string().trim().max(280).optional(),
  price: z.string().trim().min(1, 'Enter a price').refine((v) => Number(v) > 0, 'Enter a valid price'),
  compareAtPrice: z.string().trim().optional(),
  stock: z.string().trim().refine(wholeNumber, 'Enter a whole number'),
  lowStockAt: z.string().trim().refine(wholeNumber, 'Enter a whole number'),
  categoryId: z.string().uuid('Select a category'),
  texture: z.string().optional(),
  origin: z.string().trim().max(60).optional(),
  weightGrams: z.string().trim().optional(),
  isActive: z.boolean(),
  isFeatured: z.boolean(),
  isBestSeller: z.boolean(),
  isNewArrival: z.boolean(),
  metaTitle: z.string().trim().max(160).optional(),
  metaDescription: z.string().trim().max(320).optional(),
});

type FormValues = z.infer<typeof schema>;

interface ImageState {
  url: string;
  publicId?: string;
  altText?: string;
  isPrimary: boolean;
}

interface VariantState {
  sku: string;
  length: string;
  color: string;
  density: string;
  capSize: string;
  priceOverride: string;
  stock: string;
  isActive: boolean;
}

const emptyVariant: VariantState = {
  sku: '',
  length: '',
  color: '',
  density: '',
  capSize: '',
  priceOverride: '',
  stock: '0',
  isActive: true,
};

export function ProductForm({ product }: { product?: AdminProduct }) {
  const router = useRouter();
  const isEdit = Boolean(product);
  const { data: categories } = useCategories();
  const createMutation = useCreateProduct();
  const updateMutation = useUpdateProduct();
  const deleteMutation = useDeleteProduct();
  const uploadMutation = useUploadImages();

  const [images, setImages] = useState<ImageState[]>(
    product?.images.map((img, i) => ({
      url: img.url,
      altText: img.altText ?? undefined,
      isPrimary: img.isPrimary ?? i === 0,
    })) ?? [],
  );
  const [variants, setVariants] = useState<VariantState[]>(
    product?.variants.map((v) => ({
      sku: v.sku,
      length: v.length != null ? String(v.length) : '',
      color: v.color ?? '',
      density: v.density ?? '',
      capSize: v.capSize ?? '',
      priceOverride: String(koboToNaira(v.price)),
      stock: String(v.stock),
      isActive: true,
    })) ?? [],
  );

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: product?.name ?? '',
      slug: product?.slug ?? '',
      sku: product?.sku ?? '',
      description: product?.description ?? '',
      shortDesc: product?.shortDesc ?? '',
      price: product ? String(koboToNaira(product.price)) : '',
      compareAtPrice: product?.compareAtPrice ? String(koboToNaira(product.compareAtPrice)) : '',
      stock: product ? String(product.stock) : '0',
      lowStockAt: product ? String(product.lowStockAt) : '5',
      categoryId: product?.category?.id ?? '',
      texture: product?.texture ?? '',
      origin: product?.origin ?? '',
      weightGrams: product?.weightGrams ? String(product.weightGrams) : '',
      isActive: product?.isActive ?? true,
      isFeatured: product?.isFeatured ?? false,
      isBestSeller: product?.isBestSeller ?? false,
      isNewArrival: product?.isNewArrival ?? false,
      metaTitle: product?.metaTitle ?? '',
      metaDescription: product?.metaDescription ?? '',
    },
  });

  const handleUpload = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    try {
      const uploaded = await uploadMutation.mutateAsync(Array.from(files));
      setImages((prev) => {
        const next = [...prev];
        uploaded.forEach((u) => next.push({ url: u.url, publicId: u.publicId, isPrimary: next.length === 0 }));
        if (!next.some((i) => i.isPrimary) && next.length > 0) next[0].isPrimary = true;
        return next;
      });
      toast.success(`${uploaded.length} image${uploaded.length > 1 ? 's' : ''} uploaded`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Upload failed');
    }
  };

  const setPrimary = (idx: number) =>
    setImages((prev) => prev.map((img, i) => ({ ...img, isPrimary: i === idx })));
  const removeImage = (idx: number) =>
    setImages((prev) => {
      const next = prev.filter((_, i) => i !== idx);
      if (next.length > 0 && !next.some((i) => i.isPrimary)) next[0].isPrimary = true;
      return next;
    });

  const updateVariant = (idx: number, patch: Partial<VariantState>) =>
    setVariants((prev) => prev.map((v, i) => (i === idx ? { ...v, ...patch } : v)));

  const onSubmit = handleSubmit((values) => {
    const payload: ProductInput = {
      name: values.name,
      slug: values.slug || undefined,
      sku: values.sku,
      description: values.description,
      shortDesc: values.shortDesc || undefined,
      price: nairaToKobo(Number(values.price)),
      compareAtPrice: values.compareAtPrice ? nairaToKobo(Number(values.compareAtPrice)) : undefined,
      stock: values.stock ? Number(values.stock) : 0,
      lowStockAt: values.lowStockAt ? Number(values.lowStockAt) : 5,
      categoryId: values.categoryId,
      texture: values.texture || undefined,
      origin: values.origin || undefined,
      weightGrams: values.weightGrams ? Math.round(Number(values.weightGrams)) : undefined,
      isActive: values.isActive,
      isFeatured: values.isFeatured,
      isBestSeller: values.isBestSeller,
      isNewArrival: values.isNewArrival,
      metaTitle: values.metaTitle || undefined,
      metaDescription: values.metaDescription || undefined,
      images: images.map((img, i) => ({
        url: img.url,
        publicId: img.publicId,
        altText: img.altText,
        isPrimary: img.isPrimary,
        sortOrder: i,
      })),
      variants: variants
        .filter((vr) => vr.sku.trim().length > 0)
        .map((vr) => ({
          sku: vr.sku.trim(),
          length: vr.length ? Number(vr.length) : undefined,
          color: vr.color || undefined,
          density: vr.density || undefined,
          capSize: vr.capSize || undefined,
          priceOverride: vr.priceOverride ? nairaToKobo(Number(vr.priceOverride)) : undefined,
          stock: vr.stock ? Number(vr.stock) : 0,
          isActive: vr.isActive,
        })),
    };

    if (isEdit && product) {
      updateMutation.mutate(
        { id: product.id, input: payload },
        {
          onSuccess: () => {
            toast.success('Product updated');
            router.push('/admin/products');
          },
          onError: (err) => toast.error(err instanceof Error ? err.message : 'Could not save product'),
        },
      );
    } else {
      createMutation.mutate(payload, {
        onSuccess: () => {
          toast.success('Product created');
          router.push('/admin/products');
        },
        onError: (err) => toast.error(err instanceof Error ? err.message : 'Could not create product'),
      });
    }
  });

  const handleDelete = () => {
    if (!product) return;
    deleteMutation.mutate(product.id, {
      onSuccess: (res) => {
        toast.success(res.hardDeleted ? 'Product deleted' : 'Product archived');
        router.push('/admin/products');
      },
      onError: (err) => toast.error(err instanceof Error ? err.message : 'Could not delete product'),
    });
  };

  const saving = createMutation.isPending || updateMutation.isPending;

  return (
    <form onSubmit={onSubmit} className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="font-serif text-3xl font-semibold">{isEdit ? 'Edit product' : 'New product'}</h1>
        <div className="flex gap-2">
          {isEdit && (
            <Button
              type="button"
              variant="outline"
              className="text-destructive hover:bg-destructive/10 hover:text-destructive"
              onClick={handleDelete}
              loading={deleteMutation.isPending}
            >
              <Trash2 className="h-4 w-4" /> Delete
            </Button>
          )}
          <Button type="submit" loading={saving}>
            {isEdit ? 'Save changes' : 'Create product'}
          </Button>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
        <div className="space-y-6">
          {/* Basics */}
          <Section title="Details">
            <Field label="Name" error={errors.name?.message}>
              <Input {...register('name')} placeholder="20-inch Body Wave Wig" />
            </Field>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="SKU" error={errors.sku?.message}>
                <Input {...register('sku')} placeholder="AL-BW-20" />
              </Field>
              <Field label="Slug (optional)" hint="Auto-generated if blank">
                <Input {...register('slug')} placeholder="20-inch-body-wave-wig" />
              </Field>
            </div>
            <Field label="Short description" error={errors.shortDesc?.message}>
              <Input {...register('shortDesc')} placeholder="One-line summary shown on cards" />
            </Field>
            <Field label="Description" error={errors.description?.message}>
              <Textarea {...register('description')} rows={5} placeholder="Full product description" />
            </Field>
          </Section>

          {/* Images */}
          <Section title="Images">
            {images.length > 0 && (
              <div className="mb-4 grid grid-cols-3 gap-3 sm:grid-cols-4">
                {images.map((img, idx) => (
                  <div key={img.url} className="group relative aspect-[3/4] overflow-hidden rounded-lg border bg-secondary">
                    <Image src={img.url} alt="" fill className="object-cover" sizes="120px" />
                    {img.isPrimary && (
                      <span className="absolute left-1 top-1 rounded-full bg-primary px-1.5 py-0.5 text-[10px] font-medium text-primary-foreground">
                        Primary
                      </span>
                    )}
                    <div className="absolute inset-x-0 bottom-0 flex justify-between gap-1 bg-black/50 p-1 opacity-0 transition-opacity group-hover:opacity-100">
                      <button
                        type="button"
                        onClick={() => setPrimary(idx)}
                        className="rounded p-1 text-white hover:bg-white/20"
                        title="Set as primary"
                      >
                        <Star className={`h-3.5 w-3.5 ${img.isPrimary ? 'fill-current' : ''}`} />
                      </button>
                      <button
                        type="button"
                        onClick={() => removeImage(idx)}
                        className="rounded p-1 text-white hover:bg-white/20"
                        title="Remove"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
            <label className="flex cursor-pointer items-center justify-center gap-2 rounded-lg border border-dashed py-6 text-sm text-muted-foreground transition-colors hover:border-primary/50 hover:text-foreground">
              {uploadMutation.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" /> Uploading…
                </>
              ) : (
                <>
                  <Upload className="h-4 w-4" /> Upload images
                </>
              )}
              <input
                type="file"
                accept="image/*"
                multiple
                className="hidden"
                disabled={uploadMutation.isPending}
                onChange={(e) => handleUpload(e.target.files)}
              />
            </label>
            {images.length === 0 && (
              <p className="mt-2 flex items-center gap-1.5 text-xs text-muted-foreground">
                <ImageIcon className="h-3.5 w-3.5" /> No images yet. Products look best with at least one.
              </p>
            )}
          </Section>

          {/* Variants */}
          <Section title="Variants">
            <p className="text-sm text-muted-foreground">
              Optional. Add length/colour options with their own stock. Leave empty to sell the base product only.
            </p>
            <div className="mt-3 space-y-3">
              {variants.map((vr, idx) => (
                <div key={idx} className="rounded-lg border p-3">
                  <div className="grid gap-2 sm:grid-cols-3">
                    <input
                      className="rounded-md border px-2 py-1.5 text-sm"
                      placeholder="SKU"
                      value={vr.sku}
                      onChange={(e) => updateVariant(idx, { sku: e.target.value })}
                    />
                    <input
                      className="rounded-md border px-2 py-1.5 text-sm"
                      placeholder="Length (in)"
                      inputMode="numeric"
                      value={vr.length}
                      onChange={(e) => updateVariant(idx, { length: e.target.value })}
                    />
                    <input
                      className="rounded-md border px-2 py-1.5 text-sm"
                      placeholder="Colour"
                      value={vr.color}
                      onChange={(e) => updateVariant(idx, { color: e.target.value })}
                    />
                    <input
                      className="rounded-md border px-2 py-1.5 text-sm"
                      placeholder="Density"
                      value={vr.density}
                      onChange={(e) => updateVariant(idx, { density: e.target.value })}
                    />
                    <input
                      className="rounded-md border px-2 py-1.5 text-sm"
                      placeholder="Cap size"
                      value={vr.capSize}
                      onChange={(e) => updateVariant(idx, { capSize: e.target.value })}
                    />
                    <input
                      className="rounded-md border px-2 py-1.5 text-sm"
                      placeholder="Price ₦ (optional)"
                      inputMode="numeric"
                      value={vr.priceOverride}
                      onChange={(e) => updateVariant(idx, { priceOverride: e.target.value })}
                    />
                    <input
                      className="rounded-md border px-2 py-1.5 text-sm"
                      placeholder="Stock"
                      inputMode="numeric"
                      value={vr.stock}
                      onChange={(e) => updateVariant(idx, { stock: e.target.value })}
                    />
                  </div>
                  <div className="mt-2 flex items-center justify-between">
                    <label className="flex items-center gap-2 text-xs text-muted-foreground">
                      <Checkbox
                        checked={vr.isActive}
                        onCheckedChange={(c) => updateVariant(idx, { isActive: c === true })}
                      />
                      Active
                    </label>
                    <button
                      type="button"
                      onClick={() => setVariants((prev) => prev.filter((_, i) => i !== idx))}
                      className="text-xs text-destructive hover:underline"
                    >
                      Remove
                    </button>
                  </div>
                </div>
              ))}
            </div>
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="mt-3"
              onClick={() => setVariants((prev) => [...prev, { ...emptyVariant }])}
            >
              <Plus className="h-4 w-4" /> Add variant
            </Button>
          </Section>

          {/* SEO */}
          <Section title="SEO">
            <Field label="Meta title" error={errors.metaTitle?.message}>
              <Input {...register('metaTitle')} />
            </Field>
            <Field label="Meta description" error={errors.metaDescription?.message}>
              <Textarea {...register('metaDescription')} rows={2} />
            </Field>
          </Section>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          <Section title="Pricing & stock">
            <Field label="Price (₦)" error={errors.price?.message}>
              <Input type="number" step="0.01" {...register('price')} />
            </Field>
            <Field label="Compare-at price (₦)" hint="Shows a strikethrough" error={errors.compareAtPrice?.message}>
              <Input type="number" step="0.01" {...register('compareAtPrice')} />
            </Field>
            <div className="grid grid-cols-2 gap-4">
              <Field label="Stock" error={errors.stock?.message}>
                <Input type="number" {...register('stock')} />
              </Field>
              <Field label="Low-stock at" error={errors.lowStockAt?.message}>
                <Input type="number" {...register('lowStockAt')} />
              </Field>
            </div>
          </Section>

          <Section title="Organisation">
            <Field label="Category" error={errors.categoryId?.message}>
              <Select value={watch('categoryId')} onValueChange={(v) => setValue('categoryId', v, { shouldValidate: true })}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a category" />
                </SelectTrigger>
                <SelectContent>
                  {(categories ?? []).map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
            <Field label="Texture">
              <Select value={watch('texture') || ''} onValueChange={(v) => setValue('texture', v)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select texture" />
                </SelectTrigger>
                <SelectContent>
                  {HAIR_TEXTURES.map((t) => (
                    <SelectItem key={t.value} value={t.value}>
                      {t.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
            <div className="grid grid-cols-2 gap-4">
              <Field label="Origin">
                <Input {...register('origin')} placeholder="Brazilian" />
              </Field>
              <Field label="Weight (g)" error={errors.weightGrams?.message}>
                <Input type="number" {...register('weightGrams')} />
              </Field>
            </div>
          </Section>

          <Section title="Visibility">
            <ToggleRow label="Active" checked={watch('isActive')} onChange={(c) => setValue('isActive', c)} />
            <ToggleRow label="Featured" checked={watch('isFeatured')} onChange={(c) => setValue('isFeatured', c)} />
            <ToggleRow label="Best seller" checked={watch('isBestSeller')} onChange={(c) => setValue('isBestSeller', c)} />
            <ToggleRow label="New arrival" checked={watch('isNewArrival')} onChange={(c) => setValue('isNewArrival', c)} />
          </Section>
        </div>
      </div>
    </form>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-2xl border bg-card p-5">
      <h2 className="mb-4 font-serif text-lg font-semibold">{title}</h2>
      <div className="space-y-4">{children}</div>
    </div>
  );
}

function Field({
  label,
  hint,
  error,
  children,
}: {
  label: string;
  hint?: string;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <Label>{label}</Label>
      {children}
      {hint && !error && <p className="text-xs text-muted-foreground">{hint}</p>}
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  );
}

function ToggleRow({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
}) {
  return (
    <label className="flex cursor-pointer items-center justify-between text-sm">
      <span>{label}</span>
      <Checkbox checked={checked} onCheckedChange={(c) => onChange(c === true)} />
    </label>
  );
}
