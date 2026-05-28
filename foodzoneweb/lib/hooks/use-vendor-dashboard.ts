"use client";

import { api } from "@/lib/api";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

export interface VendorCustomer {
  id: number;
  display_name: string;
  avatar: string | null;
  orders_count: number;
  total_spend: number;
  last_order_at: string | null;
  is_blocked: boolean;
}

export interface VendorInventoryItem {
  id: number;
  name: string;
  unit: string;
  stock: number;
  threshold: number;
  status: "ok" | "low" | "out";
}

export interface VendorVoucher {
  id: number;
  code: string;
  description: string | null;
  type: "percentage" | "flat";
  amount: number;
  max_discount: number | null;
  min_order: number;
  max_uses: number | null;
  per_user_limit: number;
  used_count: number;
  is_active: boolean;
  valid_from: string | null;
  valid_to: string | null;
}

export function useVendorCustomers() {
  return useQuery({
    queryKey: ["vendor-customers"],
    queryFn: () => api.get<VendorCustomer[]>("/vendor/customers").then((r) => r.data),
  });
}

export function useWarnCustomer() {
  return useMutation({
    mutationFn: ({ userId, message }: { userId: number; message: string }) =>
      api.post(`/vendor/customers/${userId}/warn`, { message }),
  });
}

export function useToggleBlockCustomer() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ userId, block, reason }: { userId: number; block: boolean; reason?: string }) =>
      block
        ? api.post(`/vendor/customers/${userId}/block`, { reason })
        : api.del(`/vendor/customers/${userId}/block`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["vendor-customers"] }),
  });
}

export function useVendorInventory() {
  return useQuery({
    queryKey: ["vendor-inventory"],
    queryFn: () => api.get<VendorInventoryItem[]>("/vendor/inventory").then((r) => r.data),
  });
}

export function useInventoryStore() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: { name: string; unit?: string; stock?: number; threshold?: number }) =>
      api.post("/vendor/inventory", body),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["vendor-inventory"] }),
  });
}

export function useInventoryAdjust() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, delta, reason }: { id: number; delta: number; reason?: string }) =>
      api.post(`/vendor/inventory/${id}/adjust`, { delta, reason }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["vendor-inventory"] }),
  });
}

export function useInventoryDelete() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => api.del(`/vendor/inventory/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["vendor-inventory"] }),
  });
}

export function useVendorVouchers() {
  return useQuery({
    queryKey: ["vendor-vouchers"],
    queryFn: () => api.get<VendorVoucher[]>("/vendor/vouchers").then((r) => r.data),
  });
}

export function useVoucherStore() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: Partial<VendorVoucher> & { code: string; type: "percentage" | "flat"; amount: number }) =>
      api.post("/vendor/vouchers", body),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["vendor-vouchers"] }),
  });
}

export function useVoucherDelete() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => api.del(`/vendor/vouchers/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["vendor-vouchers"] }),
  });
}
