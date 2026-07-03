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
  const { approve, reject } = useVendorModeration();
  const [rejecting, setRejecting] = useState(false);
  const [reason, setReason] = useState("");

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
