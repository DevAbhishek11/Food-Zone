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

export interface SendMessageInput {
  body?: string;
  type?: "text" | "image" | "voice" | "file";
  media_url?: string;
  replied_to_message_id?: number | null;
}

export function useSendMessage(conversationId: number) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: string | SendMessageInput) => {
      const payload = typeof input === "string" ? { body: input } : input;
      return api.post<Message>(`/conversations/${conversationId}/messages`, payload);
    },
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

// ---- Chat v2 actions -------------------------------------------------------

export function useToggleReact(conversationId: number) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ messageId, emoji }: { messageId: number; emoji: string }) =>
      api.post(`/messages/${messageId}/react`, { emoji }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["messages", conversationId] }),
  });
}

export function useDeleteMessage(conversationId: number) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (messageId: number) => api.del(`/messages/${messageId}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["messages", conversationId] }),
  });
}

export function useTogglePinConversation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (conversationId: number) => api.put(`/conversations/${conversationId}/pin`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["conversations"] }),
  });
}

export function useMuteConversation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ conversationId, muted, minutes }: { conversationId: number; muted: boolean; minutes?: number }) =>
      api.put(`/conversations/${conversationId}/mute`, { muted, minutes }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["conversations"] }),
  });
}

export function useTyping(conversationId: number) {
  return useMutation({
    mutationFn: () => api.post(`/conversations/${conversationId}/typing`),
  });
}
