"use client";

import { api } from "@/lib/api";
import type { ApiEnvelope, Post, User, Vendor } from "@/lib/types";
import { useInfiniteQuery, useQuery } from "@tanstack/react-query";

export interface CombinedSearch {
  users: User[];
  vendors: Vendor[];
  posts: Post[];
}

export function useCombinedSearch(q: string) {
  return useQuery({
    queryKey: ["search", "all", q],
    enabled: q.trim().length >= 2,
    queryFn: () => api.get<CombinedSearch>("/search", { query: { q } }),
    select: (e) => e.data,
  });
}

type SearchType = "users" | "vendors" | "posts";

export function useTypedSearch(q: string, type: SearchType) {
  return useInfiniteQuery({
    queryKey: ["search", type, q],
    enabled: q.trim().length >= 2,
    initialPageParam: 1,
    queryFn: ({ pageParam }) =>
      api.get<(User | Vendor | Post)[]>("/search", { query: { q, type, page: pageParam } }),
    getNextPageParam: (last: ApiEnvelope<unknown[]>) =>
      last.meta?.has_more ? last.meta.current_page + 1 : undefined,
  });
}
