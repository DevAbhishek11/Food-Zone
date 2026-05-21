"use client";

import { api } from "@/lib/api";
import type { ApiEnvelope, Post, User } from "@/lib/types";
import { useInfiniteQuery, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

/** Public profile + viewer relationship flags. */
export function useUserProfile(username: string) {
  return useQuery({
    queryKey: ["user", username],
    queryFn: () => api.get<User>(`/users/${username}`),
    select: (env) => env.data,
  });
}

export function useUserPosts(username: string) {
  return useInfiniteQuery({
    queryKey: ["user-posts", username],
    initialPageParam: 1,
    queryFn: ({ pageParam }) => api.get<Post[]>(`/users/${username}/posts`, { query: { page: pageParam } }),
    getNextPageParam: (last: ApiEnvelope<Post[]>) =>
      last.meta?.has_more ? last.meta.current_page + 1 : undefined,
  });
}

/** Follow / unfollow by user id; refreshes the viewed profile + feed. */
export function useToggleFollow(username: string) {
  const qc = useQueryClient();
  const invalidate = () => {
    qc.invalidateQueries({ queryKey: ["user", username] });
    qc.invalidateQueries({ queryKey: ["feed"] });
  };
  const follow = useMutation({
    mutationFn: (userId: number) => api.post(`/users/${userId}/follow`),
    onSuccess: invalidate,
  });
  const unfollow = useMutation({
    mutationFn: (userId: number) => api.del(`/users/${userId}/follow`),
    onSuccess: invalidate,
  });
  return { follow, unfollow };
}
