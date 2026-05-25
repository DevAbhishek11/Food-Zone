"use client";

import { Avatar } from "@/components/ui/Avatar";
import { Button } from "@/components/ui/Button";
import { PageHeader } from "@/components/ui/PageHeader";
import { CardSkeleton, EmptyState, ErrorState } from "@/components/ui/States";
import { timeAgo } from "@/lib/format";
import { useConversations } from "@/lib/hooks/use-chat";
import Link from "next/link";

export default function MessagesPage() {
  const { data, isLoading, isError, refetch, fetchNextPage, hasNextPage, isFetchingNextPage } = useConversations();
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
              <Link
                key={c.id}
                href={`/messages/${c.id}`}
                className="flex items-center gap-3 rounded-card border border-line bg-bg-soft p-3 hover:bg-surface"
              >
                <Avatar src={c.other?.avatar} name={c.other?.name ?? "User"} size={48} />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-2">
                    <p className="truncate text-sm font-medium">{c.other?.name ?? "Unknown"}</p>
                    {c.last_message && <span className="shrink-0 text-xs text-muted">{timeAgo(c.last_message.created_at)}</span>}
                  </div>
                  <p className={`truncate text-sm ${c.unread > 0 ? "font-medium text-content" : "text-muted"}`}>
                    {c.last_message ? `${c.last_message.is_mine ? "You: " : ""}${c.last_message.body}` : "No messages yet"}
                  </p>
                </div>
                {c.unread > 0 && (
                  <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-brand px-1.5 text-[11px] font-semibold text-white">
                    {c.unread}
                  </span>
                )}
              </Link>
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
