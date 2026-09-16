'use client';

import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import Link from 'next/link';
import { toast } from 'sonner';
import { Star, ShieldCheck, MessageSquare } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { RatingStars } from '@/components/ui/rating-stars';
import { Skeleton } from '@/components/ui/skeleton';
import { Pagination } from '@/components/ui/pagination';
import { EmptyState } from '@/components/ui/empty-state';
import { useProductReviews } from '@/hooks/use-catalog';
import { useAuth } from '@/hooks/use-auth';
import { http, ApiError } from '@/lib/api';
import { cn, formatDate, initials } from '@/lib/utils';
import type { ReviewSummary } from '@/lib/types';

export function ProductReviews({ slug }: { slug: string }) {
  const [page, setPage] = useState(1);
  const { data, isLoading } = useProductReviews(slug, page);
  const reviews = data?.data.reviews ?? [];
  const summary = data?.data.summary;
  const meta = data?.meta;

  return (
    <section id="reviews" className="border-t py-14">
      <div className="container">
        <h2 className="mb-8 font-serif text-2xl font-semibold sm:text-3xl">Customer Reviews</h2>

        <div className="grid gap-10 lg:grid-cols-[320px_1fr]">
          <div className="space-y-6">
            <RatingSummaryCard summary={summary} loading={isLoading} />
            <ReviewForm slug={slug} />
          </div>

          <div>
            {isLoading ? (
              <div className="space-y-6">
                {Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className="space-y-2">
                    <Skeleton className="h-4 w-32" />
                    <Skeleton className="h-3 w-full" />
                    <Skeleton className="h-3 w-2/3" />
                  </div>
                ))}
              </div>
            ) : reviews.length === 0 ? (
              <EmptyState
                icon={MessageSquare}
                title="No reviews yet"
                description="Be the first to share your experience with this product."
              />
            ) : (
              <ul className="space-y-8">
                {reviews.map((review) => (
                  <li key={review.id} className="border-b pb-8 last:border-b-0">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-sm font-semibold text-primary-deep">
                        {initials(review.author.fullName)}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-medium">{review.author.fullName}</span>
                          {review.isVerified && (
                            <span className="inline-flex items-center gap-1 text-xs text-emerald-600">
                              <ShieldCheck className="h-3.5 w-3.5" /> Verified Purchase
                            </span>
                          )}
                        </div>
                        <span className="text-xs text-muted-foreground">{formatDate(review.createdAt)}</span>
                      </div>
                    </div>
                    <div className="mt-3">
                      <RatingStars value={review.rating} size={15} />
                    </div>
                    {review.title && <h4 className="mt-2 font-medium">{review.title}</h4>}
                    <p className="mt-1 text-sm leading-relaxed text-muted-foreground">{review.comment}</p>
                  </li>
                ))}
              </ul>
            )}

            {meta && meta.totalPages > 1 && (
              <div className="mt-8">
                <Pagination meta={meta} onPageChange={setPage} />
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}

function RatingSummaryCard({ summary, loading }: { summary?: ReviewSummary; loading: boolean }) {
  if (loading) {
    return <Skeleton className="h-40 w-full rounded-2xl" />;
  }
  if (!summary || summary.total === 0) {
    return (
      <div className="rounded-2xl border p-6 text-center">
        <p className="text-sm text-muted-foreground">No ratings yet</p>
      </div>
    );
  }
  return (
    <div className="rounded-2xl border p-6">
      <div className="flex items-center gap-4">
        <div className="text-center">
          <div className="font-serif text-4xl font-bold text-primary-deep">{summary.average.toFixed(1)}</div>
          <RatingStars value={summary.average} size={14} />
          <div className="mt-1 text-xs text-muted-foreground">{summary.total} reviews</div>
        </div>
        <div className="flex-1 space-y-1.5">
          {([5, 4, 3, 2, 1] as const).map((star) => {
            const count = summary.distribution[String(star) as '1'] ?? 0;
            const pct = summary.total > 0 ? (count / summary.total) * 100 : 0;
            return (
              <div key={star} className="flex items-center gap-2 text-xs">
                <span className="flex w-6 items-center gap-0.5 text-muted-foreground">
                  {star}
                  <Star className="h-3 w-3 fill-current" />
                </span>
                <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-muted">
                  <div className="h-full rounded-full bg-gold" style={{ width: `${pct}%` }} />
                </div>
                <span className="w-6 text-right text-muted-foreground">{count}</span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function ReviewForm({ slug }: { slug: string }) {
  const { status } = useAuth();
  const queryClient = useQueryClient();
  const [rating, setRating] = useState(0);
  const [hover, setHover] = useState(0);
  const [title, setTitle] = useState('');
  const [comment, setComment] = useState('');

  const mutation = useMutation({
    mutationFn: () =>
      http.post(`/reviews/product/${slug}`, {
        rating,
        title: title.trim() || undefined,
        comment: comment.trim(),
      }),
    onSuccess: () => {
      toast.success('Thank you! Your review has been submitted.');
      setRating(0);
      setTitle('');
      setComment('');
      queryClient.invalidateQueries({ queryKey: ['reviews', slug] });
      queryClient.invalidateQueries({ queryKey: ['product', slug] });
    },
    onError: (err) => {
      const message =
        err instanceof ApiError
          ? err.status === 403
            ? 'Only verified purchasers can review this product.'
            : err.message
          : 'Could not submit your review.';
      toast.error(message);
    },
  });

  if (status !== 'authenticated') {
    return (
      <div className="rounded-2xl border border-dashed p-6 text-center">
        <p className="text-sm text-muted-foreground">Purchased this product?</p>
        <Button asChild variant="outline" size="sm" className="mt-3">
          <Link href="/login">Sign in to write a review</Link>
        </Button>
      </div>
    );
  }

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (rating < 1) {
      toast.error('Please select a rating');
      return;
    }
    if (comment.trim().length < 3) {
      toast.error('Please write a short review');
      return;
    }
    mutation.mutate();
  };

  return (
    <form onSubmit={submit} className="rounded-2xl border p-6">
      <h3 className="font-serif text-lg font-semibold">Write a review</h3>
      <p className="mt-1 text-xs text-muted-foreground">Verified purchasers only.</p>

      <div className="mt-4">
        <Label>Your rating</Label>
        <div className="mt-1.5 flex gap-1">
          {[1, 2, 3, 4, 5].map((star) => (
            <button
              key={star}
              type="button"
              onClick={() => setRating(star)}
              onMouseEnter={() => setHover(star)}
              onMouseLeave={() => setHover(0)}
              aria-label={`${star} star${star === 1 ? '' : 's'}`}
            >
              <Star
                className={cn(
                  'h-7 w-7 transition-colors',
                  (hover || rating) >= star ? 'fill-gold text-gold' : 'text-muted-foreground/40',
                )}
              />
            </button>
          ))}
        </div>
      </div>

      <div className="mt-4 space-y-1.5">
        <Label htmlFor="review-title">Title (optional)</Label>
        <Input
          id="review-title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          maxLength={120}
          placeholder="Summarise your experience"
        />
      </div>

      <div className="mt-4 space-y-1.5">
        <Label htmlFor="review-comment">Your review</Label>
        <Textarea
          id="review-comment"
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          maxLength={2000}
          rows={4}
          placeholder="What did you love about it?"
        />
      </div>

      <Button type="submit" className="mt-4 w-full" loading={mutation.isPending}>
        Submit Review
      </Button>
    </form>
  );
}
