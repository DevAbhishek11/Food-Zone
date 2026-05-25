"use client";

import { api } from "@/lib/api";
import type { ApiEnvelope, Conversation, Message } from "@/lib/types";
import { useInfiniteQuery, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

export function useConversations() {
  return useInfiniteQuery({
    queryKey: ["conversations"],
    initialPageParam: 1,
    queryFn: ({ pageParam }) => api.get<Conversation[]>("/conversations", { query: { page: pageParam } }),
    getNextPageParam: (last: ApiEnvelope<Conversation[]>) => (last.meta?.has_more ? last.meta.current_page + 1 : undefined),
  });
}

export function useChatUnread() {
  return useQuery({
    queryKey: ["conversations", "unread"],
    queryFn: () => api.get<{ unread: number }>("/conversations/unread-count"),
    refetchInterval: 30_000,
    select: (e) => e.data.unread,
  });
}

export function useStartConversation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (userId: number) => api.post<Conversation>("/conversations", { user_id: userId }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["conversations"] }),
  });
}

export function useMessages(conversationId: number) {
  return useInfiniteQuery({
    queryKey: ["messages", conversationId],
    initialPageParam: 1,
    queryFn: ({ pageParam }) => api.get<Message[]>(`/conversations/${conversationId}/messages`, { query: { page: pageParam } }),
    getNextPageParam: (last: ApiEnvelope<Message[]>) => (last.meta?.has_more ? last.meta.current_page + 1 : undefined),
  });
}

export function useSendMessage(conversationId: number) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: string) => api.post<Message>(`/conversations/${conversationId}/messages`, { body }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["messages", conversationId] });
      qc.invalidateQueries({ queryKey: ["conversations"] });
    },
  });
}

export function useMarkConversationRead(conversationId: number) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => api.post(`/conversations/${conversationId}/read`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["conversations"] }),
  });
}
