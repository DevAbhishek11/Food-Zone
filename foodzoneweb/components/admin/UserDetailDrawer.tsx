"use client";

import { Avatar } from "@/components/ui/Avatar";
import { Skeleton } from "@/components/ui/Skeleton";
import { cn } from "@/lib/cn";
import { money, timeAgo } from "@/lib/format";
import { useAdminUserDetail } from "@/lib/hooks/use-admin";
import { Flag, Receipt, Rss, X } from "lucide-react";

const VIOLATION_STYLE: Record<string, string> = {
  open: "bg-warning/15 text-warning",
  resolved: "bg-success/15 text-success",
  dismissed: "bg-surface text-muted",
};

export function UserDetailDrawer({ userId, onClose }: { userId: number; onClose: () => void }) {
  const { data, isLoading, isError } = useAdminUserDetail(userId);

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/60" onClick={onClose}>
      <div
        className="h-full w-full max-w-md overflow-y-auto border-l border-line bg-bg-soft p-6"
        onClick={(e) => e.stopPropagation()}
      >
        <button onClick={onClose} aria-label="Close" className="mb-4 flex items-center gap-1 text-sm text-muted hover:text-content">
          <X className="h-4 w-4" /> Close
        </button>

        {isLoading ? (
          <div className="space-y-4">
            <Skeleton className="h-20 rounded-card" />
            <Skeleton className="h-24 rounded-card" />
            <Skeleton className="h-24 rounded-card" />
          </div>
        ) : isError || !data ? (
          <p className="text-sm text-muted">Couldn&apos;t load this user&apos;s detail.</p>
        ) : (
          <>
            <div className="flex items-center gap-3">
              <Avatar src={data.user.profile?.avatar} name={data.user.name} size={56} verified={data.user.is_verified} />
              <div className="min-w-0">
                <p className="truncate font-semibold">{data.user.name}</p>
                <p className="truncate text-sm text-muted">@{data.user.username} · {data.user.email}</p>
              </div>
            </div>

            <div className="mt-5 grid grid-cols-3 gap-2">
              <Stat label="Orders" value={data.stats.orders_count} />
              <Stat label="Spent" value={money(data.stats.orders_total_spent)} />
              <Stat label="Posts" value={data.stats.posts_count} />
            </div>
            {data.stats.violations_count > 0 && (
              <div className="mt-2 rounded-lg border border-warning/40 bg-warning-bg px-3 py-2 text-xs text-warning">
                {data.stats.violations_open} open of {data.stats.violations_count} total violation(s)
              </div>
            )}

            <Section icon={<Receipt className="h-4 w-4" />} title="Recent orders">
              {data.recent_orders.length === 0 ? (
                <Empty text="No orders yet." />
              ) : (
                data.recent_orders.map((o) => (
                  <div key={o.id} className="flex items-center justify-between py-1.5 text-sm">
                    <span className="truncate text-content">{o.order_number}</span>
                    <span className="shrink-0 text-muted">{money(o.total)} · {timeAgo(o.created_at)}</span>
                  </div>
                ))
              )}
            </Section>

            <Section icon={<Rss className="h-4 w-4" />} title="Recent posts">
              {data.recent_posts.length === 0 ? (
                <Empty text="No posts yet." />
              ) : (
                data.recent_posts.map((p) => (
                  <div key={p.id} className="py-1.5 text-sm">
                    <p className="truncate text-content">{p.body || "(media post)"}</p>
                    <p className="text-xs text-muted">{p.likes_count} likes · {p.comments_count} comments · {timeAgo(p.created_at)}</p>
                  </div>
                ))
              )}
            </Section>

            <Section icon={<Flag className="h-4 w-4" />} title="Violations">
              {data.recent_violations.length === 0 ? (
                <Empty text="Clean record." />
              ) : (
                data.recent_violations.map((v) => (
                  <div key={v.id} className="flex items-center justify-between py-1.5 text-sm">
                    <span className="capitalize text-content">{v.type}</span>
                    <span className={cn("rounded-full px-2 py-0.5 text-xs font-medium capitalize", VIOLATION_STYLE[v.status] ?? "bg-surface text-muted")}>
                      {v.status}
                    </span>
                  </div>
                ))
              )}
            </Section>
          </>
        )}
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: number | string }) {
  return (
    <div className="rounded-lg border border-line bg-bg p-3 text-center">
      <p className="font-display text-lg font-semibold">{value}</p>
      <p className="text-xs text-muted">{label}</p>
    </div>
  );
}

function Section({ icon, title, children }: { icon: React.ReactNode; title: string; children: React.ReactNode }) {
  return (
    <div className="mt-5 border-t border-line pt-4">
      <h3 className="mb-1.5 flex items-center gap-1.5 text-sm font-semibold text-muted">{icon} {title}</h3>
      <div className="divide-y divide-line">{children}</div>
    </div>
  );
}

function Empty({ text }: { text: string }) {
  return <p className="py-1.5 text-sm text-text-tertiary">{text}</p>;
}
