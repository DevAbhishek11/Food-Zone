"use client";

import { AdminNav } from "@/components/admin/AdminNav";
import { Button } from "@/components/ui/Button";
import { PageHeader } from "@/components/ui/PageHeader";
import { Skeleton } from "@/components/ui/Skeleton";
import { EmptyState, ErrorState } from "@/components/ui/States";
import { cn } from "@/lib/cn";
import { exportCsv } from "@/lib/csv";
import { money, timeAgo } from "@/lib/format";
import { useAdminOrders } from "@/lib/hooks/use-admin";
import { Download, Search } from "lucide-react";
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
      <AdminNav />

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
            <table className="w-full min-w-[720px] text-sm">
              <thead className="bg-bg-soft text-left text-xs text-muted">
                <tr>
                  <th className="px-3 py-2 font-medium">Order</th>
                  <th className="px-3 py-2 font-medium">Vendor</th>
                  <th className="px-3 py-2 font-medium">Customer</th>
                  <th className="px-3 py-2 font-medium">Total</th>
                  <th className="px-3 py-2 font-medium">Payment</th>
                  <th className="px-3 py-2 font-medium">Status</th>
                  <th className="px-3 py-2 font-medium">Placed</th>
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
    </>
  );
}
