"use client";

import { Avatar } from "@/components/ui/Avatar";
import { Button } from "@/components/ui/Button";
import { PageHeader } from "@/components/ui/PageHeader";
import { Stars } from "@/components/ui/Stars";
import { Skeleton } from "@/components/ui/Skeleton";
import { EmptyState, ErrorState } from "@/components/ui/States";
import { timeAgo } from "@/lib/format";
import { useReplyReview, useVendorReviews } from "@/lib/hooks/use-vendor-admin";
import { toast } from "@/lib/toast-store";
import type { Review } from "@/lib/types";
import { useState } from "react";

export default function VendorReviewsPage() {
  const { data, isLoading, isError, refetch, fetchNextPage, hasNextPage, isFetchingNextPage } = useVendorReviews();
  const reviews = data?.pages.flatMap((p) => p.data) ?? [];

  return (
    <>
      <PageHeader title="Reviews" subtitle="Respond to customer feedback" />

      <div className="mx-auto w-full max-w-3xl space-y-3 p-4 md:p-6">
        {isLoading ? (
          <>
            <Skeleton className="h-28 rounded-card" />
            <Skeleton className="h-28 rounded-card" />
          </>
        ) : isError ? (
          <ErrorState message="Couldn't load reviews. Are you a vendor?" onRetry={() => refetch()} />
        ) : reviews.length === 0 ? (
          <EmptyState title="No reviews yet" hint="Customer reviews of your store will appear here." />
        ) : (
          <>
            {reviews.map((r) => (
              <ReviewRow key={r.id} review={r} />
            ))}
            {hasNextPage && (
              <div className="flex justify-center">
                <Button variant="secondary" onClick={() => fetchNextPage()} loading={isFetchingNextPage}>Load more</Button>
              </div>
            )}
          </>
        )}
      </div>
    </>
  );
}

function ReviewRow({ review }: { review: Review }) {
  const reply = useReplyReview();
  const [text, setText] = useState("");

  const submit = async () => {
    if (!text.trim()) return;
    try {
      await reply.mutateAsync({ ratingId: review.id, reply: text.trim() });
      toast.success("Reply posted");
    } catch {
      toast.error("Could not post reply.");
    }
  };

  return (
    <div className="rounded-card border border-line bg-bg-soft p-4">
      <div className="flex items-center gap-3">
        <Avatar src={review.user?.avatar} name={review.user?.name ?? "User"} size={36} />
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-medium">{review.user?.name ?? "Customer"}</p>
          <p className="text-xs text-muted">{timeAgo(review.created_at)}</p>
        </div>
        <Stars value={review.rating} />
      </div>
      {review.review && <p className="mt-2 text-sm text-content">{review.review}</p>}
      {review.images.length > 0 && (
        <div className="mt-2 flex gap-2 overflow-x-auto">
          {review.images.map((url) => (
            <a key={url} href={url} target="_blank" rel="noreferrer" className="shrink-0">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={url} alt="" className="h-20 w-20 rounded-lg border border-line object-cover transition-opacity hover:opacity-80" />
            </a>
          ))}
        </div>
      )}

      {review.vendor_reply ? (
        <div className="mt-3 rounded-lg border-l-2 border-brand bg-surface p-3">
          <p className="text-xs font-semibold text-brand">Your reply</p>
          <p className="text-sm text-content">{review.vendor_reply}</p>
        </div>
      ) : (
        <div className="mt-3 flex gap-2">
          <input
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Write a reply…"
            className="h-9 flex-1 rounded-lg border border-line bg-bg px-3 text-sm focus:outline-none focus:ring-2 focus:ring-brand/60"
          />
          <Button size="sm" onClick={submit} loading={reply.isPending} disabled={!text.trim()}>Reply</Button>
        </div>
      )}
    </div>
  );
}
