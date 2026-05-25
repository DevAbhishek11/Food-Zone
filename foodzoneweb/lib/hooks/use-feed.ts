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
