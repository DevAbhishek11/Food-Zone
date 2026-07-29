"use client";

import { Avatar } from "@/components/ui/Avatar";
import { Button } from "@/components/ui/Button";
import { PageHeader } from "@/components/ui/PageHeader";
import { CardSkeleton, EmptyState, ErrorState } from "@/components/ui/States";
import { cn } from "@/lib/cn";
import { timeAgo } from "@/lib/format";
import {
  useClearNotifications,
  useGroupedNotifications,
  useMarkAllRead,
  useMarkRead,
} from "@/lib/hooks/use-notifications";
import { toast } from "@/lib/toast-store";
import type { AppNotification } from "@/lib/types";
import { AtSign, Bell, Flame, Heart, MessageCircle, Receipt, Settings, Sparkles, Store, Tag, UserPlus } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";

interface TypeMeta {
  Icon: React.ComponentType<{ className?: string }>;
  color: string;
  action?: (n: AppNotification) => { href: string; label: string } | null;
}

const TYPE_META: Record<string, TypeMeta> = {
  like: { Icon: Heart, color: "text-brand", action: (n) => n.data?.post_id ? { href: `/posts/${n.data.post_id}`, label: "View post" } : null },
  comment: { Icon: MessageCircle, color: "text-info", action: (n) => n.data?.post_id ? { href: `/posts/${n.data.post_id}`, label: "View post" } : null },
  mention: { Icon: AtSign, color: "text-info", action: (n) => n.data?.post_id ? { href: `/posts/${n.data.post_id}`, label: "View post" } : null },
  follow: { Icon: UserPlus, color: "text-info", action: (n) => n.data?.actor?.username ? { href: `/u/${n.data.actor.username}`, label: "Follow back" } : null },
  follow_request: { Icon: UserPlus, color: "text-info" },
  order_status: { Icon: Receipt, color: "text-success", action: (n) => n.data?.order_id ? { href: `/orders/${n.data.order_id}`, label: "Track order" } : null },
  story_mention: { Icon: AtSign, color: "text-warning" },
  post_tagged: { Icon: Tag, color: "text-info", action: (n) => n.data?.post_id ? { href: `/posts/${n.data.post_id}`, label: "View post" } : null },
  vendor_offer: { Icon: Store, color: "text-warning", action: (n) => n.data?.vendor_slug ? { href: `/vendors/${n.data.vendor_slug}`, label: "View offer" } : null },
  flash_deal: { Icon: Flame, color: "text-danger", action: (n) => n.data?.vendor_slug ? { href: `/vendors/${n.data.vendor_slug}`, label: "Grab deal" } : null },
  system: { Icon: Sparkles, color: "text-muted" },
};

function meta(type: string): TypeMeta {
  if (type.startsWith("order")) return TYPE_META.order_status;
  return TYPE_META[type] ?? { Icon: Bell, color: "text-muted" };
}

export default function NotificationsPage() {
  const { data, isLoading, isError, refetch } = useGroupedNotifications();
  const markRead = useMarkRead();
  const markAllRead = useMarkAllRead();
  const clearAll = useClearNotifications();

  const empty = !data || (data.today.length + data.this_week.length + data.earlier.length === 0);
  const hasUnread =
    !!data &&
    [...data.today, ...data.this_week, ...data.earlier].some((n) => !n.is_read);

  return (
    <>
      <PageHeader
        title="Inbox"
        subtitle="Your notifications, grouped by recency"
        action={
          <div className="flex gap-2">
            <Link href="/notifications/preferences" className="flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm text-muted hover:bg-surface hover:text-content">
              <Settings className="h-4 w-4" /> Preferences
            </Link>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => markAllRead.mutate(undefined, { onError: () => toast.error("Could not mark all as read.") })}
              disabled={!hasUnread || markAllRead.isPending}
            >
              Mark all read
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => clearAll.mutate(undefined, { onError: () => toast.error("Could not clear notifications.") })}
              disabled={empty || clearAll.isPending}
            >
              Clear
            </Button>
          </div>
        }
      />

      <div className="mx-auto w-full max-w-2xl space-y-6 p-4">
        {isLoading ? (
          <>
            <CardSkeleton />
            <CardSkeleton />
          </>
        ) : isError ? (
          <ErrorState message="Couldn't load notifications." onRetry={() => refetch()} />
        ) : empty ? (
          <EmptyState title="You're all caught up" hint="Likes, comments, follows and order updates show up here." />
        ) : (
          <>
            {data!.today.length > 0 && <Group title="Today" items={data!.today} onRead={(id) => markRead.mutate(id)} />}
            {data!.this_week.length > 0 && <Group title="This week" items={data!.this_week} onRead={(id) => markRead.mutate(id)} />}
            {data!.earlier.length > 0 && <Group title="Earlier" items={data!.earlier} onRead={(id) => markRead.mutate(id)} />}
          </>
        )}
      </div>
    </>
  );
}

function Group({
  title,
  items,
  onRead,
}: {
  title: string;
  items: AppNotification[];
  onRead: (id: number) => void;
}) {
  return (
    <section>
      <h2 className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted">{title}</h2>
      <div className="space-y-2">
        {items.map((n) => (
          <Row key={n.id} n={n} onRead={onRead} />
        ))}
      </div>
    </section>
  );
}

function Row({ n, onRead }: { n: AppNotification; onRead: (id: number) => void }) {
  const router = useRouter();
  const { Icon, color, action } = meta(n.type);
  const link = action?.(n) ?? null;
  const actor = n.data?.actor;

  const handleRead = () => {
    if (!n.is_read) onRead(n.id);
  };

  return (
    <div
      onMouseEnter={handleRead}
      className={cn(
        "group flex items-start gap-3 rounded-card border border-line p-3 transition-colors",
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
      {link && (
        <Button
          size="sm"
          variant="ghost"
          onClick={() => {
            handleRead();
            router.push(link.href);
          }}
        >
          {link.label}
        </Button>
      )}
      {!n.is_read && <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-brand transition-opacity group-hover:opacity-0" />}
    </div>
  );
}
