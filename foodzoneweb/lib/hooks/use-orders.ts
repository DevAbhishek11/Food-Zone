"use client";

import { api } from "@/lib/api";
import type { ApiEnvelope, Order } from "@/lib/types";
import { useInfiniteQuery, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

export interface PlaceOrderItem {
  item_id: number;
  quantity: number;
  variant_id?: number | null;
  addon_ids?: number[];
}

export interface PlaceOrderInput {
  vendor_id: number;
  payment_method: "cod" | "upi" | "card" | "wallet";
  address_id?: number;
  notes?: string;
  voucher_code?: string;
  items: PlaceOrderItem[];
}

export interface CheckoutQuote {
  subtotal: number;
  discount: number;
  delivery_charge: number;
  tax: number;
  total: number;
  voucher: { code: string; description: string | null; discount: number } | null;
  voucher_error: string | null;
  lines: { item_id: number; item_name: string; quantity: number; unit_price: number; line_total: number }[];
}

export interface QuoteInput {
  vendor_id: number;
  voucher_code?: string;
  items: PlaceOrderItem[];
}

/**
 * Authoritative cart pricing (variants/add-ons + voucher) from the server.
 * Enabled on demand — typically once the user applies a voucher — so the cart
 * shows the exact discount/total that placement will charge.
 */
export function useCheckoutQuote(input: QuoteInput | null, enabled: boolean) {
  return useQuery({
    queryKey: ["checkout-quote", input],
    queryFn: () => api.post<CheckoutQuote>("/checkout/quote", input!).then((r) => r.data),
    enabled: enabled && !!input && input.items.length > 0,
    staleTime: 0,
  });
}

export function usePlaceOrder() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: PlaceOrderInput) => api.post<Order>("/orders", input),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["orders"] }),
  });
}

export function useOrders() {
  return useInfiniteQuery({
    queryKey: ["orders"],
    initialPageParam: 1,
    queryFn: ({ pageParam }) => api.get<Order[]>("/orders", { query: { page: pageParam } }),
    getNextPageParam: (last: ApiEnvelope<Order[]>) =>
      last.meta?.has_more ? last.meta.current_page + 1 : undefined,
  });
}

export function useOrder(orderId: number, enabled = true) {
  return useQuery({
    queryKey: ["order", orderId],
    enabled,
    queryFn: () => api.get<Order>(`/orders/${orderId}`).then((r) => r.data),
  });
}

export interface PaymentIntent {
  payment_id: number;
  gateway: string;
  intent_id: string;
  amount: number;
  currency: string;
  key?: string;
  client_secret?: string;
}

/**
 * Pay for an online (non-COD) order. With the `mock` gateway we confirm the
 * payment immediately; real gateways (razorpay/stripe) would hand the returned
 * intent to their checkout SDK, which then confirms via the server webhook.
 */
export function usePayOrder() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (orderId: number) => {
      const { data } = await api.post<PaymentIntent>(`/orders/${orderId}/pay`);
      if (data.gateway === "mock") {
        await api.post(`/payments/${data.payment_id}/confirm`);
      }
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["orders"] }),
  });
}

export interface RateOrderInput {
  rating: number;
  review?: string;
}

export function useRateOrder(orderId: number) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: RateOrderInput) => api.post(`/orders/${orderId}/rate`, input),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["orders"] }),
  });
}
