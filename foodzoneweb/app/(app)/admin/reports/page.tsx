"use client";

import { AdminNav } from "@/components/admin/AdminNav";
import { Button } from "@/components/ui/Button";
import { PageHeader } from "@/components/ui/PageHeader";
import { Skeleton } from "@/components/ui/Skeleton";
import { EmptyState, ErrorState } from "@/components/ui/States";
import { ApiError } from "@/lib/api";
import { cn } from "@/lib/cn";
import { timeAgo } from "@/lib/format";
import {
  useResolveViolation,
  useViolations,
  type ResolveAction,
  type Violation,
} from "@/lib/hooks/use-admin-v3";
import { toast } from "@/lib/toast-store";
import { Flag, FileText, MessageSquare, User } from "lucide-react";
import Link from "next/link";
import { useState } from "react";

const STATUSES = ["open", "resolved", "dismissed", ""];
const SUBJECT_ICONS = { post: FileText, comment: MessageSquare, user: User } as const;
const STATUS_STYLE: Record<string, string> = {
  open: "bg-warning-bg text-warning",
  resolved: "bg-success-bg text-success",
  dismissed: "bg-surface text-muted",
};

export default function AdminReportsPage() {
  const [status, setStatus] = useState("open");
  const { data, isLoading, isError, refetch, fetchNextPage, hasNextPage, isFetchingNextPage } = useViolations(status);
  const resolve = useResolveViolation();
  const [target, setTarget] = useState<Violation | null>(null);

  const violations = data?.pages.flatMap((p) => p.data) ?? [];

  return (
    <>
      <PageHeader title="Reports" subtitle="Moderation queue (community violations)" />
      <AdminNav />

      <div className="mx-auto w-full max-w-5xl space-y-4 p-4 md:p-6">
        <div className="flex gap-1 rounded-lg border border-line bg-bg-soft p-1 text-sm">
          {STATUSES.map((s) => (
            <button
              key={s || "all"}
              onClick={() => setStatus(s)}
              className={cn(
                "flex-1 rounded-md px-3 py-1.5 capitalize transition",
                status === s ? "bg-brand text-white" : "text-muted hover:text-content",
              )}
            >
              {s || "All"}
            </button>
          ))}
        </div>

        {isLoading ? (
          Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-24 rounded-card" />)
        ) : isError ? (
          <ErrorState message="Couldn't load reports." onRetry={() => refetch()} />
        ) : violations.length === 0 ? (
          <EmptyState title="Queue is clear" hint="No open reports — nice." />
        ) : (
          <ul className="space-y-2">
            {violations.map((v) => {
              const Icon = SUBJECT_ICONS[v.subject_kind] ?? Flag;
              return (
                <li key={v.id} className="rounded-card border border-line bg-bg-soft p-4">
                  <div className="flex items-start gap-3">
                    <Icon className="mt-0.5 h-5 w-5 shrink-0 text-muted" />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="rounded-full bg-danger/15 px-2 py-0.5 text-xs font-medium text-danger">{v.type}</span>
                        <span className={cn("rounded-full px-2 py-0.5 text-xs font-medium", STATUS_STYLE[v.status] ?? "")}>
                          {v.status}
                        </span>
                        <span className="text-xs text-muted">· {timeAgo(v.created_at)}</span>
                      </div>
                      <p className="mt-1 text-sm">
                        Against{" "}
                        {v.user ? (
                          <Link href={`/u/${v.user.username}`} className="text-brand hover:underline">@{v.user.username}</Link>
                        ) : (
                          <span className="text-muted">unknown user</span>
                        )}
                        {v.reporter && (
                          <> · reported by <Link href={`/u/${v.reporter.username}`} className="text-brand hover:underline">@{v.reporter.username}</Link></>
                        )}
                      </p>
                      {v.subject_snippet && (
                        <blockquote className="mt-2 rounded-lg border-l-2 border-line bg-surface px-3 py-2 text-sm italic text-muted">
                          “{v.subject_snippet.slice(0, 280)}{v.subject_snippet.length > 280 ? "…" : ""}”
                        </blockquote>
                      )}
                      {v.evidence && <p className="mt-2 text-xs text-muted">Reason: {v.evidence}</p>}
                    </div>
                    {v.status === "open" && (
                      <Button size="sm" variant="secondary" onClick={() => setTarget(v)}>Resolve</Button>
                    )}
                  </div>
                </li>
              );
            })}
            {hasNextPage && (
              <div className="flex justify-center pt-2">
                <Button variant="secondary" onClick={() => fetchNextPage()} loading={isFetchingNextPage}>Load more</Button>
              </div>
            )}
          </ul>
        )}
      </div>

      {target && (
        <ResolveDialog
          violation={target}
          loading={resolve.isPending}
          onClose={() => setTarget(null)}
          onResolve={async (action, days, notes) => {
            try {
              await resolve.mutateAsync({ id: target.id, action_type: action, days, notes });
              toast.success("Action applied.");
              setTarget(null);
            } catch (e) {
              toast.error(e instanceof ApiError ? e.message : "Failed.");
            }
          }}
        />
      )}
    </>
  );
}

