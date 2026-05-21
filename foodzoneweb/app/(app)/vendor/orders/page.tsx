"use client";

import { PageHeader } from "@/components/ui/PageHeader";
import { Button } from "@/components/ui/Button";
import { Skeleton } from "@/components/ui/Skeleton";
import { EmptyState, ErrorState } from "@/components/ui/States";
import { VendorNav } from "@/components/vendor/VendorNav";
import { cn } from "@/lib/cn";
import { money, timeAgo } from "@/lib/format";
import { useUpdateOrderStatus, useVendorOrders } from "@/lib/hooks/use-vendor-admin";
import { toast } from "@/lib/toast-store";

type Action = { label: string; status: string; variant: "primary" | "secondary" | "danger" };

const NEXT_ACTIONS: Record<string, Action[]> = {
  pending: [
    { label: "Accept", status: "accepted", variant: "primary" },
    { label: "Reject", status: "rejected", variant: "danger" },
  ],
  accepted: [{ label: "Start preparing", status: "preparing", variant: "primary" }],
  preparing: [{ label: "Mark ready", status: "ready", variant: "primary" }],
  ready: [
    { label: "Out for delivery", status: "out_for_delivery", variant: "primary" },
    { label: "Delivered", status: "delivered", variant: "secondary" },
  ],
  out_for_delivery: [{ label: "Mark delivered", status: "delivered", variant: "primary" }],
};

const STATUS_STYLE: Record<string, string> = {
  pending: "bg-warning/15 text-warning",
  delivered: "bg-success/15 text-success",
  cancelled: "bg-danger/15 text-danger",
  rejected: "bg-danger/15 text-danger",
};

export default function VendorOrdersPage() {
  const { data, isLoading, isError, refetch, fetchNextPage, hasNextPage, isFetchingNextPage } = useVendorOrders();
  const updateStatus = useUpdateOrderStatus();
  const orders = data?.pages.flatMap((p) => p.data) ?? [];

  const advance = async (orderId: number, status: string) => {
    try {
      await updateStatus.mutateAsync({ orderId, status });
      toast.success(`Order marked ${status.replace(/_/g, " ")}`);
    } catch {
      toast.error("Could not update order.");
    }
  };

  return (
    <>
      <PageHeader title="Incoming Orders" subtitle="Manage and fulfil orders" />
      <VendorNav />

      <div className="mx-auto w-full max-w-3xl space-y-3 p-4 md:p-6">
        {isLoading ? (
          Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-32 rounded-card" />)
        ) : isError ? (
          <ErrorState message="Couldn't load orders." onRetry={() => refetch()} />
        ) : orders.length === 0 ? (
          <EmptyState title="No orders yet" hint="New orders will appear here." />
        ) : (
          <>
            {orders.map((o) => (
              <div key={o.id} className="rounded-card border border-line bg-bg-soft p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-medium">{o.order_number}</p>
                    <p className="text-xs text-muted">{timeAgo(o.created_at)} · {o.payment_method.toUpperCase()}</p>
                  </div>
                  <span className={cn("rounded-full px-2.5 py-1 text-xs font-medium capitalize", STATUS_STYLE[o.status] ?? "bg-info/15 text-info")}>
                    {o.status.replace(/_/g, " ")}
                  </span>
                </div>

                {o.items && o.items.length > 0 && (
                  <ul className="mt-3 space-y-1 border-t border-line pt-3 text-sm text-muted">
                    {o.items.map((it) => (
                      <li key={it.id} className="flex justify-between">
                        <span>{it.quantity}× {it.item_name}</span>
                        <span>{money(it.line_total)}</span>
                      </li>
                    ))}
                  </ul>
                )}

                <div className="mt-3 flex items-center justify-between border-t border-line pt-3">
                  <span className="font-semibold">{money(o.total)}</span>
                  <div className="flex gap-2">
                    {(NEXT_ACTIONS[o.status] ?? []).map((a) => (
                      <Button key={a.status} size="sm" variant={a.variant} loading={updateStatus.isPending} onClick={() => advance(o.id, a.status)}>
                        {a.label}
                      </Button>
                    ))}
                  </div>
                </div>
              </div>
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
