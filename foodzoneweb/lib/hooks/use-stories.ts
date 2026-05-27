"use client";

import { api } from "@/lib/api";
import type { Story, StoryGroup } from "@/lib/types";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

export function useStories() {
  return useQuery({
    queryKey: ["stories"],
    queryFn: () => api.get<StoryGroup[]>("/stories").then((r) => r.data),
  });
}

export function useCreateStory() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: { media_url: string; type?: "image" | "video"; caption?: string }) =>
      api.post<Story>("/stories", input),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["stories"] }),
  });
}

export function useViewStory() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (storyId: number) => api.post(`/stories/${storyId}/view`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["stories"] }),
  });
}
