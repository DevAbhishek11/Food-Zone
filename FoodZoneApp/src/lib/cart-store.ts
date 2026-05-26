import { create } from 'zustand';
import type { MenuItem } from './types';

export interface CartSelection {
  variantId?: number | null;
  addonIds?: number[];
  /** Resolved unit price = base + variant modifier + add-on prices. */
  unitPrice: number;
  /** Human label for the chosen options, e.g. "Large · Extra cheese". */
  label?: string;
}

export interface CartLine {
  /** Stable key per item+variant+add-on combination. */
  key: string;
  itemId: number;
  name: string;
  basePrice: number;
  unitPrice: number;
  quantity: number;
  variantId: number | null;
  addonIds: number[];
  label?: string;
}

/** A line is unique per item + chosen variant + chosen add-ons. */
function lineKey(itemId: number, variantId: number | null, addonIds: number[]): string {
  const addons = [...addonIds].sort((a, b) => a - b).join('-');
  return `${itemId}:${variantId ?? 0}:${addons}`;
}

interface CartState {
  vendorId: number | null;
  vendorName: string | null;
  lines: CartLine[];
  add: (vendorId: number, vendorName: string, item: MenuItem, selection?: CartSelection) => void;
  remove: (key: string) => void;
  setQuantity: (key: string, quantity: number) => void;
  clear: () => void;
  count: () => number;
  subtotal: () => number;
}

export const useCartStore = create<CartState>((set, get) => ({
  vendorId: null,
  vendorName: null,
  lines: [],

  add: (vendorId, vendorName, item, selection) =>
    set((state) => {
      const variantId = selection?.variantId ?? null;
      const addonIds = selection?.addonIds ?? [];
      const unitPrice = selection?.unitPrice ?? item.price;
      const key = lineKey(item.id, variantId, addonIds);

      // Single-vendor cart: switching vendors starts a fresh cart.
      const base =
        state.vendorId && state.vendorId !== vendorId
          ? { vendorId, vendorName, lines: [] as CartLine[] }
          : { vendorId, vendorName, lines: state.lines };

      const existing = base.lines.find((l) => l.key === key);
      const lines = existing
        ? base.lines.map((l) => (l.key === key ? { ...l, quantity: l.quantity + 1 } : l))
        : [
            ...base.lines,
            {
              key,
              itemId: item.id,
              name: item.name,
              basePrice: item.price,
              unitPrice,
              quantity: 1,
              variantId,
              addonIds,
              label: selection?.label,
            },
          ];

      return { vendorId: base.vendorId, vendorName: base.vendorName, lines };
    }),

  remove: (key) =>
    set((state) => {
      const lines = state.lines.filter((l) => l.key !== key);
      return lines.length === 0 ? { vendorId: null, vendorName: null, lines } : { lines };
    }),

  setQuantity: (key, quantity) =>
    set((state) => {
      if (quantity <= 0) {
        const lines = state.lines.filter((l) => l.key !== key);
        return lines.length === 0 ? { vendorId: null, vendorName: null, lines } : { lines };
      }
      return { lines: state.lines.map((l) => (l.key === key ? { ...l, quantity } : l)) };
    }),

  clear: () => set({ vendorId: null, vendorName: null, lines: [] }),

  count: () => get().lines.reduce((n, l) => n + l.quantity, 0),
  subtotal: () => get().lines.reduce((n, l) => n + l.quantity * l.unitPrice, 0),
}));
