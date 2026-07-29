"use client";

import { api } from "@/lib/api";
import { getEcho } from "@/lib/echo";
import type { ApiEnvelope, Post, SavedCollection } from "@/lib/types";
import { useInfiniteQuery, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";

export function useFeed() {
  return useInfiniteQuery({
    queryKey: ["feed"],
    initialPageParam: 1,
    queryFn: ({ pageParam }) => api.get<Post[]>("/feed", { query: { page: pageParam } }),
    getNextPageParam: (last: ApiEnvelope<Post[]>) =>
      last.meta?.has_more ? last.meta.current_page + 1 : undefined,
  });
}

/**
 * Live count of public posts created since this hook mounted (excluding the
 * current user's own — those already appear instantly via the composer's own
 * cache update). Drives the "N new posts" banner; falls back to silently
 * doing nothing when realtime isn't configured (getEcho() resolves null).
 */
export function useNewPostsCount(myUserId: number | undefined) {
  const [count, setCount] = useState(0);

  useEffect(() => {
    let active = true;
    getEcho().then((echo) => {
      if (!echo || !active) return;
      echo.channel("feed").listen(".post.created", (data: unknown) => {
        const payload = data as { author_id?: number };
        if (payload.author_id !== myUserId) setCount((n) => n + 1);
      });
    });
    return () => {
      active = false;
      getEcho().then((echo) => echo?.leave("feed"));
    };
  }, [myUserId]);

  return { count, reset: () => setCount(0) };
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

/** Bookmarked posts, optionally scoped to one collection ("uncategorized" for the default bucket). */
export function useSaved(collectionId?: number | "uncategorized") {
  return useInfiniteQuery({
    queryKey: ["saved", collectionId ?? "all"],
    initialPageParam: 1,
    queryFn: ({ pageParam }) =>
      api.get<Post[]>("/saved", {
        query: {
          page: pageParam,
          collection_id: typeof collectionId === "number" ? collectionId : undefined,
          uncategorized: collectionId === "uncategorized" ? true : undefined,
        },
      }),
    getNextPageParam: (last: ApiEnvelope<Post[]>) =>
      last.meta?.has_more ? last.meta.current_page + 1 : undefined,
  });
}

/** Named folders for organising bookmarks (spec §9.4). */
export function useCollections() {
  return useQuery({
    queryKey: ["collections"],
    queryFn: () => api.get<SavedCollection[]>("/collections"),
    select: (e) => e.data,
  });
}

export function useCreateCollection() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (name: string) => api.post<SavedCollection>("/collections", { name }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["collections"] }),
  });
}

export function useDeleteCollection() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => api.del(`/collections/${id}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["collections"] });
      qc.invalidateQueries({ queryKey: ["saved"] });
    },
  });
}

/** Save a post into a collection (or the default bucket when omitted) — also moves it if already saved. */
export function useSaveToCollection() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ postId, collectionId }: { postId: number; collectionId?: number }) =>
      api.post(`/posts/${postId}/save`, { collection_id: collectionId }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["saved"] });
      qc.invalidateQueries({ queryKey: ["collections"] });
    },
  });
}
