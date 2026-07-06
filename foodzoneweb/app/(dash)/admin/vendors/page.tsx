"use client";

import { Button } from "@/components/ui/Button";
import { PageHeader } from "@/components/ui/PageHeader";
import { Skeleton } from "@/components/ui/Skeleton";
import { EmptyState, ErrorState } from "@/components/ui/States";
import { cn } from "@/lib/cn";
import { useAdminVendors, useVendorModeration } from "@/lib/hooks/use-admin";
import { toast } from "@/lib/toast-store";
import type { Vendor } from "@/lib/types";
import { useState } from "react";

const STATUS_STYLE: Record<string, string> = {
  pending: "bg-warning/15 text-warning",
  approved: "bg-success/15 text-success",
  rejected: "bg-danger/15 text-danger",
  suspended: "bg-surface text-muted",
};

export default function AdminVendorsPage() {
  const [status, setStatus] = useState("pending");
  const { data, isLoading, isError, refetch, fetchNextPage, hasNextPage, isFetchingNextPage } = useAdminVendors(status || undefined);
  const vendors = data?.pages.flatMap((p) => p.data) ?? [];

  return (
    <>
      <PageHeader title="Vendors" subtitle="Review and approve stores" />

      <div className="mx-auto w-full max-w-3xl space-y-4 p-4 md:p-6">
        <div className="flex gap-2 overflow-x-auto">
          {["pending", "approved", "rejected", ""].map((s) => (
            <button
              key={s || "all"}
              onClick={() => setStatus(s)}
              className={cn(
                "whitespace-nowrap rounded-full border px-3 py-1 text-sm capitalize",
                status === s ? "border-brand bg-brand/15 text-brand" : "border-line text-muted hover:text-content",
              )}
            >
              {s || "all"}
            </button>
          ))}
        </div>

        {isLoading ? (
          Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-24 rounded-card" />)
        ) : isError ? (
          <ErrorState message="Couldn't load vendors. Admins only." onRetry={() => refetch()} />
        ) : vendors.length === 0 ? (
          <EmptyState title="Nothing here" hint="No vendors match this filter." />
        ) : (
          <>
            {vendors.map((v) => <VendorRow key={v.id} vendor={v} statusStyle={STATUS_STYLE[v.status] ?? ""} />)}
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

function VendorRow({ vendor, statusStyle }: { vendor: Vendor; statusStyle: string }) {
  const { approve, reject, update } = useVendorModeration();
  const [rejecting, setRejecting] = useState(false);
  const [reason, setReason] = useState("");
  const [editingRate, setEditingRate] = useState(false);
  const [rate, setRate] = useState(String(vendor.commission_rate));

  const patch = async (fields: { commission_rate?: number; is_featured?: boolean; is_open?: boolean }, okMsg: string) => {
    try {
      await update.mutateAsync({ id: vendor.id, ...fields });
      toast.success(okMsg);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Update failed.");
    }
  };

  const saveRate = async () => {
    const value = Number(rate);
    if (Number.isNaN(value) || value < 0 || value > 50) {
      toast.error("Commission must be between 0 and 50%.");
      return;
    }
    await patch({ commission_rate: value }, `Commission set to ${value}%`);
    setEditingRate(false);
  };

  const doApprove = async () => {
    try {
      await approve.mutateAsync(vendor.id);
      toast.success("Vendor approved");
    } catch {
      toast.error("Could not approve.");
    }
  };

  const doReject = async () => {
    if (!reason.trim()) {
      toast.error("Provide a rejection reason.");
      return;
    }
    try {
      await reject.mutateAsync({ id: vendor.id, reason: reason.trim() });
      toast.success("Vendor rejected");
      setRejecting(false);
      setReason("");
    } catch {
      toast.error("Could not reject.");
    }
  };

  return (
    <div className="rounded-card border border-line bg-bg-soft p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="truncate font-medium">{vendor.name}</p>
          <p className="truncate text-xs text-muted">{vendor.city ?? "—"} · {vendor.slug}</p>
          {vendor.description && <p className="mt-1 line-clamp-2 text-sm text-muted">{vendor.description}</p>}
        </div>
        <span className={cn("rounded-full px-2 py-0.5 text-xs font-medium capitalize", statusStyle)}>{vendor.status}</span>
      </div>

      {vendor.status === "approved" && (
        <div className="mt-3 flex flex-wrap items-center gap-2 border-t border-line pt-3">
          {/* Commission */}
          {editingRate ? (
            <span className="flex items-center gap-1.5">
              <input
                value={rate}
                onChange={(e) => setRate(e.target.value)}
                inputMode="decimal"
                className="h-8 w-16 rounded-lg border border-line bg-bg px-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand/60"
                aria-label="Commission rate %"
              />
              <Button size="xs" loading={update.isPending} onClick={saveRate}>Save</Button>
              <Button size="xs" variant="ghost" onClick={() => { setEditingRate(false); setRate(String(vendor.commission_rate)); }}>Cancel</Button>
            </span>
          ) : (
            <button
              onClick={() => setEditingRate(true)}
              className="rounded-full border border-line px-3 py-1 text-xs text-muted transition-colors hover:border-brand/40 hover:text-content"
            >
              Commission: <span className="font-semibold text-content">{vendor.commission_rate}%</span>
            </button>
          )}

          {/* Featured toggle */}
          <button
            onClick={() => patch({ is_featured: !vendor.is_featured }, vendor.is_featured ? "Removed from featured" : "Featured on homepage")}
            aria-pressed={vendor.is_featured}
            className={cn(
              "rounded-full border px-3 py-1 text-xs transition-colors",
              vendor.is_featured ? "border-brand/50 bg-brand/15 text-brand" : "border-line text-muted hover:text-content",
            )}
          >
            ★ Featured
          </button>

          {/* Force open/close */}
          <button
            onClick={() => patch({ is_open: !vendor.is_open }, vendor.is_open ? "Store force-closed" : "Store reopened")}
            aria-pressed={vendor.is_open}
            className={cn(
              "ml-auto rounded-full border px-3 py-1 text-xs transition-colors",
              vendor.is_open ? "border-success/50 bg-success/10 text-success" : "border-danger/50 bg-danger/10 text-danger",
            )}
          >
            {vendor.is_open ? "● Open" : "● Closed"}
          </button>
        </div>
      )}

      {vendor.status === "pending" && (
        <div className="mt-3 border-t border-line pt-3">
          {rejecting ? (
            <div className="flex gap-2">
              <input
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="Reason for rejection…"
                className="h-9 flex-1 rounded-lg border border-line bg-bg px-3 text-sm focus:outline-none focus:ring-2 focus:ring-brand/60"
              />
              <Button size="sm" variant="danger" loading={reject.isPending} onClick={doReject}>Confirm</Button>
              <Button size="sm" variant="ghost" onClick={() => setRejecting(false)}>Cancel</Button>
            </div>
          ) : (
            <div className="flex justify-end gap-2">
              <Button size="sm" variant="secondary" onClick={() => setRejecting(true)}>Reject</Button>
              <Button size="sm" loading={approve.isPending} onClick={doApprove}>Approve</Button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
