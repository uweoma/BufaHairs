'use client';

import { useState } from 'react';
import Link from 'next/link';
import { MessageSquare, Check, X, Trash2, BadgeCheck } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { EmptyState } from '@/components/ui/empty-state';
import { Pagination } from '@/components/ui/pagination';
import { RatingStars } from '@/components/ui/rating-stars';
import { useAdminReviews, useModerateReview, useDeleteReview } from '@/hooks/use-admin';
import { formatDate, initials, cn } from '@/lib/utils';

const FILTERS: { value: 'all' | 'pending' | 'approved'; label: string }[] = [
  { value: 'pending', label: 'Pending' },
  { value: 'approved', label: 'Approved' },
  { value: 'all', label: 'All' },
];

function approvedParam(f: 'all' | 'pending' | 'approved'): boolean | undefined {
  if (f === 'pending') return false;
  if (f === 'approved') return true;
  return undefined;
}

export function AdminReviews() {
  const [page, setPage] = useState(1);
  const [filter, setFilter] = useState<'all' | 'pending' | 'approved'>('pending');
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  const query = useAdminReviews({ page, approved: approvedParam(filter) });
  const moderate = useModerateReview();
  const remove = useDeleteReview();

  const reviews = query.data?.reviews ?? [];
  const meta = query.data?.meta;

  const setApproved = (id: string, isApproved: boolean) => {
    moderate.mutate(
      { id, isApproved },
      {
        onSuccess: () => toast.success(isApproved ? 'Review approved' : 'Review hidden'),
        onError: (err) => toast.error(err instanceof Error ? err.message : 'Could not update review'),
      },
    );
  };

  const handleDelete = (id: string) => {
    remove.mutate(id, {
      onSuccess: () => {
        toast.success('Review deleted');
        setConfirmDeleteId(null);
      },
      onError: (err) => toast.error(err instanceof Error ? err.message : 'Could not delete review'),
    });
  };

  return (
    <div className="space-y-6">
      <h1 className="font-serif text-3xl font-semibold">Reviews</h1>

      <div className="flex gap-2">
        {FILTERS.map((f) => (
          <button
            key={f.value}
            onClick={() => {
              setFilter(f.value);
              setPage(1);
            }}
            className={cn(
              'rounded-full border px-4 py-1.5 text-sm font-medium transition-colors',
              filter === f.value ? 'border-primary bg-primary text-primary-foreground' : 'hover:border-primary/40',
            )}
          >
            {f.label}
          </button>
        ))}
      </div>

      {query.isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-32 rounded-2xl" />
          ))}
        </div>
      ) : reviews.length === 0 ? (
        <EmptyState
          icon={MessageSquare}
          title="No reviews here"
          description={
            filter === 'pending'
              ? 'There are no reviews awaiting moderation.'
              : 'No reviews match this filter yet.'
          }
        />
      ) : (
        <>
          <ul className="space-y-4">
            {reviews.map((r) => (
              <li key={r.id} className="rounded-2xl border bg-card p-5">
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div className="flex items-start gap-3">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10 text-sm font-medium text-primary-deep">
                      {initials(r.author.fullName)}
                    </div>
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="font-medium">{r.author.fullName}</p>
                        {r.isVerified && (
                          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-medium text-emerald-700">
                            <BadgeCheck className="h-3 w-3" /> Verified buyer
                          </span>
                        )}
                        <span
                          className={cn(
                            'inline-flex rounded-full px-2 py-0.5 text-xs font-medium',
                            r.isApproved ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700',
                          )}
                        >
                          {r.isApproved ? 'Approved' : 'Pending'}
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {r.author.email} · {formatDate(r.createdAt)}
                      </p>
                      <div className="mt-1">
                        <RatingStars value={r.rating} />
                      </div>
                    </div>
                  </div>
                  <Link
                    href={`/products/${r.product.slug}`}
                    className="text-sm text-primary hover:underline"
                    target="_blank"
                  >
                    {r.product.name}
                  </Link>
                </div>

                <div className="mt-3 space-y-1">
                  {r.title && <p className="font-medium">{r.title}</p>}
                  <p className="text-sm text-muted-foreground">{r.comment}</p>
                </div>

                <div className="mt-4 flex flex-wrap items-center gap-2 border-t pt-4">
                  {r.isApproved ? (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setApproved(r.id, false)}
                      loading={moderate.isPending && moderate.variables?.id === r.id}
                    >
                      <X className="h-4 w-4" /> Hide
                    </Button>
                  ) : (
                    <Button
                      size="sm"
                      onClick={() => setApproved(r.id, true)}
                      loading={moderate.isPending && moderate.variables?.id === r.id}
                    >
                      <Check className="h-4 w-4" /> Approve
                    </Button>
                  )}

                  {confirmDeleteId === r.id ? (
                    <div className="flex items-center gap-2">
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => handleDelete(r.id)}
                        loading={remove.isPending && remove.variables === r.id}
                      >
                        Confirm delete
                      </Button>
                      <Button variant="ghost" size="sm" onClick={() => setConfirmDeleteId(null)}>
                        Cancel
                      </Button>
                    </div>
                  ) : (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setConfirmDeleteId(r.id)}
                      className="text-destructive hover:bg-destructive/10 hover:text-destructive"
                    >
                      <Trash2 className="h-4 w-4" /> Delete
                    </Button>
                  )}
                </div>
              </li>
            ))}
          </ul>
          {meta && <Pagination meta={meta} onPageChange={setPage} />}
        </>
      )}
    </div>
  );
}
