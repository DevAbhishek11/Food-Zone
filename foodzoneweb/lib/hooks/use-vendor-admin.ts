"use client";

import { api } from "@/lib/api";
import type { ApiEnvelope, MenuCategory, MenuItem, Order, Review, Vendor } from "@/lib/types";
import { useInfiniteQuery, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

export interface VendorStats {
  is_open: boolean;
  pending_orders: number;
  active_orders: number;
  orders_today: number;
  revenue_today: number;
  total_orders: number;
  rating_avg: number;
  rating_count: number;
  menu_items: number;
}

function infinite<T>(key: unknown[], path: string, query: Record<string, unknown> = {}) {
  return {
    queryKey: key,
    initialPageParam: 1,
    queryFn: ({ pageParam }: { pageParam: number }) => api.get<T[]>(path, { query: { ...query, page: pageParam } }),
    getNextPageParam: (last: ApiEnvelope<T[]>) => (last.meta?.has_more ? last.meta.current_page + 1 : undefined),
  };
}

export interface VendorAnalytics {
  range_days: number;
  revenue_series: { date: string; orders: number; revenue: number }[];
  status_distribution: { status: string; count: number }[];
  top_items: { id: number; name: string; orders_count: number; rating_avg: number }[];
  lifetime_revenue: number;
}

export interface OperatingHour {
  id?: number;
  day_of_week: number;
  is_closed: boolean;
  open_time: string | null;
  close_time: string | null;
}

// ---- Store / stats ---------------------------------------------------------

export function useVendorStats() {
  return useQuery({ queryKey: ["vendor-stats"], queryFn: () => api.get<VendorStats>("/vendor/stats"), select: (e) => e.data });
}

export function useVendorAnalytics(days = 14) {
  return useQuery({ queryKey: ["vendor-analytics", days], queryFn: () => api.get<VendorAnalytics>("/vendor/analytics", { query: { days } }), select: (e) => e.data });
}

export function useVendorHours() {
  return useQuery({ queryKey: ["vendor-hours"], queryFn: () => api.get<OperatingHour[]>("/vendor/hours"), select: (e) => e.data });
}

export function useUpdateHours() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (hours: OperatingHour[]) => api.put("/vendor/hours", { hours }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["vendor-hours"] }),
  });
}

export function useVendorOrderDetail(orderId: number | null) {
  return useQuery({
    queryKey: ["vendor-order", orderId],
    enabled: orderId != null,
    queryFn: () => api.get<Order>(`/orders/${orderId}`),
    select: (e) => e.data,
  });
}

export function useMyVendor() {
  return useQuery({ queryKey: ["vendor-me"], queryFn: () => api.get<Vendor>("/vendor/me"), select: (e) => e.data });
}

export function useToggleStoreOpen() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: { is_open: boolean; closed_message?: string }) => api.post("/vendor/store/toggle-open", body),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["vendor-stats"] });
      qc.invalidateQueries({ queryKey: ["vendor-me"] });
    },
  });
}

// ---- Orders ----------------------------------------------------------------

export function useVendorOrders(status?: string) {
  return useInfiniteQuery(infinite<Order>(["vendor-orders", status], "/vendor/orders", { status }));
}

export function useUpdateOrderStatus() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ orderId, status, note }: { orderId: number; status: string; note?: string }) =>
      api.post(`/vendor/orders/${orderId}/status`, { status, note }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["vendor-orders"] });
      qc.invalidateQueries({ queryKey: ["vendor-stats"] });
    },
  });
}

// ---- Menu ------------------------------------------------------------------

export function useVendorCategories() {
  return useQuery({ queryKey: ["vendor-categories"], queryFn: () => api.get<MenuCategory[]>("/vendor/categories"), select: (e) => e.data });
}

export function useCreateCategory() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: { name: string; description?: string }) => api.post("/vendor/categories", body),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["vendor-categories"] }),
  });
}

export function useDeleteCategory() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => api.del(`/vendor/categories/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["vendor-categories"] }),
  });
}

export function useVendorItems() {
  return useInfiniteQuery(infinite<MenuItem>(["vendor-items"], "/vendor/items"));
}

export interface ItemInput {
  name: string;
  price: number;
  description?: string;
  category_id?: number | null;
  is_available?: boolean;
  variants?: { name: string; price_modifier: number }[];
  addons?: { name: string; price: number }[];
  images?: string[];
}

export function useSaveItem() {
  const qc = useQueryClient();
  const invalidate = () => {
    qc.invalidateQueries({ queryKey: ["vendor-items"] });
    qc.invalidateQueries({ queryKey: ["vendor-stats"] });
  };
  const create = useMutation({ mutationFn: (body: ItemInput) => api.post("/vendor/items", body), onSuccess: invalidate });
  const update = useMutation({
    mutationFn: ({ id, body }: { id: number; body: ItemInput }) => api.put(`/vendor/items/${id}`, body),
    onSuccess: invalidate,
  });
  const remove = useMutation({ mutationFn: (id: number) => api.del(`/vendor/items/${id}`), onSuccess: invalidate });
  const toggle = useMutation({
    mutationFn: (id: number) => api.post(`/vendor/items/${id}/toggle-availability`),
    onSuccess: invalidate,
  });
  return { create, update, remove, toggle };
}

// ---- Reviews ---------------------------------------------------------------

export function useVendorReviews() {
  return useInfiniteQuery(infinite<Review>(["vendor-reviews-admin"], "/vendor/reviews"));
}

export function useReplyReview() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ ratingId, reply }: { ratingId: number; reply: string }) =>
      api.post(`/vendor/reviews/${ratingId}/reply`, { reply }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["vendor-reviews-admin"] }),
  });
}
