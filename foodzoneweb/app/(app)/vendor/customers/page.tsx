"use client";

import { Avatar } from "@/components/ui/Avatar";
import { Button } from "@/components/ui/Button";
import { PageHeader } from "@/components/ui/PageHeader";
import { Skeleton } from "@/components/ui/Skeleton";
import { EmptyState, ErrorState } from "@/components/ui/States";
import { VendorNav } from "@/components/vendor/VendorNav";
import { ApiError } from "@/lib/api";
import { money, timeAgo } from "@/lib/format";
import { useToggleBlockCustomer, useVendorCustomers, useWarnCustomer } from "@/lib/hooks/use-vendor-dashboard";
import { toast } from "@/lib/toast-store";
import { useState } from "react";

export default function VendorCustomersPage() {
  const { data: customers, isLoading, isError, refetch } = useVendorCustomers();
  const warn = useWarnCustomer();
  const toggleBlock = useToggleBlockCustomer();
  const [warning, setWarning] = useState<{ userId: number; message: string } | null>(null);

  const sendWarning = async () => {
    if (!warning || !warning.message.trim()) return;
    try {
      await warn.mutateAsync({ userId: warning.userId, message: warning.message.trim() });
      toast.success("Warning sent.");
      setWarning(null);
    } catch (e) {
      toast.error(e instanceof ApiError ? e.message : "Could not send.");
    }
  };

  const onBlock = (userId: number, block: boolean) =>
    toggleBlock.mutate(
      { userId, block, reason: block ? "Repeated policy violation" : undefined },
      {
        onSuccess: () => toast.success(block ? "Customer blocked." : "Customer unblocked."),
        onError: (e) => toast.error(e instanceof ApiError ? e.message : "Failed."),
      },
    );

  return (
    <>
      <PageHeader title="Customers" subtitle="Anonymised — only your store's order history is shown" />
      <VendorNav />
      <div className="mx-auto w-full max-w-4xl space-y-2 p-4 md:p-6">
        {isLoading ? (
          Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-16 rounded-card" />)
        ) : isError ? (
          <ErrorState message="Couldn't load customers." onRetry={() => refetch()} />
        ) : (customers?.length ?? 0) === 0 ? (
          <EmptyState title="No customers yet" hint="They'll show up after their first order." />
        ) : (
          <table className="w-full overflow-hidden rounded-card border border-line bg-bg-soft text-sm">
            <thead className="border-b border-line text-xs uppercase text-muted">
              <tr>
                <th className="p-3 text-left">Customer</th>
                <th className="p-3 text-right">Orders</th>
                <th className="p-3 text-right">Total spend</th>
                <th className="p-3 text-left">Last order</th>
                <th className="p-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {customers!.map((c) => (
                <tr key={c.id} className={c.is_blocked ? "bg-danger/5" : undefined}>
                  <td className="p-3">
                    <div className="flex items-center gap-2">
                      <Avatar src={c.avatar} name={c.display_name} size={32} />
                      <span className="font-medium">{c.display_name}</span>
                      {c.is_blocked && <span className="rounded-full bg-danger-bg px-2 py-0.5 text-xs text-danger">Blocked</span>}
                    </div>
                  </td>
                  <td className="p-3 text-right">{c.orders_count}</td>
                  <td className="p-3 text-right font-medium">{money(c.total_spend)}</td>
                  <td className="p-3 text-muted">{c.last_order_at ? timeAgo(c.last_order_at) : "—"}</td>
                  <td className="p-3 text-right">
                    <div className="inline-flex gap-2">
                      <Button size="xs" variant="secondary" onClick={() => setWarning({ userId: c.id, message: "" })}>Warn</Button>
                      <Button
                        size="xs"
                        variant={c.is_blocked ? "secondary" : "danger"}
                        onClick={() => onBlock(c.id, !c.is_blocked)}
                      >
                        {c.is_blocked ? "Unblock" : "Block"}
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {warning && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4" onClick={() => setWarning(null)}>
          <div className="w-full max-w-sm rounded-2xl border border-line bg-bg-soft p-6" onClick={(e) => e.stopPropagation()}>
            <h2 className="text-lg font-semibold">Send warning</h2>
            <p className="mt-1 text-xs text-muted">The customer will receive this as a system notification.</p>
            <textarea
              value={warning.message}
              onChange={(e) => setWarning({ ...warning, message: e.target.value })}
              rows={4}
              maxLength={1000}
              autoFocus
              placeholder="Explain the issue clearly and politely…"
              className="mt-3 w-full resize-none rounded-lg border border-line bg-bg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand/60"
            />
            <div className="mt-4 flex gap-2">
              <Button variant="secondary" onClick={() => setWarning(null)} className="flex-1">Cancel</Button>
              <Button onClick={sendWarning} loading={warn.isPending} disabled={!warning.message.trim()} className="flex-1">
                Send warning
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
