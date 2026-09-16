'use client';

import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { NIGERIA_STATES } from '@/lib/constants';
import type { AddressInput } from '@/hooks/use-addresses';

const optionalString = z.string().trim().optional().or(z.literal(''));

const schema = z.object({
  label: z.string().trim().max(40).optional().or(z.literal('')),
  fullName: z.string().trim().min(2, 'Full name is required').max(120),
  phone: z
    .string()
    .trim()
    .regex(/^\+?[0-9\s-]{7,20}$/, 'Enter a valid phone number'),
  addressLine1: z.string().trim().min(3, 'Address is required').max(200),
  addressLine2: optionalString,
  city: z.string().trim().min(2, 'City is required').max(80),
  state: z.string().trim().min(2, 'Select a state'),
  country: z.string().trim().min(2).max(60),
  postalCode: z.string().trim().max(20).optional().or(z.literal('')),
  isDefault: z.boolean().optional(),
});

export type AddressFormValues = z.infer<typeof schema>;

interface AddressFormProps {
  defaultValues?: Partial<AddressInput>;
  onSubmit: (values: AddressInput) => Promise<void> | void;
  submitLabel?: string;
  showDefaultToggle?: boolean;
  defaultToggleLabel?: string;
  onCancel?: () => void;
}

export function AddressForm({
  defaultValues,
  onSubmit,
  submitLabel = 'Save Address',
  showDefaultToggle = true,
  defaultToggleLabel = 'Set as default address',
  onCancel,
}: AddressFormProps) {
  const {
    register,
    handleSubmit,
    control,
    formState: { errors, isSubmitting },
  } = useForm<AddressFormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      label: defaultValues?.label ?? '',
      fullName: defaultValues?.fullName ?? '',
      phone: defaultValues?.phone ?? '',
      addressLine1: defaultValues?.addressLine1 ?? '',
      addressLine2: defaultValues?.addressLine2 ?? '',
      city: defaultValues?.city ?? '',
      state: defaultValues?.state ?? '',
      country: defaultValues?.country ?? 'Nigeria',
      postalCode: defaultValues?.postalCode ?? '',
      isDefault: defaultValues?.isDefault ?? false,
    },
  });

  const submit = handleSubmit(async (values) => {
    await onSubmit({
      label: values.label || undefined,
      fullName: values.fullName,
      phone: values.phone,
      addressLine1: values.addressLine1,
      addressLine2: values.addressLine2 || undefined,
      city: values.city,
      state: values.state,
      country: values.country,
      postalCode: values.postalCode || undefined,
      isDefault: values.isDefault,
    });
  });

  return (
    <form onSubmit={submit} className="space-y-4" noValidate>
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label htmlFor="fullName">Full name</Label>
          <Input id="fullName" autoComplete="name" {...register('fullName')} aria-invalid={!!errors.fullName} />
          {errors.fullName && <p className="text-xs text-destructive">{errors.fullName.message}</p>}
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="phone">Phone</Label>
          <Input id="phone" type="tel" autoComplete="tel" placeholder="+234 801 234 5678" {...register('phone')} aria-invalid={!!errors.phone} />
          {errors.phone && <p className="text-xs text-destructive">{errors.phone.message}</p>}
        </div>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="addressLine1">Address</Label>
        <Input id="addressLine1" autoComplete="address-line1" placeholder="Street address" {...register('addressLine1')} aria-invalid={!!errors.addressLine1} />
        {errors.addressLine1 && <p className="text-xs text-destructive">{errors.addressLine1.message}</p>}
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="addressLine2">Apartment, suite, etc. <span className="text-muted-foreground">(optional)</span></Label>
        <Input id="addressLine2" autoComplete="address-line2" {...register('addressLine2')} />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label htmlFor="city">City</Label>
          <Input id="city" autoComplete="address-level2" {...register('city')} aria-invalid={!!errors.city} />
          {errors.city && <p className="text-xs text-destructive">{errors.city.message}</p>}
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="state">State</Label>
          <Controller
            control={control}
            name="state"
            render={({ field }) => (
              <Select value={field.value} onValueChange={field.onChange}>
                <SelectTrigger id="state" aria-invalid={!!errors.state}>
                  <SelectValue placeholder="Select a state" />
                </SelectTrigger>
                <SelectContent>
                  {NIGERIA_STATES.map((s) => (
                    <SelectItem key={s} value={s}>
                      {s}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          />
          {errors.state && <p className="text-xs text-destructive">{errors.state.message}</p>}
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label htmlFor="country">Country</Label>
          <Input id="country" autoComplete="country-name" {...register('country')} aria-invalid={!!errors.country} />
          {errors.country && <p className="text-xs text-destructive">{errors.country.message}</p>}
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="postalCode">Postal code <span className="text-muted-foreground">(optional)</span></Label>
          <Input id="postalCode" autoComplete="postal-code" {...register('postalCode')} />
        </div>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="label">Label <span className="text-muted-foreground">(optional, e.g. Home)</span></Label>
        <Input id="label" placeholder="Home" {...register('label')} />
      </div>

      {showDefaultToggle && (
        <Controller
          control={control}
          name="isDefault"
          render={({ field }) => (
            <label className="flex cursor-pointer items-center gap-2.5 text-sm">
              <Checkbox checked={!!field.value} onCheckedChange={field.onChange} />
              {defaultToggleLabel}
            </label>
          )}
        />
      )}

      <div className="flex gap-3 pt-2">
        <Button type="submit" loading={isSubmitting}>
          {submitLabel}
        </Button>
        {onCancel && (
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancel
          </Button>
        )}
      </div>
    </form>
  );
}
