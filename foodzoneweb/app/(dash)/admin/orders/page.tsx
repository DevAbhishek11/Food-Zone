"use client";

import { Button } from "@/components/ui/Button";
import { PageHeader } from "@/components/ui/PageHeader";
import { Skeleton } from "@/components/ui/Skeleton";
import { EmptyState, ErrorState } from "@/components/ui/States";
import { ApiError } from "@/lib/api";
import { cn } from "@/lib/cn";
import { exportCsv } from "@/lib/csv";
import { money, timeAgo } from "@/lib/format";
import { useAdminOrderActions, useAdminOrders } from "@/lib/hooks/use-admin";
import { toast } from "@/lib/toast-store";
import type { Order } from "@/lib/types";
import { Download, MoreHorizontal, Search } from "lucide-react";
import { useState } from "react";

const STATUSES = ["", "pending", "accepted", "preparing", "ready", "out_for_delivery", "delivered", "cancelled", "rejected"];
const STATUS_STYLE: Record<string, string> = {
  pending: "bg-warning/15 text-warning",
  delivered: "bg-success/15 text-success",
  cancelled: "bg-danger/15 text-danger",
  rejected: "bg-danger/15 text-danger",
};

export default function AdminOrdersPage() {
  const [status, setStatus] = useState("");
  const [q, setQ] = useState("");
  const { data, isLoading, isError, refetch, fetchNextPage, hasNextPage, isFetchingNextPage } =
    useAdminOrders({ status: status || undefined, q: q || undefined });
  const orders = data?.pages.flatMap((p) => p.data) ?? [];
  const [managing, setManaging] = useState<Order | null>(null);

  const exportRows = () =>
    exportCsv(
      `orders-${new Date().toISOString().slice(0, 10)}`,
      orders.map((o) => ({
        order_number: o.order_number,
        status: o.status,
        vendor: o.vendor?.name ?? "",
        customer: o.customer?.username ?? "",
        total: o.total,
        payment: o.payment_method,
        payment_status: o.payment_status,
        placed: o.created_at,
      })),
    );

  return (
    <>
      <PageHeader
        title="Orders"
        subtitle="Platform-wide order monitoring"
        action={
          <Button size="sm" variant="secondary" onClick={exportRows} disabled={orders.length === 0}>
            <Download className="h-4 w-4" /> CSV
          </Button>
        }
      />

      <div className="mx-auto w-full max-w-5xl space-y-4 p-4 md:p-6">
        <div className="flex flex-col gap-3 sm:flex-row">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search order number…"
              className="h-10 w-full rounded-lg border border-line bg-bg-soft pl-9 pr-3 text-sm focus:outline-none focus:ring-2 focus:ring-brand/60"
            />
          </div>
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            className="h-10 rounded-lg border border-line bg-bg-soft px-3 text-sm capitalize focus:outline-none focus:ring-2 focus:ring-brand/60"
          >
            {STATUSES.map((s) => (
              <option key={s || "all"} value={s}>{s ? s.replace(/_/g, " ") : "All statuses"}</option>
            ))}
          </select>
        </div>

        {isLoading ? (
          Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-14 rounded-lg" />)
        ) : isError ? (
          <ErrorState message="Couldn't load orders. Admins only." onRetry={() => refetch()} />
        ) : orders.length === 0 ? (
          <EmptyState title="No orders found" />
        ) : (
          <div className="overflow-x-auto rounded-card border border-line">
            <table className="w-full min-w-[780px] text-sm">
              <thead className="bg-bg-soft text-left text-xs text-muted">
                <tr>
                  <th className="px-3 py-2 font-medium">Order</th>
                  <th className="px-3 py-2 font-medium">Vendor</th>
                  <th className="px-3 py-2 font-medium">Customer</th>
                  <th className="px-3 py-2 font-medium">Total</th>
                  <th className="px-3 py-2 font-medium">Payment</th>
                  <th className="px-3 py-2 font-medium">Status</th>
                  <th className="px-3 py-2 font-medium">Placed</th>
                  <th className="px-3 py-2 font-medium" />
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {orders.map((o) => (
                  <tr key={o.id} className="hover:bg-surface/50">
                    <td className="px-3 py-2 font-medium">{o.order_number}</td>
                    <td className="px-3 py-2 text-muted">{o.vendor?.name ?? "—"}</td>
                    <td className="px-3 py-2 text-muted">@{o.customer?.username ?? "—"}</td>
                    <td className="px-3 py-2 font-medium">{money(o.total)}</td>
                    <td className="px-3 py-2 text-muted">
                      {o.payment_method.toUpperCase()} · {o.payment_status}
                    </td>
                    <td className="px-3 py-2">
                      <span className={cn("rounded-full px-2 py-0.5 text-xs font-medium capitalize", STATUS_STYLE[o.status] ?? "bg-info/15 text-info")}>
                        {o.status.replace(/_/g, " ")}
                      </span>
                    </td>
                    <td className="px-3 py-2 text-xs text-muted">{timeAgo(o.created_at)}</td>
                    <td className="px-3 py-2 text-right">
                      <button
                        onClick={() => setManaging(o)}
                        aria-label="Manage order"
                        className="rounded-lg p-1.5 text-muted transition-colors hover:bg-surface hover:text-content"
                      >
                        <MoreHorizontal className="h-4 w-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {hasNextPage && (
          <div className="flex justify-center">
            <Button variant="secondary" onClick={() => fetchNextPage()} loading={isFetchingNextPage}>Load more</Button>
          </div>
        )}
      </div>

      {managing && <ManageOrderDialog order={managing} onClose={() => setManaging(null)} />}
    </>
  );
}

function ManageOrderDialog({ order, onClose }: { order: Order; onClose: () => void }) {
  const { setStatus, refund } = useAdminOrderActions();
  const [nextStatus, setNextStatus] = useState(order.status);
  const [reason, setReason] = useState("");
  const [amount, setAmount] = useState("");
  const [showRefund, setShowRefund] = useState(false);

  const canRefund = order.payment_status === "paid";

  const applyStatus = async () => {
    if (nextStatus === order.status) return;
    try {
      await setStatus.mutateAsync({ id: order.id, status: nextStatus });
      toast.success(`Order moved to ${nextStatus.replace(/_/g, " ")}.`);
      onClose();
    } catch (e) {
      toast.error(e instanceof ApiError ? e.message : "Could not update status.");
    }
  };

  const issueRefund = async () => {
    if (!reason.trim()) {
      toast.error("A refund reason is required.");
      return;
    }
    const parsedAmount = amount.trim() ? Number(amount) : undefined;
    if (parsedAmount !== undefined && (Number.isNaN(parsedAmount) || parsedAmount <= 0)) {
      toast.error("Enter a valid refund amount.");
      return;
    }
    try {
      await refund.mutateAsync({ id: order.id, reason: reason.trim(), amount: parsedAmount });
      toast.success("Refund processed.");
      onClose();
    } catch (e) {
      toast.error(e instanceof ApiError ? e.message : "Could not process refund.");
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4" onClick={onClose}>
      <div className="w-full max-w-sm rounded-2xl border border-line bg-bg-soft p-6" onClick={(e) => e.stopPropagation()}>
        <h2 className="text-lg font-semibold">Manage {order.order_number}</h2>
        <p className="mt-0.5 text-sm text-muted">Dispute resolution — actions are audited.</p>

        <div className="mt-4 space-y-1.5">
          <label className="text-sm font-medium text-muted">Order status</label>
          <div className="flex gap-2">
            <select
              value={nextStatus}
              onChange={(e) => setNextStatus(e.target.value)}
              className="h-10 flex-1 rounded-lg border border-line bg-bg px-3 text-sm capitalize focus:outline-none focus:ring-2 focus:ring-brand/60"
            >
              {STATUSES.filter((s) => s).map((s) => (
                <option key={s} value={s}>{s.replace(/_/g, " ")}</option>
              ))}
            </select>
            <Button size="sm" loading={setStatus.isPending} disabled={nextStatus === order.status} onClick={applyStatus}>
              Apply
            </Button>
          </div>
          <p className="text-xs text-text-tertiary">Admin overrides bypass normal transition rules.</p>
        </div>

        <div className="mt-5 border-t border-line pt-4">
          {!canRefund ? (
            <p className="text-sm text-muted">No captured payment on this order — nothing to refund.</p>
          ) : !showRefund ? (
            <Button size="sm" variant="danger" onClick={() => setShowRefund(true)}>
              Issue refund
            </Button>
          ) : (
            <div className="space-y-2">
              <label className="text-sm font-medium text-muted">Refund reason (required)</label>
              <textarea
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                rows={2}
                maxLength={500}
                placeholder="Why is this order being refunded?"
                className="w-full resize-none rounded-lg border border-line bg-bg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand/60"
              />
              <label className="text-sm font-medium text-muted">Amount (optional — full {money(order.total)} if blank)</label>
              <input
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                inputMode="decimal"
                placeholder={String(order.total)}
                className="h-9 w-full rounded-lg border border-line bg-bg px-3 text-sm focus:outline-none focus:ring-2 focus:ring-brand/60"
              />
              <div className="flex justify-end gap-2 pt-1">
                <Button size="sm" variant="ghost" onClick={() => setShowRefund(false)}>Cancel</Button>
                <Button size="sm" variant="danger" loading={refund.isPending} onClick={issueRefund}>
                  Confirm refund
                </Button>
              </div>
            </div>
          )}
        </div>

        <button onClick={onClose} className="mt-5 w-full rounded-lg py-2 text-center text-sm text-muted hover:bg-surface hover:text-content">
          Close
        </button>
      </div>
    </div>
  );
}
