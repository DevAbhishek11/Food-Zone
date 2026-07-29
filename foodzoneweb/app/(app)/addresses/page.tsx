"use client";

import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { PageHeader } from "@/components/ui/PageHeader";
import { Skeleton } from "@/components/ui/Skeleton";
import { EmptyState, ErrorState } from "@/components/ui/States";
import { AddressInput, useAddresses, useSaveAddress } from "@/lib/hooks/use-addresses";
import { toast } from "@/lib/toast-store";
import type { Address } from "@/lib/types";
import { MapPin, Pencil, Plus, Star, Trash2 } from "lucide-react";
import { useState } from "react";

export default function AddressesPage() {
  const { data: addresses, isLoading, isError, refetch } = useAddresses();
  const { create, update, remove } = useSaveAddress();
  const [editing, setEditing] = useState<Address | "new" | null>(null);

  const save = async (input: AddressInput, id?: number) => {
    try {
      if (id) await update.mutateAsync({ id, body: input });
      else await create.mutateAsync(input);
      setEditing(null);
      toast.success(id ? "Address updated" : "Address added");
    } catch {
      toast.error("Could not save address.");
    }
  };

  return (
    <>
      <PageHeader
        title="Delivery Addresses"
        action={
          editing == null ? (
            <Button size="sm" onClick={() => setEditing("new")}>
              <Plus className="h-4 w-4" /> Add
            </Button>
          ) : undefined
        }
      />

      <div className="mx-auto w-full max-w-2xl space-y-3 p-4">
        {editing === "new" && (
          <AddressForm onCancel={() => setEditing(null)} onSave={(i) => save(i)} saving={create.isPending} />
        )}

        {isLoading ? (
          <>
            <Skeleton className="h-24 rounded-card" />
            <Skeleton className="h-24 rounded-card" />
          </>
        ) : isError ? (
          <ErrorState message="Couldn't load addresses." onRetry={() => refetch()} />
        ) : (addresses ?? []).length === 0 && editing !== "new" ? (
          <EmptyState title="No saved addresses" hint="Add one to speed up checkout." />
        ) : (
          (addresses ?? []).map((a) =>
            editing && editing !== "new" && editing.id === a.id ? (
              <AddressForm key={a.id} address={a} onCancel={() => setEditing(null)} onSave={(i) => save(i, a.id)} saving={update.isPending} />
            ) : (
              <div key={a.id} className="flex items-start gap-3 rounded-card border border-line bg-bg-soft p-4">
                <MapPin className="mt-0.5 h-5 w-5 shrink-0 text-muted" />
                <div className="min-w-0 flex-1">
                  <p className="flex items-center gap-2 text-sm font-medium">
                    {a.label}
                    {a.is_default && (
                      <span className="flex items-center gap-1 rounded-full bg-brand/15 px-1.5 py-0.5 text-[10px] text-brand">
                        <Star className="h-3 w-3 fill-current" /> Default
                      </span>
                    )}
                  </p>
                  <p className="text-sm text-muted">{a.address}, {a.city}, {a.state} {a.pincode}</p>
                  {a.landmark && <p className="text-xs text-muted">Near {a.landmark}</p>}
                  {!a.is_default && (
                    <button
                      onClick={() => save({ label: a.label, address: a.address, city: a.city, state: a.state, pincode: a.pincode, landmark: a.landmark ?? undefined, is_default: true }, a.id)}
                      className="mt-1 text-xs text-brand hover:underline"
                    >
                      Set as default
                    </button>
                  )}
                </div>
                <button onClick={() => setEditing(a)} aria-label="Edit" className="text-muted hover:text-content"><Pencil className="h-4 w-4" /></button>
                <button
                  onClick={() => remove.mutate(a.id, { onError: () => toast.error("Could not delete address.") })}
                  aria-label="Delete"
                  className="text-muted hover:text-danger"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            ),
          )
        )}
      </div>
    </>
  );
}

function AddressForm({ address, onSave, onCancel, saving }: { address?: Address; onSave: (i: AddressInput) => void; onCancel: () => void; saving: boolean }) {
  const [f, setF] = useState<AddressInput>({
    label: address?.label ?? "Home",
    address: address?.address ?? "",
    city: address?.city ?? "",
    state: address?.state ?? "",
    pincode: address?.pincode ?? "",
    landmark: address?.landmark ?? "",
  });
  const set = (k: keyof AddressInput) => (e: React.ChangeEvent<HTMLInputElement>) => setF((p) => ({ ...p, [k]: e.target.value }));

  const submit = () => {
    if (!f.address.trim() || !f.city.trim() || !f.state.trim() || !f.pincode.trim()) {
      toast.error("Address, city, state and pincode are required.");
      return;
    }
    onSave(f);
  };

  return (
    <div className="space-y-3 rounded-card border border-brand/40 bg-bg-soft p-4">
      <div className="grid gap-3 sm:grid-cols-2">
        <Input label="Label" value={f.label} onChange={set("label")} placeholder="Home / Work" />
        <Input label="Pincode" value={f.pincode} onChange={set("pincode")} placeholder="400001" />
      </div>
      <Input label="Address" value={f.address} onChange={set("address")} placeholder="Flat, street, area" />
      <div className="grid gap-3 sm:grid-cols-2">
        <Input label="City" value={f.city} onChange={set("city")} placeholder="Mumbai" />
        <Input label="State" value={f.state} onChange={set("state")} placeholder="MH" />
      </div>
      <Input label="Landmark" value={f.landmark ?? ""} onChange={set("landmark")} placeholder="Optional" />
      <div className="flex justify-end gap-2">
        <Button variant="ghost" onClick={onCancel}>Cancel</Button>
        <Button onClick={submit} loading={saving}>Save address</Button>
      </div>
    </div>
  );
}
