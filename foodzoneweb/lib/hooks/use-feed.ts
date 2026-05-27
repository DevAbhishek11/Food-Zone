"use client";

import { api } from "@/lib/api";
import type { ApiEnvelope, Post } from "@/lib/types";
import { useInfiniteQuery, useMutation, useQueryClient } from "@tanstack/react-query";

export function useFeed() {
  return useInfiniteQuery({
    queryKey: ["feed"],
    initialPageParam: 1,
    queryFn: ({ pageParam }) => api.get<Post[]>("/feed", { query: { page: pageParam } }),
    getNextPageParam: (last: ApiEnvelope<Post[]>) =>
      last.meta?.has_more ? last.meta.current_page + 1 : undefined,
  });
}

interface CreatePostInput {
  body: string;
  privacy?: "public" | "followers" | "private";
  media?: { url: string; type: "image" }[];
}

export function useCreatePost() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: CreatePostInput) => api.post<Post>("/posts", input),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["feed"] }),
  });
}

/** Toggle bookmark on a post (no global refetch — callers update locally). */
export function useToggleSave() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ postId, saved }: { postId: number; saved: boolean }) =>
      saved ? api.del(`/posts/${postId}/save`) : api.post(`/posts/${postId}/save`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["saved"] }),
  });
}

export function useSharePost() {
  return useMutation({
    mutationFn: (postId: number) => api.post<{ shares_count: number }>(`/posts/${postId}/share`),
  });
}

export function useSaved() {
  return useInfiniteQuery({
    queryKey: ["saved"],
    initialPageParam: 1,
    queryFn: ({ pageParam }) => api.get<Post[]>("/saved", { query: { page: pageParam } }),
    getNextPageParam: (last: ApiEnvelope<Post[]>) =>
      last.meta?.has_more ? last.meta.current_page + 1 : undefined,
  });
}
