"use client";

import { Avatar } from "@/components/ui/Avatar";
import { Button } from "@/components/ui/Button";
import { Stars } from "@/components/ui/Stars";
import { EmptyState } from "@/components/ui/States";
import { Skeleton } from "@/components/ui/Skeleton";
import { timeAgo } from "@/lib/format";
import { useVendorReviews } from "@/lib/hooks/use-vendors";

export function VendorReviews({ idOrSlug }: { idOrSlug: string }) {
  const { data, isLoading, isError, fetchNextPage, hasNextPage, isFetchingNextPage } = useVendorReviews(idOrSlug);
  const reviews = data?.pages.flatMap((p) => p.data) ?? [];

  if (isLoading) {
    return (
      <div className="space-y-3">
        <Skeleton className="h-20 rounded-card" />
        <Skeleton className="h-20 rounded-card" />
      </div>
    );
  }
  if (isError) return <p className="text-sm text-muted">Couldn&apos;t load reviews.</p>;
  if (reviews.length === 0) return <EmptyState title="No reviews yet" hint="Be the first to order and review." />;

  return (
    <div className="space-y-3">
      {reviews.map((r) => (
        <div key={r.id} className="rounded-card border border-line bg-bg-soft p-4">
          <div className="flex items-center gap-3">
            <Avatar src={r.user?.avatar} name={r.user?.name ?? "User"} size={36} />
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium">{r.user?.name ?? "Customer"}</p>
              <p className="text-xs text-muted">{timeAgo(r.created_at)}</p>
            </div>
            <Stars value={r.rating} />
          </div>
          {r.review && <p className="mt-2 text-sm text-content">{r.review}</p>}
          {r.vendor_reply && (
            <div className="mt-3 rounded-lg border-l-2 border-brand bg-surface p-3">
              <p className="text-xs font-semibold text-brand">Owner&apos;s reply</p>
              <p className="text-sm text-content">{r.vendor_reply}</p>
            </div>
          )}
        </div>
      ))}
      {hasNextPage && (
        <div className="flex justify-center">
          <Button variant="secondary" size="sm" onClick={() => fetchNextPage()} loading={isFetchingNextPage}>
            More reviews
          </Button>
        </div>
      )}
    </div>
  );
}
