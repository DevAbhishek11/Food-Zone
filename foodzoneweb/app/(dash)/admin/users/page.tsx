"use client";

import { Avatar } from "@/components/ui/Avatar";
import { Button } from "@/components/ui/Button";
import { PageHeader } from "@/components/ui/PageHeader";
import { Skeleton } from "@/components/ui/Skeleton";
import { EmptyState, ErrorState } from "@/components/ui/States";
import { cn } from "@/lib/cn";
import { exportCsv } from "@/lib/csv";
import { useAdminUsers, useUserModeration } from "@/lib/hooks/use-admin";
import { toast } from "@/lib/toast-store";
import type { User } from "@/lib/types";
import { Download, Search, X } from "lucide-react";
import { useMemo, useState } from "react";

const STATUS_STYLE: Record<string, string> = {
  active: "bg-success/15 text-success",
  suspended: "bg-warning/15 text-warning",
  banned: "bg-danger/15 text-danger",
  deactivated: "bg-surface text-muted",
  pending: "bg-info/15 text-info",
};

const isAdminRole = (u: User) => u.role === "admin" || u.role === "super_admin";

export default function AdminUsersPage() {
  const [q, setQ] = useState("");
  const [status, setStatus] = useState("");
  const [selected, setSelected] = useState<Set<number>>(new Set());
  const [bulkDays, setBulkDays] = useState(7);
  const { data, isLoading, isError, refetch, fetchNextPage, hasNextPage, isFetchingNextPage } =
    useAdminUsers({ q: q || undefined, status: status || undefined });
  const { ban, suspend, unban, bulk } = useUserModeration();

  const users = useMemo(() => data?.pages.flatMap((p) => p.data) ?? [], [data]);
  const selectable = users.filter((u) => !isAdminRole(u));
  const allSelected = selectable.length > 0 && selectable.every((u) => selected.has(u.id));

  const toggle = (id: number) =>
    setSelected((s) => {
      const next = new Set(s);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  const toggleAll = () =>
    setSelected(allSelected ? new Set() : new Set(selectable.map((u) => u.id)));

  const runBulk = async (action: "ban" | "suspend" | "unban") => {
    const ids = [...selected];
    if (ids.length === 0) return;
    try {
      const res = await bulk.mutateAsync({ action, user_ids: ids, days: action === "suspend" ? bulkDays : undefined });
      toast.success(`${action} applied to ${res.data.affected} user(s)`);
      setSelected(new Set());
    } catch {
      toast.error("Bulk action failed.");
    }
  };

  const exportRows = () =>
    exportCsv(`users-${new Date().toISOString().slice(0, 10)}`, users.map((u) => ({
      id: u.id, name: u.name, username: u.username, email: u.email, role: u.role, status: u.status,
    })));

  return (
    <>
      <PageHeader
        title="Users"
        subtitle="Moderate accounts"
        action={
          <Button size="sm" variant="secondary" onClick={exportRows} disabled={users.length === 0}>
            <Download className="h-4 w-4" /> CSV
          </Button>
        }
      />

      <div className="mx-auto w-full max-w-3xl space-y-4 p-4 md:p-6">
        <div className="flex flex-col gap-3 sm:flex-row">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search name, username, email…"
              className="h-10 w-full rounded-lg border border-line bg-bg-soft pl-9 pr-3 text-sm focus:outline-none focus:ring-2 focus:ring-brand/60"
            />
          </div>
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            className="h-10 rounded-lg border border-line bg-bg-soft px-3 text-sm focus:outline-none focus:ring-2 focus:ring-brand/60"
          >
            <option value="">All statuses</option>
            <option value="active">Active</option>
            <option value="suspended">Suspended</option>
            <option value="banned">Banned</option>
          </select>
        </div>

        {/* Bulk action bar */}
        {selected.size > 0 && (
          <div className="flex flex-wrap items-center gap-2 rounded-lg border border-brand/40 bg-brand/5 p-2">
            <span className="px-1 text-sm font-medium">{selected.size} selected</span>
            <div className="ml-auto flex flex-wrap items-center gap-2">
              <select value={bulkDays} onChange={(e) => setBulkDays(Number(e.target.value))} className="h-8 rounded-lg border border-line bg-bg px-2 text-xs">
                <option value={7}>7d</option><option value={14}>14d</option><option value={30}>30d</option>
              </select>
              <Button size="sm" variant="secondary" loading={bulk.isPending} onClick={() => runBulk("suspend")}>Suspend</Button>
              <Button size="sm" variant="danger" loading={bulk.isPending} onClick={() => runBulk("ban")}>Ban</Button>
              <Button size="sm" loading={bulk.isPending} onClick={() => runBulk("unban")}>Reinstate</Button>
              <button onClick={() => setSelected(new Set())} aria-label="Clear" className="text-muted hover:text-content"><X className="h-4 w-4" /></button>
            </div>
          </div>
        )}

        {isLoading ? (
          Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-16 rounded-card" />)
        ) : isError ? (
          <ErrorState message="Couldn't load users. Admins only." onRetry={() => refetch()} />
        ) : users.length === 0 ? (
          <EmptyState title="No users found" />
        ) : (
          <>
            <label className="flex items-center gap-2 px-1 text-xs text-muted">
              <input type="checkbox" checked={allSelected} onChange={toggleAll} className="h-4 w-4 accent-brand" />
              Select all on page
            </label>
            {users.map((u) => (
              <UserRow
                key={u.id}
                user={u}
                statusStyle={STATUS_STYLE[u.status] ?? ""}
                selected={selected.has(u.id)}
                onToggle={() => toggle(u.id)}
                mod={{ ban, suspend, unban }}
              />
            ))}
            {hasNextPage && (
              <div className="flex justify-center">
                <Button variant="secondary" onClick={() => fetchNextPage()} loading={isFetchingNextPage}>Load more</Button>
              </div>
            )}
          </>
        )}
      </div>
    </>
  );
}

type Mod = Pick<ReturnType<typeof useUserModeration>, "ban" | "suspend" | "unban">;

function UserRow({ user, statusStyle, selected, onToggle, mod }: {
  user: User; statusStyle: string; selected: boolean; onToggle: () => void; mod: Mod;
}) {
  const [days, setDays] = useState(7);
  const isAdmin = isAdminRole(user);

  const run = async (fn: () => Promise<unknown>, msg: string) => {
    try { await fn(); toast.success(msg); } catch { toast.error("Action failed."); }
  };

  return (
    <div className="flex flex-wrap items-center gap-3 rounded-card border border-line bg-bg-soft p-3">
      {!isAdmin ? (
        <input type="checkbox" checked={selected} onChange={onToggle} className="h-4 w-4 accent-brand" />
      ) : (
        <span className="w-4" />
      )}
      <Avatar src={user.profile?.avatar} name={user.name} size={40} />
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium">{user.name}</p>
        <p className="truncate text-xs text-muted">@{user.username} · {user.email}</p>
      </div>
      <span className="rounded-full bg-surface px-2 py-0.5 text-xs capitalize text-muted">{user.role}</span>
      <span className={cn("rounded-full px-2 py-0.5 text-xs font-medium capitalize", statusStyle)}>{user.status}</span>

      {!isAdmin && (
        <div className="flex w-full items-center justify-end gap-2 sm:w-auto">
          {user.status === "active" ? (
            <>
              <select value={days} onChange={(e) => setDays(Number(e.target.value))} className="h-8 rounded-lg border border-line bg-bg px-2 text-xs focus:outline-none">
                <option value={7}>7d</option><option value={14}>14d</option><option value={30}>30d</option>
              </select>
              <Button size="sm" variant="secondary" loading={mod.suspend.isPending} onClick={() => run(() => mod.suspend.mutateAsync({ id: user.id, days }), "User suspended")}>Suspend</Button>
              <Button size="sm" variant="danger" loading={mod.ban.isPending} onClick={() => run(() => mod.ban.mutateAsync({ id: user.id }), "User banned")}>Ban</Button>
            </>
          ) : (
            <Button size="sm" loading={mod.unban.isPending} onClick={() => run(() => mod.unban.mutateAsync(user.id), "User reinstated")}>Reinstate</Button>
          )}
        </div>
      )}
    </div>
  );
}
