"use client";

import { Avatar } from "@/components/ui/Avatar";
import { Button } from "@/components/ui/Button";
import { PageHeader } from "@/components/ui/PageHeader";
import { CardSkeleton, EmptyState, ErrorState } from "@/components/ui/States";
import { cn } from "@/lib/cn";
import { timeAgo } from "@/lib/format";
import {
  useClearNotifications,
  useMarkAllRead,
  useMarkRead,
  useNotifications,
} from "@/lib/hooks/use-notifications";
import type { AppNotification } from "@/lib/types";
import { Bell, Heart, MessageCircle, Receipt, UserPlus } from "lucide-react";
import { useRouter } from "next/navigation";

function iconFor(type: string) {
  if (type === "like") return { Icon: Heart, color: "text-brand" };
  if (type === "comment") return { Icon: MessageCircle, color: "text-info" };
  if (type === "follow" || type === "follow_request") return { Icon: UserPlus, color: "text-info" };
  if (type.startsWith("order")) return { Icon: Receipt, color: "text-success" };
  return { Icon: Bell, color: "text-muted" };
}

export default function NotificationsPage() {
  const router = useRouter();
  const { data, isLoading, isError, refetch, fetchNextPage, hasNextPage, isFetchingNextPage } = useNotifications();
  const markRead = useMarkRead();
  const markAllRead = useMarkAllRead();
  const clearAll = useClearNotifications();

  const items = data?.pages.flatMap((p) => p.data) ?? [];
  const hasUnread = items.some((n) => !n.is_read);

  const open = (n: AppNotification) => {
    if (!n.is_read) markRead.mutate(n.id);
    if (n.data?.order_id) router.push("/orders");
  };

  return (
    <>
      <PageHeader
        title="Inbox"
        subtitle="Your notifications"
        action={
          <div className="flex gap-2">
            <Button variant="ghost" size="sm" onClick={() => markAllRead.mutate()} disabled={!hasUnread || markAllRead.isPending}>
              Mark all read
            </Button>
            <Button variant="ghost" size="sm" onClick={() => clearAll.mutate()} disabled={items.length === 0 || clearAll.isPending}>
              Clear
            </Button>
          </div>
        }
      />

      <div className="mx-auto w-full max-w-2xl space-y-2 p-4">
        {isLoading ? (
          <>
            <CardSkeleton />
            <CardSkeleton />
          </>
        ) : isError ? (
          <ErrorState message="Couldn't load notifications." onRetry={() => refetch()} />
        ) : items.length === 0 ? (
          <EmptyState title="You're all caught up" hint="Likes, comments, follows and order updates show up here." />
        ) : (
          <>
            {items.map((n) => {
              const { Icon, color } = iconFor(n.type);
              const actor = n.data?.actor;
              return (
                <button
                  key={n.id}
                  onClick={() => open(n)}
                  className={cn(
                    "flex w-full items-start gap-3 rounded-card border border-line p-3 text-left transition-colors hover:bg-surface",
                    n.is_read ? "bg-bg-soft" : "bg-brand/5",
                  )}
                >
                  {actor ? (
                    <Avatar src={actor.avatar} name={actor.name} size={40} />
                  ) : (
                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-surface">
                      <Icon className={cn("h-5 w-5", color)} />
                    </span>
                  )}
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-content">{n.title}</p>
                    {n.message && <p className="truncate text-sm text-muted">{n.message}</p>}
                    <p className="mt-0.5 text-xs text-muted">{timeAgo(n.created_at)}</p>
                  </div>
                  {!n.is_read && <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-brand" />}
                </button>
              );
            })}
            {hasNextPage && (
              <div className="flex justify-center pt-2">
                <Button variant="secondary" onClick={() => fetchNextPage()} loading={isFetchingNextPage}>
                  Load more
                </Button>
              </div>
            )}
          </>
        )}
      </div>
    </>
  );
}
