"use client";

import { api } from "@/lib/api";
import type { Order, User } from "@/lib/types";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

export interface DeliveryStats {
  active: number;
  delivered_today: number;
  total_delivered: number;
}

export function useDeliveryStats(enabled = true) {
  return useQuery({
    queryKey: ["delivery-stats"],
    queryFn: () => api.get<DeliveryStats>("/delivery/stats").then((r) => r.data),
    enabled,
  });
}

export function useAvailableDeliveries(enabled = true) {
  return useQuery({
    queryKey: ["delivery-available"],
    queryFn: () => api.get<Order[]>("/delivery/available").then((r) => r.data),
    enabled,
    refetchInterval: 20_000,
  });
}

export function useMyDeliveries(status: "active" | "completed", enabled = true) {
  return useQuery({
    queryKey: ["delivery-mine", status],
    queryFn: () => api.get<Order[]>("/delivery/orders", { query: { status } }).then((r) => r.data),
    enabled,
  });
}

/** Invalidate every delivery-related list after an action. */
function useDeliveryInvalidate() {
  const qc = useQueryClient();
  return () => {
    qc.invalidateQueries({ queryKey: ["delivery-available"] });
    qc.invalidateQueries({ queryKey: ["delivery-mine"] });
    qc.invalidateQueries({ queryKey: ["delivery-stats"] });
    qc.invalidateQueries({ queryKey: ["orders"] });
  };
}

function useDeliveryAction(action: "accept" | "release" | "pick-up" | "deliver") {
  const invalidate = useDeliveryInvalidate();
  return useMutation({
    mutationFn: (orderId: number) => api.post<Order>(`/delivery/orders/${orderId}/${action}`),
    onSuccess: invalidate,
  });
}

export const useAcceptDelivery = () => useDeliveryAction("accept");
export const useReleaseDelivery = () => useDeliveryAction("release");
export const usePickUpDelivery = () => useDeliveryAction("pick-up");
export const useDeliverOrder = () => useDeliveryAction("deliver");

export function useBecomeDeliveryPartner() {
  return useMutation({
    mutationFn: () => api.post<User>("/delivery/register").then((r) => r.data),
  });
}
