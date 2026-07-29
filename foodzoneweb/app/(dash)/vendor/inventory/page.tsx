"use client";

import { Button } from "@/components/ui/Button";
import { PageHeader } from "@/components/ui/PageHeader";
import { Skeleton } from "@/components/ui/Skeleton";
import { EmptyState, ErrorState } from "@/components/ui/States";
import { ApiError } from "@/lib/api";
import { cn } from "@/lib/cn";
import {
  useInventoryAdjust,
  useInventoryDelete,
  useInventoryStore,
  useVendorInventory,
  type VendorInventoryItem,
} from "@/lib/hooks/use-vendor-dashboard";
import { toast } from "@/lib/toast-store";
import { Plus } from "lucide-react";
import { useState } from "react";

const STATUS_STYLE: Record<string, string> = {
  ok: "bg-success-bg text-success",
  low: "bg-warning-bg text-warning",
  out: "bg-danger-bg text-danger",
};

export default function VendorInventoryPage() {
  const { data: items, isLoading, isError, refetch } = useVendorInventory();
  const add = useInventoryStore();
  const adjust = useInventoryAdjust();
  const remove = useInventoryDelete();
  const [adjusting, setAdjusting] = useState<VendorInventoryItem | null>(null);
  const [creating, setCreating] = useState(false);

  const lowCount = (items ?? []).filter((i) => i.status !== "ok").length;

  return (
    <>
      <PageHeader
        title="Inventory"
        subtitle="Track stock levels and low-stock alerts"
        action={<Button size="sm" onClick={() => setCreating(true)} leftIcon={<Plus className="h-4 w-4" />}>Add item</Button>}
      />

      <div className="mx-auto w-full max-w-3xl space-y-3 p-4 md:p-6">
        {lowCount > 0 && (
          <div className="rounded-lg border border-warning/40 bg-warning-bg px-3 py-2 text-sm text-warning">
            ⚠ {lowCount} item{lowCount === 1 ? "" : "s"} need restocking
          </div>
        )}

        {isLoading ? (
          Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-14 rounded-card" />)
        ) : isError ? (
          <ErrorState message="Couldn't load inventory." onRetry={() => refetch()} />
        ) : (items?.length ?? 0) === 0 ? (
          <EmptyState title="No inventory yet" hint="Add items you want to track stock for." />
        ) : (
          <table className="w-full overflow-hidden rounded-card border border-line bg-bg-soft text-sm">
            <thead className="border-b border-line text-xs uppercase text-muted">
              <tr>
                <th className="p-3 text-left">Item</th>
                <th className="p-3 text-right">Stock</th>
                <th className="p-3 text-right">Low at</th>
                <th className="p-3 text-center">Status</th>
                <th className="p-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {items!.map((i) => (
                <tr key={i.id} className={cn(i.status === "out" && "bg-danger/5", i.status === "low" && "bg-warning/5")}>
                  <td className="p-3 font-medium">{i.name}</td>
                  <td className="p-3 text-right text-muted">{i.stock} {i.unit}</td>
                  <td className="p-3 text-right text-muted">{i.threshold}</td>
                  <td className="p-3 text-center">
                    <span className={cn("rounded-full px-2 py-0.5 text-xs font-medium uppercase", STATUS_STYLE[i.status])}>
                      {i.status}
                    </span>
                  </td>
                  <td className="p-3 text-right">
                    <div className="inline-flex gap-2">
                      <Button size="xs" variant="secondary" onClick={() => setAdjusting(i)}>Adjust</Button>
                      <Button
                        size="xs"
                        variant="ghost"
                        onClick={() => remove.mutate(i.id, { onError: () => toast.error("Could not delete item.") })}
                        disabled={remove.isPending}
                      >
                        Delete
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {creating && (
        <CreateItemDialog
          loading={add.isPending}
          onClose={() => setCreating(false)}
          onSave={async (body) => {
            try {
              await add.mutateAsync(body);
              toast.success("Item added.");
              setCreating(false);
            } catch (e) {
              toast.error(e instanceof ApiError ? e.message : "Failed.");
            }
          }}
        />
      )}

      {adjusting && (
        <AdjustDialog
          item={adjusting}
          loading={adjust.isPending}
          onClose={() => setAdjusting(null)}
          onSave={async (delta, reason) => {
            try {
              await adjust.mutateAsync({ id: adjusting.id, delta, reason });
              toast.success("Stock updated.");
              setAdjusting(null);
            } catch (e) {
              toast.error(e instanceof ApiError ? e.message : "Failed.");
            }
          }}
        />
      )}
    </>
  );
}

function CreateItemDialog({ loading, onClose, onSave }: { loading: boolean; onClose: () => void; onSave: (b: { name: string; unit: string; stock: number; threshold: number }) => void }) {
  const [name, setName] = useState("");
  const [unit, setUnit] = useState("unit");
  const [stock, setStock] = useState(0);
  const [threshold, setThreshold] = useState(0);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4" onClick={onClose}>
      <div className="w-full max-w-sm rounded-2xl border border-line bg-bg-soft p-6" onClick={(e) => e.stopPropagation()}>
        <h2 className="text-lg font-semibold">Add inventory item</h2>
        <div className="mt-4 space-y-3">
          <input autoFocus value={name} onChange={(e) => setName(e.target.value)} placeholder="Ingredient name" className="h-10 w-full rounded-lg border border-line bg-bg px-3 text-sm focus:outline-none focus:ring-2 focus:ring-brand/60" />
          <div className="flex gap-2">
            <input value={stock} onChange={(e) => setStock(Number(e.target.value))} type="number" placeholder="Stock" className="h-10 w-1/2 rounded-lg border border-line bg-bg px-3 text-sm focus:outline-none focus:ring-2 focus:ring-brand/60" />
            <select value={unit} onChange={(e) => setUnit(e.target.value)} className="h-10 w-1/2 rounded-lg border border-line bg-bg px-3 text-sm focus:outline-none focus:ring-2 focus:ring-brand/60">
              <option value="unit">unit</option><option value="kg">kg</option><option value="g">g</option>
              <option value="l">l</option><option value="ml">ml</option><option value="pack">pack</option>
            </select>
          </div>
          <input value={threshold} onChange={(e) => setThreshold(Number(e.target.value))} type="number" placeholder="Low-stock threshold" className="h-10 w-full rounded-lg border border-line bg-bg px-3 text-sm focus:outline-none focus:ring-2 focus:ring-brand/60" />
        </div>
        <div className="mt-4 flex gap-2">
          <Button variant="secondary" onClick={onClose} className="flex-1">Cancel</Button>
          <Button onClick={() => onSave({ name: name.trim(), unit, stock, threshold })} loading={loading} disabled={!name.trim()} className="flex-1">Add</Button>
        </div>
      </div>
    </div>
  );
}

function AdjustDialog({ item, loading, onClose, onSave }: { item: VendorInventoryItem; loading: boolean; onClose: () => void; onSave: (delta: number, reason?: string) => void }) {
  const [delta, setDelta] = useState(0);
  const [reason, setReason] = useState("");

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4" onClick={onClose}>
      <div className="w-full max-w-sm rounded-2xl border border-line bg-bg-soft p-6" onClick={(e) => e.stopPropagation()}>
        <h2 className="text-lg font-semibold">Adjust {item.name}</h2>
        <p className="mt-1 text-xs text-muted">Current: {item.stock} {item.unit}</p>
        <div className="mt-4 space-y-3">
          <div className="flex items-center gap-2">
            <Button size="sm" variant="secondary" onClick={() => setDelta((d) => d - 1)}>−</Button>
            <input
              autoFocus
              type="number"
              value={delta}
              onChange={(e) => setDelta(Number(e.target.value))}
              className="h-10 flex-1 rounded-lg border border-line bg-bg px-3 text-center text-sm focus:outline-none focus:ring-2 focus:ring-brand/60"
            />
            <Button size="sm" variant="secondary" onClick={() => setDelta((d) => d + 1)}>+</Button>
          </div>
          <input value={reason} onChange={(e) => setReason(e.target.value)} placeholder="Reason (optional)" className="h-10 w-full rounded-lg border border-line bg-bg px-3 text-sm focus:outline-none focus:ring-2 focus:ring-brand/60" />
        </div>
        <div className="mt-4 flex gap-2">
          <Button variant="secondary" onClick={onClose} className="flex-1">Cancel</Button>
          <Button onClick={() => onSave(delta, reason.trim() || undefined)} loading={loading} disabled={delta === 0} className="flex-1">Apply</Button>
        </div>
      </div>
    </div>
  );
}
