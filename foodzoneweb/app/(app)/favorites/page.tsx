"use client";

import { Button } from "@/components/ui/Button";
import { PageHeader } from "@/components/ui/PageHeader";
import { EmptyState, ErrorState } from "@/components/ui/States";
import { Skeleton } from "@/components/ui/Skeleton";
import { VendorCard } from "@/components/vendors/VendorCard";
import { useFavorites } from "@/lib/hooks/use-favorites";
import Link from "next/link";

export default function FavoritesPage() {
  const { data, isLoading, isError, refetch, fetchNextPage, hasNextPage, isFetchingNextPage } = useFavorites();
  const vendors = data?.pages.flatMap((p) => p.data) ?? [];

  return (
    <>
      <PageHeader title="Saved" subtitle="Your favorite restaurants" />

      <div className="mx-auto w-full max-w-5xl space-y-5 p-4 md:p-6">
        {isLoading ? (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-56 rounded-card" />)}
          </div>
        ) : isError ? (
          <ErrorState message="Couldn't load your favorites." onRetry={() => refetch()} />
        ) : vendors.length === 0 ? (
          <EmptyState
            title="No saved restaurants yet"
            hint="Tap the heart on any restaurant to save it here."
          />
        ) : (
          <>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {vendors.map((v) => <VendorCard key={v.id} vendor={v} />)}
            </div>
            {hasNextPage && (
              <div className="flex justify-center">
                <Button variant="secondary" onClick={() => fetchNextPage()} loading={isFetchingNextPage}>Load more</Button>
              </div>
            )}
          </>
        )}

        <p className="pt-2 text-center text-xs text-muted">
          <Link href="/vendors" className="text-brand hover:underline">Browse all restaurants</Link>
        </p>
      </div>
    </>
  );
}
