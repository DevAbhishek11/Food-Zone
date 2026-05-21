"use client";

import { RateOrderDialog } from "@/components/orders/RateOrderDialog";
import { Button } from "@/components/ui/Button";
import { PageHeader } from "@/components/ui/PageHeader";
import { Stars } from "@/components/ui/Stars";
import { EmptyState, ErrorState } from "@/components/ui/States";
import { Skeleton } from "@/components/ui/Skeleton";
import { cn } from "@/lib/cn";
import { money, timeAgo } from "@/lib/format";
import { useOrders } from "@/lib/hooks/use-orders";
import Link from "next/link";
import { useState } from "react";

const STATUS_STYLE: Record<string, string> = {
  pending: "bg-warning/15 text-warning",
  accepted: "bg-info/15 text-info",
  preparing: "bg-info/15 text-info",
  ready: "bg-info/15 text-info",
  out_for_delivery: "bg-info/15 text-info",
  delivered: "bg-success/15 text-success",
  cancelled: "bg-danger/15 text-danger",
  rejected: "bg-danger/15 text-danger",
};

export default function OrdersPage() {
  const { data, isLoading, isError, refetch, fetchNextPage, hasNextPage, isFetchingNextPage } = useOrders();
  const orders = data?.pages.flatMap((p) => p.data) ?? [];
  const [rating, setRating] = useState<{ id: number; vendor: string } | null>(null);

  return (
    <>
      <PageHeader title="My Orders" subtitle="Track and revisit your orders" />

      <div className="mx-auto w-full max-w-2xl space-y-3 p-4">
        {isLoading ? (
          Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-24 rounded-card" />)
        ) : isError ? (
          <ErrorState message="Couldn't load your orders." onRetry={() => refetch()} />
        ) : orders.length === 0 ? (
          <EmptyState title="No orders yet" hint="Browse restaurants and place your first order." />
        ) : (
          <>
            {orders.map((o) => (
              <div key={o.id} className="rounded-card border border-line bg-bg-soft p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="font-medium">{o.vendor?.name ?? "Restaurant"}</p>
                    <p className="text-xs text-muted">
                      {o.order_number} · {timeAgo(o.created_at)}
                    </p>
                  </div>
                  <span className={cn("rounded-full px-2.5 py-1 text-xs font-medium capitalize", STATUS_STYLE[o.status] ?? "bg-surface text-muted")}>
                    {o.status.replace(/_/g, " ")}
                  </span>
                </div>
                <div className="mt-3 flex items-center justify-between border-t border-line pt-3 text-sm">
                  <span className="text-muted">
                    {o.items?.length ?? 0} item(s) · {o.payment_method.toUpperCase()}
                  </span>
                  <span className="font-semibold">{money(o.total)}</span>
                </div>

                {o.status === "delivered" && (
                  <div className="mt-3 flex items-center justify-between border-t border-line pt-3">
                    {o.rating ? (
                      <div className="flex items-center gap-2">
                        <Stars value={o.rating.rating} />
                        <span className="text-xs text-muted">Your rating</span>
                      </div>
                    ) : (
                      <Button size="sm" variant="secondary" onClick={() => setRating({ id: o.id, vendor: o.vendor?.name ?? "this order" })}>
                        Rate order
                      </Button>
                    )}
                  </div>
                )}
              </div>
            ))}
            {hasNextPage && (
              <div className="flex justify-center">
                <Button variant="secondary" onClick={() => fetchNextPage()} loading={isFetchingNextPage}>
                  Load more
                </Button>
              </div>
            )}
          </>
        )}
        <p className="pt-2 text-center text-xs text-muted">
          Looking to order?{" "}
          <Link href="/vendors" className="text-brand hover:underline">
            Browse restaurants
          </Link>
        </p>
      </div>

      {rating && (
        <RateOrderDialog orderId={rating.id} vendorName={rating.vendor} onClose={() => setRating(null)} />
      )}
    </>
  );
}
