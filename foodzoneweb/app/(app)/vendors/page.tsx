"use client";

import { Button } from "@/components/ui/Button";
import { PageHeader } from "@/components/ui/PageHeader";
import { EmptyState, ErrorState } from "@/components/ui/States";
import { Skeleton } from "@/components/ui/Skeleton";
import { VendorCard } from "@/components/vendors/VendorCard";
import { useVendors } from "@/lib/hooks/use-vendors";
import { Heart, Search } from "lucide-react";
import Link from "next/link";
import { useState } from "react";

export default function VendorsPage() {
  const [search, setSearch] = useState("");
  const [openNow, setOpenNow] = useState(false);
  const { data, isLoading, isError, refetch, fetchNextPage, hasNextPage, isFetchingNextPage } =
    useVendors({ q: search || undefined, open_now: openNow || undefined });

  const vendors = data?.pages.flatMap((p) => p.data) ?? [];

  return (
    <>
      <PageHeader
        title="Order Food"
        subtitle="Discover restaurants near you"
        action={
          <Link href="/favorites" className="flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm text-muted hover:bg-surface hover:text-content">
            <Heart className="h-4 w-4" /> Saved
          </Link>
        }
      />

      <div className="mx-auto w-full max-w-5xl space-y-5 p-4 md:p-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search restaurants…"
              className="h-10 w-full rounded-lg border border-line bg-bg-soft pl-9 pr-3 text-sm focus:outline-none focus:ring-2 focus:ring-brand/60"
            />
          </div>
          <label className="flex items-center gap-2 text-sm text-muted">
            <input
              type="checkbox"
              checked={openNow}
              onChange={(e) => setOpenNow(e.target.checked)}
              className="h-4 w-4 accent-brand"
            />
            Open now
          </label>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="h-56 rounded-card" />
            ))}
          </div>
        ) : isError ? (
          <ErrorState message="Couldn't load restaurants." onRetry={() => refetch()} />
        ) : vendors.length === 0 ? (
          <EmptyState title="No restaurants found" hint="Try a different search." />
        ) : (
          <>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {vendors.map((v) => (
                <VendorCard key={v.id} vendor={v} />
              ))}
            </div>
            {hasNextPage && (
              <div className="flex justify-center">
                <Button variant="secondary" onClick={() => fetchNextPage()} loading={isFetchingNextPage}>
                  Load more
                </Button>
              </div>
            )}
          </>
        )}
      </div>
    </>
  );
}
