"use client";

import { AdminNav } from "@/components/admin/AdminNav";
import { Button } from "@/components/ui/Button";
import { PageHeader } from "@/components/ui/PageHeader";
import { Skeleton } from "@/components/ui/Skeleton";
import { EmptyState, ErrorState } from "@/components/ui/States";
import { timeAgo } from "@/lib/format";
import { useAuditLogs } from "@/lib/hooks/use-admin";
import { useState } from "react";

const ACTIONS = ["", "user.banned", "user.suspended", "user.reinstated", "vendor.approved", "vendor.rejected"];

const ACTION_STYLE: Record<string, string> = {
  "user.banned": "bg-danger/15 text-danger",
  "user.suspended": "bg-warning/15 text-warning",
  "user.reinstated": "bg-success/15 text-success",
  "vendor.approved": "bg-success/15 text-success",
  "vendor.rejected": "bg-danger/15 text-danger",
};

export default function AdminAuditPage() {
  const [action, setAction] = useState("");
  const { data, isLoading, isError, refetch, fetchNextPage, hasNextPage, isFetchingNextPage } = useAuditLogs(action || undefined);
  const logs = data?.pages.flatMap((p) => p.data) ?? [];

  return (
    <>
      <PageHeader title="Audit log" subtitle="Immutable record of moderation actions" />
      <AdminNav />

      <div className="mx-auto w-full max-w-4xl space-y-4 p-4 md:p-6">
        <select
          value={action}
          onChange={(e) => setAction(e.target.value)}
          className="h-9 rounded-lg border border-line bg-bg px-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand/60"
        >
          {ACTIONS.map((a) => (
            <option key={a} value={a}>
              {a === "" ? "All actions" : a}
            </option>
          ))}
        </select>

        {isLoading ? (
          Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-16 rounded-card" />)
        ) : isError ? (
          <ErrorState message="Couldn't load the audit log." onRetry={() => refetch()} />
        ) : logs.length === 0 ? (
          <EmptyState title="No audit entries" hint="Moderation actions will appear here." />
        ) : (
          <>
            <ul className="divide-y divide-line overflow-hidden rounded-card border border-line bg-bg-soft">
              {logs.map((log) => (
                <li key={log.id} className="flex flex-wrap items-center gap-x-3 gap-y-1 p-3 text-sm">
                  <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${ACTION_STYLE[log.action] ?? "bg-surface text-muted"}`}>
                    {log.action}
                  </span>
                  <span className="text-content">
                    {log.actor ? `@${log.actor.username}` : "system"}
                  </span>
                  {log.auditable_type && (
                    <span className="text-muted">
                      → {log.auditable_type} #{log.auditable_id}
                    </span>
                  )}
                  {log.meta?.reason ? <span className="text-muted">· {String(log.meta.reason)}</span> : null}
                  <span className="ml-auto text-xs text-muted">{timeAgo(log.created_at)}</span>
                </li>
              ))}
            </ul>
            {hasNextPage && (
              <div className="flex justify-center">
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
