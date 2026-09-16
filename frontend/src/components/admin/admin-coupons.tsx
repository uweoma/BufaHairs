'use client';

import { useState } from 'react';
import { Ticket, Plus, Pencil, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Skeleton } from '@/components/ui/skeleton';
import { EmptyState } from '@/components/ui/empty-state';
import { Pagination } from '@/components/ui/pagination';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  useCoupons,
  useCreateCoupon,
  useUpdateCoupon,
  useDeleteCoupon,
  type CouponInput,
} from '@/hooks/use-admin';
import { formatNaira, formatDate, nairaToKobo, koboToNaira, cn } from '@/lib/utils';
import type { Coupon, CouponType } from '@/lib/types';

interface FormState {
  code: string;
  description: string;
  type: CouponType;
  value: string;
  minOrderAmount: string;
  maxDiscount: string;
  usageLimit: string;
  perUserLimit: string;
  startsAt: string;
  expiresAt: string;
  isActive: boolean;
}

const blankForm: FormState = {
  code: '',
  description: '',
  type: 'PERCENTAGE',
  value: '',
  minOrderAmount: '',
  maxDiscount: '',
  usageLimit: '',
  perUserLimit: '',
  startsAt: '',
  expiresAt: '',
  isActive: true,
};

function toFormState(c: Coupon): FormState {
  return {
    code: c.code,
    description: c.description ?? '',
    type: c.type,
    value: c.type === 'PERCENTAGE' ? String(c.value) : String(koboToNaira(c.value)),
    minOrderAmount: c.minSpend != null ? String(koboToNaira(c.minSpend)) : '',
    maxDiscount: c.maxDiscount != null ? String(koboToNaira(c.maxDiscount)) : '',
    usageLimit: c.usageLimit != null ? String(c.usageLimit) : '',
    perUserLimit: c.perUserLimit != null ? String(c.perUserLimit) : '',
    startsAt: c.startsAt ? c.startsAt.slice(0, 10) : '',
    expiresAt: c.expiresAt ? c.expiresAt.slice(0, 10) : '',
    isActive: c.isActive,
  };
}

function buildPayload(s: FormState): CouponInput {
  return {
    code: s.code.trim().toUpperCase(),
    description: s.description.trim() || null,
    type: s.type,
    value: s.type === 'PERCENTAGE' ? Number(s.value) : nairaToKobo(Number(s.value)),
    minOrderAmount: s.minOrderAmount ? nairaToKobo(Number(s.minOrderAmount)) : null,
    maxDiscount: s.maxDiscount ? nairaToKobo(Number(s.maxDiscount)) : null,
    usageLimit: s.usageLimit ? Number(s.usageLimit) : null,
    perUserLimit: s.perUserLimit ? Number(s.perUserLimit) : null,
    startsAt: s.startsAt || null,
    expiresAt: s.expiresAt || null,
    isActive: s.isActive,
  };
}

