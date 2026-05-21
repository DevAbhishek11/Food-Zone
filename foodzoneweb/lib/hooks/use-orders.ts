"use client";

import { api } from "@/lib/api";
import type { ApiEnvelope, Order } from "@/lib/types";
import { useInfiniteQuery, useMutation, useQueryClient } from "@tanstack/react-query";

export interface PlaceOrderInput {
  vendor_id: number;
  payment_method: "cod" | "upi" | "card" | "wallet";
  address_id?: number;
  notes?: string;
  items: { item_id: number; quantity: number }[];
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
