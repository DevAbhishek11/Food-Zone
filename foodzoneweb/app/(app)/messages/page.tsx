"use client";

import { Avatar } from "@/components/ui/Avatar";
import { Button } from "@/components/ui/Button";
import { PageHeader } from "@/components/ui/PageHeader";
import { CardSkeleton, EmptyState, ErrorState } from "@/components/ui/States";
import { timeAgo } from "@/lib/format";
import { useConversations, useMuteConversation, useTogglePinConversation } from "@/lib/hooks/use-chat";
import { toast } from "@/lib/toast-store";
import { BellOff, Pin } from "lucide-react";
import Link from "next/link";

export default function MessagesPage() {
  const { data, isLoading, isError, refetch, fetchNextPage, hasNextPage, isFetchingNextPage } = useConversations();
  const togglePin = useTogglePinConversation();
  const mute = useMuteConversation();
  const conversations = data?.pages.flatMap((p) => p.data) ?? [];

  return (
    <>
      <PageHeader title="Messages" subtitle="Your conversations" />

      <div className="mx-auto w-full max-w-2xl space-y-2 p-4">
        {isLoading ? (
          <>
            <CardSkeleton />
            <CardSkeleton />
          </>
        ) : isError ? (
          <ErrorState message="Couldn't load conversations." onRetry={() => refetch()} />
        ) : conversations.length === 0 ? (
          <EmptyState title="No messages yet" hint="Start a conversation from someone's profile." />
        ) : (
          <>
            {conversations.map((c) => (
              <div key={c.id} className="group relative flex items-center gap-3 rounded-card border border-line bg-bg-soft p-3 hover:bg-surface">
                <Link href={`/messages/${c.id}`} className="flex flex-1 items-center gap-3">
                  <Avatar src={c.other?.avatar} name={c.other?.name ?? "User"} size={48} />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-2">
                      <p className="flex items-center gap-1 truncate text-sm font-medium">
                        {c.is_pinned && <Pin className="h-3 w-3 text-brand" />}
                        {c.other?.name ?? "Unknown"}
                        {c.is_muted && <BellOff className="h-3 w-3 text-muted" />}
                      </p>
                      {c.last_message && <span className="shrink-0 text-xs text-muted">{timeAgo(c.last_message.created_at)}</span>}
                    </div>
                    <p className={`truncate text-sm ${c.unread > 0 ? "font-medium text-content" : "text-muted"}`}>
                      {c.last_message ? `${c.last_message.is_mine ? "You: " : ""}${c.last_message.body}` : "No messages yet"}
                    </p>
                  </div>
                </Link>
                {c.unread > 0 && (
                  <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-brand px-1.5 text-[11px] font-semibold text-white">
                    {c.unread}
                  </span>
                )}
                <div className="absolute right-2 top-2 flex gap-1 opacity-0 transition-opacity group-hover:opacity-100">
                  <button
                    onClick={(e) => { e.preventDefault(); togglePin.mutate(c.id, { onError: () => toast.error("Could not update pin.") }); }}
                    aria-label={c.is_pinned ? "Unpin" : "Pin"}
                    className="rounded-full bg-bg p-1.5 text-muted hover:text-brand"
                  >
                    <Pin className={`h-3.5 w-3.5 ${c.is_pinned ? "fill-current text-brand" : ""}`} />
                  </button>
                  <button
                    onClick={(e) => {
                      e.preventDefault();
                      mute.mutate(
                        { conversationId: c.id, muted: !c.is_muted, minutes: c.is_muted ? undefined : 60 },
                        { onError: () => toast.error("Could not update mute setting.") },
                      );
                    }}
                    aria-label={c.is_muted ? "Unmute" : "Mute"}
                    className="rounded-full bg-bg p-1.5 text-muted hover:text-content"
                  >
                    <BellOff className={`h-3.5 w-3.5 ${c.is_muted ? "text-warning" : ""}`} />
                  </button>
                </div>
              </div>
            ))}
            {hasNextPage && (
              <div className="flex justify-center pt-2">
                <Button variant="secondary" onClick={() => fetchNextPage()} loading={isFetchingNextPage}>Load more</Button>
              </div>
            )}
          </>
        )}
      </div>
    </>
  );
}
