"use client";

import { PageHeader } from "@/components/ui/PageHeader";
import { Button } from "@/components/ui/Button";
import { Skeleton } from "@/components/ui/Skeleton";
import { EmptyState, ErrorState } from "@/components/ui/States";
import { cn } from "@/lib/cn";
import { money, timeAgo } from "@/lib/format";
import { useUpdateOrderStatus, useVendorOrderDetail, useVendorOrders } from "@/lib/hooks/use-vendor-admin";
import { toast } from "@/lib/toast-store";
import type { Order } from "@/lib/types";
import { ChevronDown } from "lucide-react";
import { useState } from "react";

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
              <VendorOrderCard key={o.id} order={o} advancing={updateStatus.isPending} onAdvance={advance} />
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

function VendorOrderCard({ order: o, advancing, onAdvance }: { order: Order; advancing: boolean; onAdvance: (id: number, status: string) => void }) {
  const [open, setOpen] = useState(false);
  const detail = useVendorOrderDetail(open ? o.id : null);

  return (
    <div className="rounded-card border border-line bg-bg-soft p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="font-medium">{o.order_number}</p>
          <p className="text-xs text-muted">
            {timeAgo(o.created_at)} · {o.payment_method.toUpperCase()}
            {o.customer ? ` · @${o.customer.username}` : ""}
          </p>
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
            <Button key={a.status} size="sm" variant={a.variant} loading={advancing} onClick={() => onAdvance(o.id, a.status)}>
              {a.label}
            </Button>
          ))}
        </div>
      </div>

      <button onClick={() => setOpen((v) => !v)} className="mt-2 flex items-center gap-1 text-xs text-muted hover:text-content">
        <ChevronDown className={cn("h-3.5 w-3.5 transition-transform", open && "rotate-180")} /> Timeline
      </button>
      {open && (
        <ol className="mt-2 space-y-2 border-t border-line pt-3">
          {detail.isLoading && <li className="text-xs text-muted">Loading…</li>}
          {detail.data?.status_history?.length === 0 && <li className="text-xs text-muted">No history.</li>}
          {detail.data?.status_history?.map((h, i) => (
            <li key={i} className="flex items-start gap-2 text-xs">
              <span className="mt-1 h-2 w-2 shrink-0 rounded-full bg-brand" />
              <div>
                <span className="font-medium capitalize text-content">{h.status.replace(/_/g, " ")}</span>
                {h.note && <span className="text-muted"> — {h.note}</span>}
                <span className="block text-muted">{timeAgo(h.at)}</span>
              </div>
            </li>
          ))}
        </ol>
      )}
    </div>
  );
}
