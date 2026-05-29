"use client";

import { api } from "@/lib/api";
import type { ApiEnvelope } from "@/lib/types";
import { useInfiniteQuery, useMutation, useQueryClient } from "@tanstack/react-query";

export interface Violation {
  id: number;
  type: string;
  severity: string;
  evidence: string | null;
  status: "open" | "resolved" | "dismissed";
  subject_kind: "post" | "comment" | "user";
  subject_id: number | null;
  subject_snippet: string | null;
  user: { id: number; name: string; username: string } | null;
  reporter: { id: number; name: string; username: string } | null;
  actions?: { action_type: string; notes: string | null; at: string }[];
  created_at: string;
}

export type ResolveAction = "dismiss" | "warn" | "suspend" | "ban" | "remove_content";

export function useViolations(status: string) {
  return useInfiniteQuery({
    queryKey: ["admin-violations", status],
    initialPageParam: 1,
    queryFn: ({ pageParam }) =>
      api.get<Violation[]>("/admin/violations", { query: { status: status || undefined, page: pageParam } }),
    getNextPageParam: (last: ApiEnvelope<Violation[]>) =>
      last.meta?.has_more ? last.meta.current_page + 1 : undefined,
  });
}

export function useResolveViolation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, action_type, days, notes }: { id: number; action_type: ResolveAction; days?: number; notes?: string }) =>
      api.post(`/admin/violations/${id}/action`, { action_type, days, notes }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin-violations"] }),
  });
}

export function useBroadcast() {
  return useMutation({
    mutationFn: (body: { title: string; message: string; segment?: string }) =>
      api.post<{ recipients: number }>("/admin/broadcast", body),
  });
}
