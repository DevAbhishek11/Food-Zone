import { create } from 'zustand';
import type { MenuItem } from './types';

export interface CartLine {
  itemId: number;
  name: string;
  price: number;
  quantity: number;
}

interface CartState {
  vendorId: number | null;
  vendorName: string | null;
  lines: CartLine[];
  add: (vendorId: number, vendorName: string, item: MenuItem) => void;
  setQuantity: (itemId: number, quantity: number) => void;
  clear: () => void;
  count: () => number;
  subtotal: () => number;
}

export const useCartStore = create<CartState>((set, get) => ({
  vendorId: null,
  vendorName: null,
  lines: [],

  add: (vendorId, vendorName, item) =>
    set((state) => {
      // Single-vendor cart: switching vendors starts a fresh cart.
      const base =
        state.vendorId && state.vendorId !== vendorId
          ? { vendorId, vendorName, lines: [] as CartLine[] }
          : { vendorId, vendorName, lines: state.lines };

      const existing = base.lines.find((l) => l.itemId === item.id);
      const lines = existing
        ? base.lines.map((l) => (l.itemId === item.id ? { ...l, quantity: l.quantity + 1 } : l))
        : [...base.lines, { itemId: item.id, name: item.name, price: item.price, quantity: 1 }];

      return { vendorId: base.vendorId, vendorName: base.vendorName, lines };
    }),

  setQuantity: (itemId, quantity) =>
    set((state) => {
      if (quantity <= 0) {
        const lines = state.lines.filter((l) => l.itemId !== itemId);
        return lines.length === 0 ? { vendorId: null, vendorName: null, lines } : { lines };
      }
      return { lines: state.lines.map((l) => (l.itemId === itemId ? { ...l, quantity } : l)) };
    }),

  clear: () => set({ vendorId: null, vendorName: null, lines: [] }),

  count: () => get().lines.reduce((n, l) => n + l.quantity, 0),
  subtotal: () => get().lines.reduce((n, l) => n + l.quantity * l.price, 0),
}));
