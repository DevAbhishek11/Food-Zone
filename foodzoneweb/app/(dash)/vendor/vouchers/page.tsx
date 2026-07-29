"use client";

import { Button } from "@/components/ui/Button";
import { PageHeader } from "@/components/ui/PageHeader";
import { Skeleton } from "@/components/ui/Skeleton";
import { EmptyState, ErrorState } from "@/components/ui/States";
import { ApiError } from "@/lib/api";
import { money } from "@/lib/format";
import {
  useVendorVouchers,
  useVoucherDelete,
  useVoucherStore,
  type VendorVoucher,
} from "@/lib/hooks/use-vendor-dashboard";
import { toast } from "@/lib/toast-store";
import { Plus, Tag, Trash2 } from "lucide-react";
import { useState } from "react";

export default function VendorVouchersPage() {
  const { data: vouchers, isLoading, isError, refetch } = useVendorVouchers();
  const create = useVoucherStore();
  const remove = useVoucherDelete();
  const [creating, setCreating] = useState(false);

  return (
    <>
      <PageHeader
        title="Promo codes"
        subtitle="Create discount codes customers can apply at checkout"
        action={<Button size="sm" onClick={() => setCreating(true)} leftIcon={<Plus className="h-4 w-4" />}>New voucher</Button>}
      />

      <div className="mx-auto w-full max-w-3xl space-y-3 p-4 md:p-6">
        {isLoading ? (
          Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-20 rounded-card" />)
        ) : isError ? (
          <ErrorState message="Couldn't load vouchers." onRetry={() => refetch()} />
        ) : (vouchers?.length ?? 0) === 0 ? (
          <EmptyState title="No vouchers yet" hint="Create your first promo code to drive orders." />
        ) : (
          <div className="grid gap-3 sm:grid-cols-2">
            {vouchers!.map((v) => (
              <VoucherCard
                key={v.id}
                voucher={v}
                onDelete={() => remove.mutate(v.id, {
                  onSuccess: () => toast.success("Removed."),
                  onError: () => toast.error("Could not delete voucher."),
                })}
              />
            ))}
          </div>
        )}
      </div>

      {creating && (
        <CreateVoucherDialog
          loading={create.isPending}
          onClose={() => setCreating(false)}
          onSave={async (body) => {
            try {
              await create.mutateAsync(body);
              toast.success("Voucher created.");
              setCreating(false);
            } catch (e) {
              toast.error(e instanceof ApiError ? e.message : "Failed.");
            }
          }}
        />
      )}
    </>
  );
}

function VoucherCard({ voucher, onDelete }: { voucher: VendorVoucher; onDelete: () => void }) {
  const active = voucher.is_active && (!voucher.valid_to || new Date(voucher.valid_to) > new Date());
  return (
    <div className="relative rounded-card border border-line bg-bg-soft p-4">
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="flex items-center gap-1.5 font-mono text-base font-bold text-brand">
            <Tag className="h-4 w-4" /> {voucher.code}
          </p>
          {voucher.description && <p className="mt-1 text-xs text-muted">{voucher.description}</p>}
        </div>
        <button onClick={onDelete} aria-label="Delete" className="text-muted hover:text-danger">
          <Trash2 className="h-4 w-4" />
        </button>
      </div>
      <p className="mt-3 text-sm font-medium">
        {voucher.type === "percentage" ? `${voucher.amount}% off` : `${money(voucher.amount)} off`}
        {voucher.min_order > 0 && <span className="text-muted"> · min {money(voucher.min_order)}</span>}
      </p>
      <div className="mt-2 flex items-center justify-between text-xs text-muted">
        <span>Used {voucher.used_count}{voucher.max_uses ? ` / ${voucher.max_uses}` : ""}</span>
        <span className={active ? "text-success" : "text-muted"}>{active ? "● Active" : "● Inactive"}</span>
      </div>
    </div>
  );
}

function CreateVoucherDialog({
  loading,
  onClose,
  onSave,
}: {
  loading: boolean;
  onClose: () => void;
  onSave: (body: { code: string; type: "percentage" | "flat"; amount: number; min_order?: number; max_uses?: number; description?: string }) => void;
}) {
  const [code, setCode] = useState("");
  const [type, setType] = useState<"percentage" | "flat">("percentage");
  const [amount, setAmount] = useState(10);
  const [minOrder, setMinOrder] = useState(0);
  const [maxUses, setMaxUses] = useState<string>("");

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4" onClick={onClose}>
      <div className="w-full max-w-sm rounded-2xl border border-line bg-bg-soft p-6" onClick={(e) => e.stopPropagation()}>
        <h2 className="text-lg font-semibold">New voucher</h2>
        <div className="mt-4 space-y-3">
          <input
            autoFocus
            value={code}
            onChange={(e) => setCode(e.target.value.toUpperCase())}
            placeholder="CODE"
            maxLength={40}
            className="h-10 w-full rounded-lg border border-line bg-bg px-3 text-sm font-mono uppercase focus:outline-none focus:ring-2 focus:ring-brand/60"
          />
          <div className="flex gap-2">
            <select value={type} onChange={(e) => setType(e.target.value as "percentage" | "flat")} className="h-10 w-1/2 rounded-lg border border-line bg-bg px-3 text-sm focus:outline-none focus:ring-2 focus:ring-brand/60">
              <option value="percentage">% off</option>
              <option value="flat">Flat off</option>
            </select>
            <input value={amount} onChange={(e) => setAmount(Number(e.target.value))} type="number" min={0} placeholder={type === "percentage" ? "10" : "50"} className="h-10 w-1/2 rounded-lg border border-line bg-bg px-3 text-sm focus:outline-none focus:ring-2 focus:ring-brand/60" />
          </div>
          <input value={minOrder} onChange={(e) => setMinOrder(Number(e.target.value))} type="number" min={0} placeholder="Min order amount" className="h-10 w-full rounded-lg border border-line bg-bg px-3 text-sm focus:outline-none focus:ring-2 focus:ring-brand/60" />
          <input value={maxUses} onChange={(e) => setMaxUses(e.target.value)} type="number" min={1} placeholder="Max total uses (optional)" className="h-10 w-full rounded-lg border border-line bg-bg px-3 text-sm focus:outline-none focus:ring-2 focus:ring-brand/60" />
        </div>
        <div className="mt-4 flex gap-2">
          <Button variant="secondary" onClick={onClose} className="flex-1">Cancel</Button>
          <Button
            onClick={() => onSave({
              code: code.trim(),
              type,
              amount,
              min_order: minOrder || undefined,
              max_uses: maxUses ? Number(maxUses) : undefined,
            })}
            loading={loading}
            disabled={!code.trim() || amount <= 0}
            className="flex-1"
          >
            Create
          </Button>
        </div>
      </div>
    </div>
  );
}
