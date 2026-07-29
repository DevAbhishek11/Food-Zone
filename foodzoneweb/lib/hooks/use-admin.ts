"use client";

import { api } from "@/lib/api";
import type { ApiEnvelope, AuditLog, Order, User, Vendor } from "@/lib/types";
import { useInfiniteQuery, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

export interface AdminAnalytics {
  range_days: number;
  revenue_series: { date: string; orders: number; revenue: number }[];
  users_series: { date: string; count: number }[];
  status_distribution: { status: string; count: number }[];
  top_vendors: { id: number; name: string; orders_count: number; rating_avg: number }[];
}

export function useAdminAnalytics(days = 14) {
  return useQuery({
    queryKey: ["admin-analytics", days],
    queryFn: () => api.get<AdminAnalytics>("/admin/analytics", { query: { days } }),
    select: (e) => e.data,
  });
}

export interface AdminStats {
  users_total: number;
  users_new_today: number;
  vendors_total: number;
  vendors_approved: number;
  vendors_pending: number;
  orders_total: number;
  orders_today: number;
  posts_total: number;
  revenue_today: number;
  commission_today: number;
  reports_open: number;
}

export function useAdminDashboard() {
  return useQuery({ queryKey: ["admin-dashboard"], queryFn: () => api.get<AdminStats>("/admin/dashboard"), select: (e) => e.data });
}

export interface UserFilters {
  q?: string;
  role?: string;
  status?: string;
}

export function useAdminUsers(filters: UserFilters) {
  return useInfiniteQuery({
    queryKey: ["admin-users", filters],
    initialPageParam: 1,
    queryFn: ({ pageParam }) => api.get<User[]>("/admin/users", { query: { ...filters, page: pageParam } }),
    getNextPageParam: (last: ApiEnvelope<User[]>) => (last.meta?.has_more ? last.meta.current_page + 1 : undefined),
  });
}

export function useAuditLogs(action?: string) {
  return useInfiniteQuery({
    queryKey: ["admin-audit", action],
    initialPageParam: 1,
    queryFn: ({ pageParam }) => api.get<AuditLog[]>("/admin/audit-logs", { query: { action, page: pageParam } }),
    getNextPageParam: (last: ApiEnvelope<AuditLog[]>) => (last.meta?.has_more ? last.meta.current_page + 1 : undefined),
  });
}

export interface UserDetail {
  user: User;
  stats: {
    orders_count: number;
    orders_total_spent: number;
    posts_count: number;
    violations_count: number;
    violations_open: number;
  };
  recent_orders: { id: number; order_number: string; status: string; total: number; created_at: string }[];
  recent_posts: { id: number; body: string | null; privacy: string; likes_count: number; comments_count: number; created_at: string }[];
  recent_violations: { id: number; type: string; severity: string; status: string; created_at: string }[];
}

/** One-stop detail panel: orders, posts, violations for a single user (spec §5.2). */
export function useAdminUserDetail(userId: number | null) {
  return useQuery({
    queryKey: ["admin-user-detail", userId],
    queryFn: () => api.get<UserDetail>(`/admin/users/${userId}`),
    select: (e) => e.data,
    enabled: userId !== null,
  });
}

export function useUserModeration() {
  const qc = useQueryClient();
  const invalidate = () => {
    qc.invalidateQueries({ queryKey: ["admin-users"] });
    qc.invalidateQueries({ queryKey: ["admin-dashboard"] });
  };
  const ban = useMutation({ mutationFn: ({ id, reason }: { id: number; reason?: string }) => api.put(`/admin/users/${id}/ban`, { reason }), onSuccess: invalidate });
  const suspend = useMutation({ mutationFn: ({ id, days }: { id: number; days: number }) => api.put(`/admin/users/${id}/suspend`, { days }), onSuccess: invalidate });
  const unban = useMutation({ mutationFn: (id: number) => api.put(`/admin/users/${id}/unban`), onSuccess: invalidate });
  const bulk = useMutation({
    mutationFn: (body: { action: "ban" | "suspend" | "unban"; user_ids: number[]; days?: number }) =>
      api.post<{ affected: number }>("/admin/users/bulk", body),
    onSuccess: invalidate,
  });
  const verify = useMutation({ mutationFn: (id: number) => api.put(`/admin/users/${id}/verify`), onSuccess: invalidate });
  return { ban, suspend, unban, bulk, verify };
}

export function useAdminOrders(filters: { status?: string; q?: string; payment_status?: string }) {
  return useInfiniteQuery({
    queryKey: ["admin-orders", filters],
    initialPageParam: 1,
    queryFn: ({ pageParam }) => api.get<Order[]>("/admin/orders", { query: { ...filters, page: pageParam } }),
    getNextPageParam: (last: ApiEnvelope<Order[]>) => (last.meta?.has_more ? last.meta.current_page + 1 : undefined),
  });
}

/** Dispute-resolution actions on any order (spec §5.6). */
export function useAdminOrderActions() {
  const qc = useQueryClient();
  const invalidate = () => qc.invalidateQueries({ queryKey: ["admin-orders"] });
  const setStatus = useMutation({
    mutationFn: ({ id, status }: { id: number; status: string }) =>
      api.post(`/vendor/orders/${id}/status`, { status }),
    onSuccess: invalidate,
  });
  const refund = useMutation({
    mutationFn: ({ id, reason, amount }: { id: number; reason: string; amount?: number }) =>
      api.post(`/admin/orders/${id}/refund`, { reason, amount }),
    onSuccess: invalidate,
  });
  return { setStatus, refund };
}

export function useAdminVendors(status?: string) {
  return useInfiniteQuery({
    queryKey: ["admin-vendors", status],
    initialPageParam: 1,
    queryFn: ({ pageParam }) => api.get<Vendor[]>("/admin/vendors", { query: { status, page: pageParam } }),
    getNextPageParam: (last: ApiEnvelope<Vendor[]>) => (last.meta?.has_more ? last.meta.current_page + 1 : undefined),
  });
}

export function useVendorModeration() {
  const qc = useQueryClient();
  const invalidate = () => {
    qc.invalidateQueries({ queryKey: ["admin-vendors"] });
    qc.invalidateQueries({ queryKey: ["admin-dashboard"] });
  };
  const approve = useMutation({ mutationFn: (id: number) => api.put(`/admin/vendors/${id}/approve`), onSuccess: invalidate });
  const reject = useMutation({ mutationFn: ({ id, reason }: { id: number; reason: string }) => api.put(`/admin/vendors/${id}/reject`, { reason }), onSuccess: invalidate });
  // Platform controls: commission rate, featured flag, force open/close.
  const update = useMutation({
    mutationFn: ({ id, ...patch }: { id: number; commission_rate?: number; is_featured?: boolean; is_open?: boolean }) =>
      api.patch(`/admin/vendors/${id}`, patch),
    onSuccess: invalidate,
  });
  return { approve, reject, update };
}
