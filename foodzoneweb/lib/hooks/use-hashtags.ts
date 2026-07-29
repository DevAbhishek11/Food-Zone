"use client";

import { api } from "@/lib/api";
import type { ApiEnvelope, Post } from "@/lib/types";
import { useInfiniteQuery, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

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

/** Tags the current user follows — matching posts get mixed into their feed. */
export function useFollowedHashtags() {
  return useQuery({
    queryKey: ["hashtags-followed"],
    queryFn: () => api.get<string[]>("/hashtags/followed").then((r) => r.data),
  });
}

export function useToggleHashtagFollow() {
  const qc = useQueryClient();
  const invalidate = () => qc.invalidateQueries({ queryKey: ["hashtags-followed"] });
  const follow = useMutation({
    mutationFn: (tag: string) => api.post(`/hashtags/${encodeURIComponent(tag)}/follow`),
    onSuccess: invalidate,
  });
  const unfollow = useMutation({
    mutationFn: (tag: string) => api.del(`/hashtags/${encodeURIComponent(tag)}/follow`),
    onSuccess: invalidate,
  });
  return { follow, unfollow };
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
