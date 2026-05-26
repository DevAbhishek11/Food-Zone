"use client";

import { PageHeader } from "@/components/ui/PageHeader";
import { ErrorState } from "@/components/ui/States";
import { Skeleton } from "@/components/ui/Skeleton";
import { cn } from "@/lib/cn";
import { money } from "@/lib/format";
import { useOrder } from "@/lib/hooks/use-orders";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { useParams } from "next/navigation";

const STATUS_LABEL: Record<string, string> = {
  pending: "Order placed",
  accepted: "Accepted by restaurant",
  preparing: "Preparing",
  ready: "Ready for pickup",
  out_for_delivery: "Out for delivery",
  delivered: "Delivered",
  cancelled: "Cancelled",
  rejected: "Rejected",
};

function fmt(dt: string) {
  return new Date(dt).toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" });
}

export default function OrderDetailPage() {
  const params = useParams<{ id: string }>();
  const { data: order, isLoading, isError, refetch } = useOrder(Number(params.id));

  return (
    <>
      <PageHeader title="Order details" />
      <div className="mx-auto w-full max-w-2xl space-y-4 p-4">
        <Link href="/orders" className="inline-flex items-center gap-1 text-sm text-muted hover:text-content">
          <ArrowLeft className="h-4 w-4" /> All orders
        </Link>

        {isLoading ? (
          <>
            <Skeleton className="h-24 rounded-card" />
            <Skeleton className="h-48 rounded-card" />
          </>
        ) : isError || !order ? (
          <ErrorState message="Couldn't load this order." onRetry={() => refetch()} />
        ) : (
          <>
            <div className="rounded-card border border-line bg-bg-soft p-4">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-lg font-semibold">{order.vendor?.name ?? "Restaurant"}</p>
                  <p className="text-xs text-muted">{order.order_number}</p>
                </div>
                <span className="rounded-full bg-surface px-2.5 py-1 text-xs font-medium capitalize text-muted">
                  {order.status.replace(/_/g, " ")}
                </span>
              </div>
              {order.delivery_partner && (
                <p className="mt-2 text-sm text-muted">Delivery partner: {order.delivery_partner.name}</p>
              )}
            </div>

            {/* Items */}
            <div className="rounded-card border border-line bg-bg-soft p-4">
              <h2 className="mb-3 text-sm font-semibold">Items</h2>
              <ul className="space-y-2 text-sm">
                {order.items?.map((it) => (
                  <li key={it.id} className="flex justify-between gap-3">
                    <span className="min-w-0">
                      {it.quantity}× {it.item_name}
                      {it.customizations && (
                        <span className="block truncate text-xs text-muted">{customizationLabel(it.customizations)}</span>
                      )}
                    </span>
                    <span className="text-muted">{money(it.line_total)}</span>
                  </li>
                ))}
              </ul>
              <div className="mt-3 space-y-1 border-t border-line pt-3 text-sm">
                <Row label="Subtotal" value={money(order.subtotal)} />
                {order.discount > 0 && <Row label="Discount" value={`−${money(order.discount)}`} />}
                <Row label="Delivery" value={order.delivery_charge > 0 ? money(order.delivery_charge) : "Free"} />
                <Row label="Total" value={money(order.total)} bold />
                <Row label="Payment" value={`${order.payment_method.toUpperCase()} · ${order.payment_status}`} />
              </div>
            </div>

            {/* Timeline */}
            {order.status_history && order.status_history.length > 0 && (
              <div className="rounded-card border border-line bg-bg-soft p-4">
                <h2 className="mb-4 text-sm font-semibold">Order timeline</h2>
                <ol className="relative ml-2 border-l border-line">
                  {order.status_history.map((h, i) => (
                    <li key={i} className="mb-5 ml-4 last:mb-0">
                      <span
                        className={cn(
                          "absolute -left-[7px] mt-1 h-3 w-3 rounded-full border-2 border-bg-soft",
                          i === 0 ? "bg-brand" : "bg-line",
                        )}
                      />
                      <p className="text-sm font-medium">{STATUS_LABEL[h.status] ?? h.status}</p>
                      <p className="text-xs text-muted">{fmt(h.at)}</p>
                      {h.note && <p className="text-xs text-muted">{h.note}</p>}
                    </li>
                  ))}
                </ol>
              </div>
            )}
          </>
        )}
      </div>
    </>
  );
}

function customizationLabel(c: Record<string, unknown>): string {
  const parts: string[] = [];
  const variant = c.variant as { name?: string } | undefined;
  if (variant?.name) parts.push(variant.name);
  const addons = c.addons as { name?: string }[] | undefined;
  if (Array.isArray(addons)) parts.push(...addons.map((a) => a.name).filter(Boolean) as string[]);
  return parts.join(" · ");
}

function Row({ label, value, bold }: { label: string; value: string; bold?: boolean }) {
  return (
    <div className={`flex justify-between ${bold ? "font-semibold text-content" : "text-muted"}`}>
      <span>{label}</span>
      <span>{value}</span>
    </div>
  );
}
