"use client";

import { api } from "@/lib/api";
import type { Comment } from "@/lib/types";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

export function useComments(postId: number, enabled: boolean) {
  return useQuery({
    queryKey: ["comments", postId],
    enabled,
    queryFn: () => api.get<Comment[]>(`/posts/${postId}/comments`),
  });
}

export function useAddComment(postId: number) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: string) => api.post<Comment>(`/posts/${postId}/comments`, { body }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["comments", postId] }),
  });
}