function ResolveDialog({
  violation,
  loading,
  onClose,
  onResolve,
}: {
  violation: Violation;
  loading: boolean;
  onClose: () => void;
  onResolve: (action: ResolveAction, days?: number, notes?: string) => void;
}) {
  const [action, setAction] = useState<ResolveAction>("warn");
  const [days, setDays] = useState<7 | 14 | 30>(7);
  const [notes, setNotes] = useState("");

  const actions: { value: ResolveAction; label: string; tone?: "danger" }[] = [
    { value: "dismiss", label: "Dismiss report" },
    { value: "warn", label: "Warn user" },
    { value: "suspend", label: "Suspend user" },
    { value: "ban", label: "Ban user", tone: "danger" },
    ...(violation.subject_kind !== "user"
      ? [{ value: "remove_content" as const, label: `Remove ${violation.subject_kind}` }]
      : []),
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4" onClick={onClose}>
      <div className="w-full max-w-sm rounded-2xl border border-line bg-bg-soft p-6" onClick={(e) => e.stopPropagation()}>
        <h2 className="text-lg font-semibold">Resolve report</h2>
        <p className="mt-1 text-xs text-muted">Against {violation.user?.username ? `@${violation.user.username}` : "user"} · {violation.type}</p>

        <div className="mt-4 space-y-2">
          {actions.map((a) => (
            <label
              key={a.value}
              className={cn(
                "flex cursor-pointer items-center gap-2 rounded-lg border px-3 py-2 text-sm",
                action === a.value ? "border-brand bg-brand/10 text-content" : "border-line bg-bg",
              )}
            >
              <input type="radio" name="action" value={a.value} checked={action === a.value} onChange={() => setAction(a.value)} className="accent-brand" />
              <span className={cn(a.tone === "danger" && "text-danger")}>{a.label}</span>
            </label>
          ))}
        </div>

        {action === "suspend" && (
          <div className="mt-3 flex gap-2">
            {[7, 14, 30].map((d) => (
              <button
                key={d}
                onClick={() => setDays(d as 7 | 14 | 30)}
                className={cn(
                  "flex-1 rounded-lg border px-3 py-2 text-sm",
                  days === d ? "border-brand bg-brand/10" : "border-line",
                )}
              >
                {d} days
              </button>
            ))}
          </div>
        )}

        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          rows={3}
          maxLength={500}
          placeholder="Notes for the audit log (optional)…"
          className="mt-3 w-full resize-none rounded-lg border border-line bg-bg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand/60"
        />

        <div className="mt-4 flex gap-2">
          <Button variant="secondary" onClick={onClose} className="flex-1">Cancel</Button>
          <Button onClick={() => onResolve(action, action === "suspend" ? days : undefined, notes.trim() || undefined)} loading={loading} className="flex-1">
            Apply
          </Button>
        </div>
      </div>
    </div>
  );
}
