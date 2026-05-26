"use client";

import { api } from "@/lib/api";
import type { Comment, Post } from "@/lib/types";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

export function usePost(postId: number, enabled = true) {
  return useQuery({
    queryKey: ["post", postId],
    enabled,
    queryFn: () => api.get<Post>(`/posts/${postId}`).then((r) => r.data),
  });
}

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
    mutationFn: (input: { body: string; parentId?: number | null }) =>
      api.post<Comment>(`/posts/${postId}/comments`, { body: input.body, parent_id: input.parentId ?? undefined }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["comments", postId] }),
  });
}

export function useDeleteComment(postId: number) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (commentId: number) => api.del(`/comments/${commentId}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["comments", postId] }),
  });
}
