"use client";

import { RateOrderDialog } from "@/components/orders/RateOrderDialog";
import { Button } from "@/components/ui/Button";
import { PageHeader } from "@/components/ui/PageHeader";
import { Stars } from "@/components/ui/Stars";
import { EmptyState, ErrorState } from "@/components/ui/States";
import { Skeleton } from "@/components/ui/Skeleton";
import { ApiError } from "@/lib/api";
import { cn } from "@/lib/cn";
import { money, timeAgo } from "@/lib/format";
import { useReorder } from "@/lib/hooks/use-favorites";
import { useOrders, usePayOrder } from "@/lib/hooks/use-orders";
import { toast } from "@/lib/toast-store";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

const TERMINAL = ["delivered", "cancelled", "rejected"];

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
  const router = useRouter();
  const { data, isLoading, isError, refetch, fetchNextPage, hasNextPage, isFetchingNextPage } = useOrders();
  const orders = data?.pages.flatMap((p) => p.data) ?? [];
  const [rating, setRating] = useState<{ id: number; vendor: string } | null>(null);
  const reorder = useReorder();
  const pay = usePayOrder();
  const [payingId, setPayingId] = useState<number | null>(null);

  const doReorder = async (orderId: number) => {
    try {
      const res = await reorder.mutateAsync(orderId);
      toast.success(`Reorder placed — ${res.data.order_number}`);
      router.refresh();
    } catch (e) {
      toast.error(e instanceof ApiError ? e.message : "Could not reorder.");
    }
  };

  const doPay = async (orderId: number) => {
    setPayingId(orderId);
    try {
      await pay.mutateAsync(orderId);
      toast.success("Payment successful.");
    } catch (e) {
      toast.error(e instanceof ApiError ? e.message : "Payment failed.");
    } finally {
      setPayingId(null);
    }
  };

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
                  <Link href={`/orders/${o.id}`} className="min-w-0 hover:opacity-80">
                    <p className="font-medium">{o.vendor?.name ?? "Restaurant"}</p>
                    <p className="text-xs text-muted">
                      {o.order_number} · {timeAgo(o.created_at)}
                    </p>
                  </Link>
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

                {o.payment_method !== "cod" && (
                  <div className="mt-3 flex items-center justify-between gap-2 border-t border-line pt-3">
                    {o.payment_status === "paid" ? (
                      <span className="text-xs font-medium text-success">✓ Paid online</span>
                    ) : o.payment_status === "refunded" ? (
                      <span className="text-xs font-medium text-muted">Refunded</span>
                    ) : (
                      <span className="text-xs font-medium text-warning">Awaiting payment</span>
                    )}
                    {o.payable && (
                      <Button size="sm" loading={payingId === o.id} onClick={() => doPay(o.id)}>
                        Pay {money(o.total)}
                      </Button>
                    )}
                  </div>
                )}

                {TERMINAL.includes(o.status) && (
                  <div className="mt-3 flex items-center justify-between gap-2 border-t border-line pt-3">
                    {o.status === "delivered" && o.rating ? (
                      <div className="flex items-center gap-2">
                        <Stars value={o.rating.rating} />
                        <span className="text-xs text-muted">Your rating</span>
                      </div>
                    ) : o.status === "delivered" ? (
                      <Button size="sm" variant="secondary" onClick={() => setRating({ id: o.id, vendor: o.vendor?.name ?? "this order" })}>
                        Rate order
                      </Button>
                    ) : (
                      <span />
                    )}
                    <Button size="sm" loading={reorder.isPending} onClick={() => doReorder(o.id)}>
                      Reorder
                    </Button>
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