export function AdminCoupons() {
  const [page, setPage] = useState(1);
  const [editing, setEditing] = useState<Coupon | 'new' | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  const query = useCoupons({ page });
  const deleteMutation = useDeleteCoupon();
  const coupons = query.data?.coupons ?? [];
  const meta = query.data?.meta;

  const handleDelete = (id: string) => {
    deleteMutation.mutate(id, {
      onSuccess: (res) => {
        toast.success(res.deleted ? 'Coupon deleted' : 'Coupon deactivated');
        setConfirmDeleteId(null);
      },
      onError: (err) => toast.error(err instanceof Error ? err.message : 'Could not delete coupon'),
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="font-serif text-3xl font-semibold">Coupons</h1>
        <Button onClick={() => setEditing('new')}>
          <Plus className="h-4 w-4" /> New coupon
        </Button>
      </div>

      {query.isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-16 rounded-xl" />
          ))}
        </div>
      ) : coupons.length === 0 ? (
        <EmptyState
          icon={Ticket}
          title="No coupons yet"
          description="Create a discount code to run a promotion."
          action={
            <Button onClick={() => setEditing('new')}>
              <Plus className="h-4 w-4" /> New coupon
            </Button>
          }
        />
      ) : (
        <>
          <div className="overflow-hidden rounded-2xl border">
            <table className="w-full text-sm">
              <thead className="bg-secondary/50 text-left text-xs uppercase tracking-wide text-muted-foreground">
                <tr>
                  <th className="px-4 py-3 font-medium">Code</th>
                  <th className="px-4 py-3 font-medium">Discount</th>
                  <th className="px-4 py-3 font-medium">Min spend</th>
                  <th className="px-4 py-3 font-medium">Used</th>
                  <th className="px-4 py-3 font-medium">Expires</th>
                  <th className="px-4 py-3 font-medium">Status</th>
                  <th className="px-4 py-3 text-right font-medium">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {coupons.map((c) => (
                  <tr key={c.id} className="transition-colors hover:bg-secondary/30">
                    <td className="px-4 py-3">
                      <p className="font-mono font-medium">{c.code}</p>
                      {c.description && <p className="text-xs text-muted-foreground">{c.description}</p>}
                    </td>
                    <td className="px-4 py-3 font-medium">
                      {c.type === 'PERCENTAGE' ? `${c.value}%` : formatNaira(c.value)}
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {c.minSpend ? formatNaira(c.minSpend) : '—'}
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {c.usedCount}
                      {c.usageLimit ? ` / ${c.usageLimit}` : ''}
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {c.expiresAt ? formatDate(c.expiresAt) : '—'}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={cn(
                          'inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium',
                          c.isActive ? 'bg-emerald-100 text-emerald-700' : 'bg-muted text-muted-foreground',
                        )}
                      >
                        {c.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      {confirmDeleteId === c.id ? (
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => handleDelete(c.id)}
                            className="text-xs font-medium text-destructive hover:underline"
                          >
                            Confirm
                          </button>
                          <button
                            onClick={() => setConfirmDeleteId(null)}
                            className="text-xs text-muted-foreground hover:underline"
                          >
                            Cancel
                          </button>
                        </div>
                      ) : (
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => setEditing(c)}
                            className="rounded-md p-1.5 text-muted-foreground hover:bg-secondary hover:text-foreground"
                            title="Edit"
                          >
                            <Pencil className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => setConfirmDeleteId(c.id)}
                            className="rounded-md p-1.5 text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
                            title="Delete"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {meta && <Pagination meta={meta} onPageChange={setPage} />}
        </>
      )}

      <CouponDialog editing={editing} onClose={() => setEditing(null)} />
    </div>
  );
}

function CouponDialog({ editing, onClose }: { editing: Coupon | 'new' | null; onClose: () => void }) {
  const createMutation = useCreateCoupon();
  const updateMutation = useUpdateCoupon();
  const isEdit = editing !== null && editing !== 'new';
  const [form, setForm] = useState<FormState>(blankForm);
  // Re-seed the form whenever the target changes.
  const [seededFor, setSeededFor] = useState<string | null>(null);
  const seedKey = editing === 'new' ? 'new' : isEdit ? (editing as Coupon).id : null;
  if (editing !== null && seedKey !== seededFor) {
    setForm(editing === 'new' ? blankForm : toFormState(editing as Coupon));
    setSeededFor(seedKey);
  }

  const set = (patch: Partial<FormState>) => setForm((prev) => ({ ...prev, ...patch }));

  const submit = () => {
    if (!form.code.trim()) {
      toast.error('Enter a coupon code');
      return;
    }
    if (!form.value || Number(form.value) <= 0) {
      toast.error('Enter a discount value');
      return;
    }
    const payload = buildPayload(form);
    const onSuccess = () => {
      toast.success(isEdit ? 'Coupon updated' : 'Coupon created');
      onClose();
    };
    const onError = (err: unknown) =>
      toast.error(err instanceof Error ? err.message : 'Could not save coupon');

    if (isEdit) {
      updateMutation.mutate({ id: (editing as Coupon).id, input: payload }, { onSuccess, onError });
    } else {
      createMutation.mutate(payload, { onSuccess, onError });
    }
  };

  const saving = createMutation.isPending || updateMutation.isPending;

  return (
    <Dialog open={editing !== null} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{isEdit ? 'Edit coupon' : 'New coupon'}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label>Code</Label>
              <Input
                value={form.code}
                onChange={(e) => set({ code: e.target.value.toUpperCase() })}
                placeholder="WELCOME10"
                className="font-mono"
              />
            </div>
            <div className="space-y-1.5">
              <Label>Type</Label>
              <Select value={form.type} onValueChange={(v) => set({ type: v as CouponType })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="PERCENTAGE">Percentage</SelectItem>
                  <SelectItem value="FIXED">Fixed amount</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-1.5">
            <Label>Description</Label>
            <Input
              value={form.description}
              onChange={(e) => set({ description: e.target.value })}
              placeholder="10% off your first order"
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label>{form.type === 'PERCENTAGE' ? 'Percentage (%)' : 'Amount (₦)'}</Label>
              <Input
                type="number"
                value={form.value}
                onChange={(e) => set({ value: e.target.value })}
                placeholder={form.type === 'PERCENTAGE' ? '10' : '5000'}
              />
            </div>
            <div className="space-y-1.5">
              <Label>Min. spend (₦)</Label>
              <Input
                type="number"
                value={form.minOrderAmount}
                onChange={(e) => set({ minOrderAmount: e.target.value })}
                placeholder="Optional"
              />
            </div>
          </div>

          {form.type === 'PERCENTAGE' && (
            <div className="space-y-1.5">
              <Label>Max. discount (₦)</Label>
              <Input
                type="number"
                value={form.maxDiscount}
                onChange={(e) => set({ maxDiscount: e.target.value })}
                placeholder="Cap the discount (optional)"
              />
            </div>
          )}

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label>Total usage limit</Label>
              <Input
                type="number"
                value={form.usageLimit}
                onChange={(e) => set({ usageLimit: e.target.value })}
                placeholder="Unlimited"
              />
            </div>
            <div className="space-y-1.5">
              <Label>Per-customer limit</Label>
              <Input
                type="number"
                value={form.perUserLimit}
                onChange={(e) => set({ perUserLimit: e.target.value })}
                placeholder="Unlimited"
              />
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label>Starts</Label>
              <Input type="date" value={form.startsAt} onChange={(e) => set({ startsAt: e.target.value })} />
            </div>
            <div className="space-y-1.5">
              <Label>Expires</Label>
              <Input type="date" value={form.expiresAt} onChange={(e) => set({ expiresAt: e.target.value })} />
            </div>
          </div>

          <label className="flex cursor-pointer items-center gap-2 text-sm">
            <Checkbox checked={form.isActive} onCheckedChange={(c) => set({ isActive: c === true })} />
            Active
          </label>
        </div>

        <DialogFooter>
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={submit} loading={saving}>
            {isEdit ? 'Save changes' : 'Create coupon'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
