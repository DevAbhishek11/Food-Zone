"use client";

import { api } from "@/lib/api";
import type { ApiEnvelope, Post } from "@/lib/types";
import { useInfiniteQuery, useQuery } from "@tanstack/react-query";

export interface TrendingHashtag {
  tag: string;
  count: number;
}

export function useTrendingHashtags() {
  return useQuery({
    queryKey: ["hashtags-trending"],
    queryFn: () => api.get<TrendingHashtag[]>("/hashtags/trending").then((r) => r.data),
    staleTime: 5 * 60 * 1000,
  });
}

export function useHashtagPosts(tag: string) {
  return useInfiniteQuery({
    queryKey: ["hashtag-posts", tag],
    initialPageParam: 1,
    queryFn: ({ pageParam }) => api.get<Post[]>(`/hashtags/${encodeURIComponent(tag)}/posts`, { query: { page: pageParam } }),
    getNextPageParam: (last: ApiEnvelope<Post[]>) =>
      last.meta?.has_more ? last.meta.current_page + 1 : undefined,
  });
}
