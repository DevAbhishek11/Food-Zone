"use client";

import { Avatar } from "@/components/ui/Avatar";
import { Button } from "@/components/ui/Button";
import { PageHeader } from "@/components/ui/PageHeader";
import { ErrorState } from "@/components/ui/States";
import { getEcho } from "@/lib/echo";
import { timeAgo } from "@/lib/format";
import { useMarkConversationRead, useMessages, useSendMessage } from "@/lib/hooks/use-chat";
import { cn } from "@/lib/cn";
import { useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, Loader2, Send } from "lucide-react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useRef, useState } from "react";

export default function ThreadPage() {
  const params = useParams<{ id: string }>();
  const conversationId = Number(params.id);
  const qc = useQueryClient();
  const { data, isLoading, isError, refetch, fetchNextPage, hasNextPage, isFetchingNextPage } = useMessages(conversationId);
  const send = useSendMessage(conversationId);
  const markRead = useMarkConversationRead(conversationId);
  const [body, setBody] = useState("");
  const bottomRef = useRef<HTMLDivElement>(null);

  // API returns newest-first; show oldest→newest (newest at the bottom).
  const messages = (data?.pages.flatMap((p) => p.data) ?? []).slice().reverse();
  const other = messages.find((m) => !m.is_mine)?.sender;

  useEffect(() => {
    markRead.mutate();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [conversationId]);

  // Realtime: refresh on new messages (falls back to manual refetch if no Reverb).
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
    setBody("");
    await send.mutateAsync(text).catch(() => setBody(text));
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
          <div className="flex flex-1 flex-col gap-2">
            {hasNextPage && (
              <button onClick={() => fetchNextPage()} disabled={isFetchingNextPage} className="self-center text-xs text-brand hover:underline">
                {isFetchingNextPage ? "Loading…" : "Load older messages"}
              </button>
            )}
            {messages.length === 0 && <p className="py-8 text-center text-sm text-muted">Say hello 👋</p>}
            {messages.map((m) => (
              <div key={m.id} className={cn("flex items-end gap-2", m.is_mine ? "flex-row-reverse" : "flex-row")}>
                {!m.is_mine && <Avatar src={m.sender?.avatar} name={m.sender?.name ?? "?"} size={28} />}
                <div className={cn(
                  "max-w-[75%] rounded-2xl px-3 py-2 text-sm",
                  m.is_mine ? "bg-brand text-white" : "bg-surface text-content",
                )}>
                  <p className="whitespace-pre-wrap">{m.body}</p>
                  <p className={cn("mt-0.5 text-[10px]", m.is_mine ? "text-white/70" : "text-muted")}>{timeAgo(m.created_at)}</p>
                </div>
              </div>
            ))}
            <div ref={bottomRef} />
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
