"use client";

import { api } from "@/lib/api";
import type { ApiEnvelope, AppNotification } from "@/lib/types";
import { useInfiniteQuery, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

export type NotificationChannel = "push" | "email" | "in_app";
export type NotificationPrefMatrix = Record<string, Record<NotificationChannel, boolean>>;
export interface GroupedNotifications {
  today: AppNotification[];
  this_week: AppNotification[];
  earlier: AppNotification[];
}

export function useGroupedNotifications(type?: string) {
  return useQuery({
    queryKey: ["notifications", "grouped", type ?? "all"],
    queryFn: () =>
      api.get<GroupedNotifications>("/notifications", { query: { grouped: 1, ...(type ? { type } : {}) } })
        .then((r) => r.data),
    refetchInterval: 60_000,
  });
}

export function useNotificationPreferences() {
  return useQuery({
    queryKey: ["notifications", "preferences"],
    queryFn: () => api.get<NotificationPrefMatrix>("/notifications/preferences").then((r) => r.data),
    staleTime: 5 * 60 * 1000,
  });
}

export function useSaveNotificationPreferences() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (preferences: { type: string; channel: NotificationChannel; enabled: boolean }[]) =>
      api.post<NotificationPrefMatrix>("/notifications/preferences", { preferences }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["notifications", "preferences"] }),
  });
}

export function useCompleteOnboarding() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: {
      food_preferences?: string[];
      dietary_restrictions?: string[];
      location?: string;
      follow_user_ids?: number[];
    }) => api.post("/onboarding/complete", body),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["auth", "me"] }),
  });
}

export function useSkipOnboarding() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => api.post("/onboarding/skip"),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["auth", "me"] }),
  });
}

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
