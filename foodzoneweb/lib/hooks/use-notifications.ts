"use client";

import { api } from "@/lib/api";
import type { ApiEnvelope, AppNotification } from "@/lib/types";
import { useInfiniteQuery, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

/** Live-ish unread badge: polls every 30s while a session is active. */
export function useUnreadCount() {
  return useQuery({
    queryKey: ["notifications", "unread"],
    queryFn: () => api.get<{ unread: number }>("/notifications/unread-count"),
    refetchInterval: 30_000,
    select: (env) => env.data.unread,
  });
}

export function useNotifications() {
  return useInfiniteQuery({
    queryKey: ["notifications", "list"],
    initialPageParam: 1,
    queryFn: ({ pageParam }) => api.get<AppNotification[]>("/notifications", { query: { page: pageParam } }),
    getNextPageParam: (last: ApiEnvelope<AppNotification[]>) =>
      last.meta?.has_more ? last.meta.current_page + 1 : undefined,
  });
}

function useInvalidateNotifications() {
  const qc = useQueryClient();
  return () => qc.invalidateQueries({ queryKey: ["notifications"] });
}

export function useMarkRead() {
  const invalidate = useInvalidateNotifications();
  return useMutation({
    mutationFn: (id: number) => api.post(`/notifications/${id}/read`),
    onSuccess: invalidate,
  });
}

export function useMarkAllRead() {
  const invalidate = useInvalidateNotifications();
  return useMutation({
    mutationFn: () => api.post("/notifications/read-all"),
    onSuccess: invalidate,
  });
}

export function useDeleteNotification() {
  const invalidate = useInvalidateNotifications();
  return useMutation({
    mutationFn: (id: number) => api.del(`/notifications/${id}`),
    onSuccess: invalidate,
  });
}

export function useClearNotifications() {
  const invalidate = useInvalidateNotifications();
  return useMutation({
    mutationFn: () => api.del("/notifications"),
    onSuccess: invalidate,
  });
}
