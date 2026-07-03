"use client";

import { cn } from "@/lib/cn";
import { useToggleStoreOpen, useVendorStats } from "@/lib/hooks/use-vendor-admin";
import { toast } from "@/lib/toast-store";
import { Loader2 } from "lucide-react";

/** Always-visible store open/closed switch pinned in the vendor sidebar. */
export function StoreStatusCard() {
  const { data: stats } = useVendorStats();
  const toggle = useToggleStoreOpen();

  if (!stats) return null;

  const setOpen = async (is_open: boolean) => {
    try {
      await toggle.mutateAsync({ is_open });
      toast.success(is_open ? "Store is now open" : "Store is now closed");
    } catch {
      toast.error("Could not update store status.");
    }
  };

  return (
    <div className="rounded-xl border border-line bg-surface/50 p-3">
      <div className="flex items-center justify-between gap-2">
        <div className="min-w-0">
          <p className="flex items-center gap-1.5 text-sm font-medium">
            <span className={cn("h-2 w-2 rounded-full", stats.is_open ? "bg-success" : "bg-danger")} />
            {stats.is_open ? "Open" : "Closed"}
          </p>
          <p className="truncate text-xs text-muted">
            {stats.is_open ? "Accepting orders" : "Not accepting orders"}
          </p>
        </div>
        <button
          role="switch"
          aria-checked={stats.is_open}
          aria-label="Toggle store open"
          disabled={toggle.isPending}
          onClick={() => setOpen(!stats.is_open)}
          className={cn(
            "relative h-6 w-11 shrink-0 rounded-full transition-colors",
            stats.is_open ? "bg-success" : "bg-surface-2",
          )}
        >
          {toggle.isPending ? (
            <Loader2 className="absolute inset-0 m-auto h-3.5 w-3.5 animate-spin text-white" />
          ) : (
            <span
              className={cn(
                "absolute top-0.5 h-5 w-5 rounded-full bg-white shadow-sm transition-all",
                stats.is_open ? "left-[22px]" : "left-0.5",
              )}
            />
          )}
        </button>
      </div>
    </div>
  );
}
