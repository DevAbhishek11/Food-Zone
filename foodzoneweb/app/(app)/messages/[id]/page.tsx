"use client";

import { Avatar } from "@/components/ui/Avatar";
import { Button } from "@/components/ui/Button";
import { PageHeader } from "@/components/ui/PageHeader";
import { ErrorState } from "@/components/ui/States";
import { cn } from "@/lib/cn";
import { getEcho } from "@/lib/echo";
import { timeAgo } from "@/lib/format";
import {
  useDeleteMessage,
  useMarkConversationRead,
  useMessages,
  useSendMessage,
  useToggleReact,
} from "@/lib/hooks/use-chat";
import type { Message } from "@/lib/types";
import { useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, Loader2, Reply, Send, Smile, Trash2, X } from "lucide-react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useRef, useState } from "react";

const QUICK_REACTIONS = ["❤️", "👍", "😂", "😮", "😢", "🔥"];

export default function ThreadPage() {
  const params = useParams<{ id: string }>();
  const conversationId = Number(params.id);
  const qc = useQueryClient();
  const { data, isLoading, isError, refetch, fetchNextPage, hasNextPage, isFetchingNextPage } = useMessages(conversationId);
  const send = useSendMessage(conversationId);
  const markRead = useMarkConversationRead(conversationId);
  const react = useToggleReact(conversationId);
  const remove = useDeleteMessage(conversationId);
  const [body, setBody] = useState("");
  const [replyTo, setReplyTo] = useState<Message | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  const messages = (data?.pages.flatMap((p) => p.data) ?? []).slice().reverse();
  const other = messages.find((m) => !m.is_mine)?.sender;

  useEffect(() => {
    markRead.mutate();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [conversationId]);

  useEffect(() => {
    let active = true;
    const channel = `conversation.${conversationId}`;
    getEcho().then((echo) => {
      if (!echo || !active) return;
      echo.private(channel).listen(".message.sent", () => {
        qc.invalidateQueries({ queryKey: ["messages", conversationId] });
        markRead.mutate();
      });
    });
    return () => {
      active = false;
      getEcho().then((echo) => echo?.leave(channel));
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [conversationId]);

  const submit = async () => {
    const text = body.trim();
    if (!text) return;
    const reply = replyTo;
    setBody("");
    setReplyTo(null);
    try {
      await send.mutateAsync({ body: text, replied_to_message_id: reply?.id ?? undefined });
    } catch {
      setBody(text);
      setReplyTo(reply);
    }
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <div className="flex min-h-dvh flex-col">
      <PageHeader
        title={other?.name ?? "Conversation"}
        subtitle={other ? `@${other.username}` : undefined}
        action={
          <Link href="/messages" className="flex items-center gap-1 text-sm text-muted hover:text-content">
            <ArrowLeft className="h-4 w-4" /> Back
          </Link>
        }
      />

      <div className="mx-auto flex w-full max-w-2xl flex-1 flex-col p-4">
        {isLoading ? (
          <div className="flex flex-1 items-center justify-center"><Loader2 className="h-6 w-6 animate-spin text-muted" /></div>
        ) : isError ? (
          <ErrorState message="Couldn't load this conversation." onRetry={() => refetch()} />
        ) : (
          <div className="flex flex-1 flex-col gap-3">
            {hasNextPage && (
              <button onClick={() => fetchNextPage()} disabled={isFetchingNextPage} className="self-center text-xs text-brand hover:underline">
                {isFetchingNextPage ? "Loading…" : "Load older messages"}
              </button>
            )}
            {messages.length === 0 && <p className="py-8 text-center text-sm text-muted">Say hello 👋</p>}
            {messages.map((m) => (
              <Bubble
                key={m.id}
                message={m}
                onReply={() => setReplyTo(m)}
                onReact={(emoji) => react.mutate({ messageId: m.id, emoji })}
                onDelete={() => remove.mutate(m.id)}
              />
            ))}
            <div ref={bottomRef} />
          </div>
        )}

        {replyTo && (
          <div className="mt-2 flex items-center gap-2 rounded-lg border-l-2 border-brand bg-surface px-3 py-2 text-xs">
            <Reply className="h-3.5 w-3.5 text-brand" />
            <span className="min-w-0 flex-1 truncate text-muted">
              Replying to <span className="text-content">{replyTo.is_mine ? "yourself" : `@${replyTo.sender?.username ?? "user"}`}</span>: {replyTo.body}
            </span>
            <button onClick={() => setReplyTo(null)} aria-label="Cancel reply" className="text-muted hover:text-content">
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        )}

        <div className="sticky bottom-0 mt-3 flex gap-2 border-t border-line bg-bg pt-3">
          <input
            value={body}
            onChange={(e) => setBody(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && (e.preventDefault(), submit())}
            placeholder="Type a message…"
            className="h-11 flex-1 rounded-full border border-line bg-bg-soft px-4 text-sm focus:outline-none focus:ring-2 focus:ring-brand/60"
          />
          <Button onClick={submit} loading={send.isPending} disabled={!body.trim()} className="rounded-full px-4">
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}

function Bubble({
  message,
  onReply,
  onReact,
  onDelete,
}: {
  message: Message;
  onReply: () => void;
  onReact: (emoji: string) => void;
  onDelete: () => void;
}) {
  const [pickerOpen, setPickerOpen] = useState(false);

  if (message.is_deleted) {
    return (
      <div className={cn("flex", message.is_mine ? "justify-end" : "justify-start")}>
        <p className="rounded-2xl bg-surface/60 px-3 py-2 text-sm italic text-muted">This message was deleted</p>
      </div>
    );
  }

  return (
    <div className={cn("group relative flex items-end gap-2", message.is_mine ? "flex-row-reverse" : "flex-row")}>
      {!message.is_mine && <Avatar src={message.sender?.avatar} name={message.sender?.name ?? "?"} size={28} />}

      <div className={cn("flex max-w-[75%] flex-col gap-1", message.is_mine ? "items-end" : "items-start")}>
        {message.replied_to && (
          <div className={cn(
            "max-w-full truncate rounded-lg border-l-2 border-brand px-2 py-1 text-xs",
            message.is_mine ? "bg-brand/20 text-white/80" : "bg-surface/70 text-muted",
          )}>
            ↪ {message.replied_to.body ?? "(deleted)"}
          </div>
        )}

        <div className={cn(
          "rounded-2xl px-3 py-2 text-sm",
          message.is_mine ? "bg-brand text-white" : "bg-surface text-content",
        )}>
          <p className="whitespace-pre-wrap">{message.body}</p>
          <p className={cn("mt-0.5 text-[10px]", message.is_mine ? "text-white/70" : "text-muted")}>
            {timeAgo(message.created_at)}
          </p>
        </div>

        {message.reactions && message.reactions.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {message.reactions.map((r) => (
              <button
                key={r.emoji}
                onClick={() => onReact(r.emoji)}
                className={cn(
                  "inline-flex items-center gap-1 rounded-full border px-1.5 py-0.5 text-xs",
                  r.mine ? "border-brand bg-brand/15 text-content" : "border-line bg-surface text-muted",
                )}
              >
                {r.emoji} {r.count}
              </button>
            ))}
          </div>
        )}
      </div>

      <div className={cn(
        "absolute -top-3 flex items-center gap-0.5 rounded-full border border-line bg-bg-soft p-0.5 opacity-0 shadow-md transition-opacity group-hover:opacity-100",
        message.is_mine ? "right-10" : "left-10",
      )}>
        <button
          onClick={() => setPickerOpen((v) => !v)}
          className="rounded-full p-1 text-muted hover:bg-surface hover:text-content"
          aria-label="React"
        >
          <Smile className="h-4 w-4" />
        </button>
        <button onClick={onReply} className="rounded-full p-1 text-muted hover:bg-surface hover:text-content" aria-label="Reply">
          <Reply className="h-4 w-4" />
        </button>
        {message.is_mine && (
          <button onClick={onDelete} className="rounded-full p-1 text-muted hover:bg-surface hover:text-danger" aria-label="Delete">
            <Trash2 className="h-4 w-4" />
          </button>
        )}
      </div>

      {pickerOpen && (
        <div className={cn(
          "absolute top-3 z-10 flex gap-1 rounded-full border border-line bg-bg-soft p-1 shadow-lg",
          message.is_mine ? "right-10" : "left-10",
        )}>
          {QUICK_REACTIONS.map((e) => (
            <button
              key={e}
              onClick={() => {
                onReact(e);
                setPickerOpen(false);
              }}
              className="rounded-full p-1 text-base hover:bg-surface"
            >
              {e}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
