"use client";

import { Button } from "@/components/ui/Button";
import type { CartSelection } from "@/lib/cart-store";
import { money } from "@/lib/format";
import type { MenuItem } from "@/lib/types";
import { X } from "lucide-react";
import { useMemo, useState } from "react";

/**
 * Lets the user choose a variant + add-ons for a menu item before adding it to
 * the cart. Returns the resolved selection (unit price + a readable label).
 */
export function ItemCustomizeDialog({
  item,
  onAdd,
  onClose,
}: {
  item: MenuItem;
  onAdd: (selection: CartSelection) => void;
  onClose: () => void;
}) {
  const variants = useMemo(() => item.variants ?? [], [item.variants]);
  const addons = useMemo(() => (item.addons ?? []).filter((a) => a.is_available), [item.addons]);

  const [variantId, setVariantId] = useState<number | null>(
    variants.find((v) => v.is_default)?.id ?? variants[0]?.id ?? null,
  );
  const [addonIds, setAddonIds] = useState<number[]>([]);

  const { unitPrice, label } = useMemo(() => {
    const variant = variants.find((v) => v.id === variantId);
    const chosenAddons = addons.filter((a) => addonIds.includes(a.id));
    const price =
      item.price + (variant?.price_modifier ?? 0) + chosenAddons.reduce((n, a) => n + a.price, 0);
    const parts = [variant?.name, ...chosenAddons.map((a) => a.name)].filter(Boolean) as string[];
    return { unitPrice: price, label: parts.join(" · ") || undefined };
  }, [item.price, variants, addons, variantId, addonIds]);

  const toggleAddon = (id: number) =>
    setAddonIds((cur) => (cur.includes(id) ? cur.filter((x) => x !== id) : [...cur, id]));

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4" onClick={onClose}>
      <div className="w-full max-w-sm rounded-2xl border border-line bg-bg-soft p-6" onClick={(e) => e.stopPropagation()}>
        <div className="mb-4 flex items-start justify-between gap-3">
          <div>
            <h2 className="text-lg font-semibold">{item.name}</h2>
            {item.description && <p className="text-sm text-muted">{item.description}</p>}
          </div>
          <button onClick={onClose} aria-label="Close" className="text-muted hover:text-content">
            <X className="h-5 w-5" />
          </button>
        </div>

        {variants.length > 0 && (
          <fieldset className="mb-4">
            <legend className="mb-2 text-xs font-medium uppercase tracking-wide text-muted">Choose one</legend>
            <div className="space-y-2">
              {variants.map((v) => (
                <label key={v.id} className="flex cursor-pointer items-center justify-between rounded-lg border border-line bg-bg px-3 py-2 text-sm">
                  <span className="flex items-center gap-2">
                    <input
                      type="radio"
                      name="variant"
                      checked={variantId === v.id}
                      onChange={() => setVariantId(v.id)}
                      className="accent-brand"
                    />
                    {v.name}
                  </span>
                  <span className="text-muted">{v.price_modifier ? `+${money(v.price_modifier)}` : "—"}</span>
                </label>
              ))}
            </div>
          </fieldset>
        )}

        {addons.length > 0 && (
          <fieldset className="mb-4">
            <legend className="mb-2 text-xs font-medium uppercase tracking-wide text-muted">Add-ons</legend>
            <div className="space-y-2">
              {addons.map((a) => (
                <label key={a.id} className="flex cursor-pointer items-center justify-between rounded-lg border border-line bg-bg px-3 py-2 text-sm">
                  <span className="flex items-center gap-2">
                    <input type="checkbox" checked={addonIds.includes(a.id)} onChange={() => toggleAddon(a.id)} className="accent-brand" />
                    {a.name}
                  </span>
                  <span className="text-muted">+{money(a.price)}</span>
                </label>
              ))}
            </div>
          </fieldset>
        )}

        <Button
          className="w-full"
          onClick={() => {
            onAdd({ variantId, addonIds, unitPrice, label });
            onClose();
          }}
        >
          Add · {money(unitPrice)}
        </Button>
      </div>
    </div>
  );
}
