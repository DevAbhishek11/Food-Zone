"use client";

import { AdminNav } from "@/components/admin/AdminNav";
import { Avatar } from "@/components/ui/Avatar";
import { Button } from "@/components/ui/Button";
import { PageHeader } from "@/components/ui/PageHeader";
import { Skeleton } from "@/components/ui/Skeleton";
import { EmptyState, ErrorState } from "@/components/ui/States";
import { cn } from "@/lib/cn";
import { useAdminUsers, useUserModeration } from "@/lib/hooks/use-admin";
import { toast } from "@/lib/toast-store";
import type { User } from "@/lib/types";
import { Search } from "lucide-react";
import { useState } from "react";

const STATUS_STYLE: Record<string, string> = {
  active: "bg-success/15 text-success",
  suspended: "bg-warning/15 text-warning",
  banned: "bg-danger/15 text-danger",
  deactivated: "bg-surface text-muted",
  pending: "bg-info/15 text-info",
};

export default function AdminUsersPage() {
  const [q, setQ] = useState("");
  const [status, setStatus] = useState("");
  const { data, isLoading, isError, refetch, fetchNextPage, hasNextPage, isFetchingNextPage } =
    useAdminUsers({ q: q || undefined, status: status || undefined });
  const users = data?.pages.flatMap((p) => p.data) ?? [];

  return (
    <>
      <PageHeader title="Users" subtitle="Moderate accounts" />
      <AdminNav />

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

        {isLoading ? (
          Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-16 rounded-card" />)
        ) : isError ? (
          <ErrorState message="Couldn't load users. Admins only." onRetry={() => refetch()} />
        ) : users.length === 0 ? (
          <EmptyState title="No users found" />
        ) : (
          <>
            {users.map((u) => <UserRow key={u.id} user={u} statusStyle={STATUS_STYLE[u.status] ?? ""} />)}
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

function UserRow({ user, statusStyle }: { user: User; statusStyle: string }) {
  const { ban, suspend, unban } = useUserModeration();
  const [days, setDays] = useState(7);
  const isAdmin = user.role === "admin" || user.role === "super_admin";

  const run = async (fn: () => Promise<unknown>, msg: string) => {
    try {
      await fn();
      toast.success(msg);
    } catch {
      toast.error("Action failed.");
    }
  };

  return (
    <div className="flex flex-wrap items-center gap-3 rounded-card border border-line bg-bg-soft p-3">
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
              <select
                value={days}
                onChange={(e) => setDays(Number(e.target.value))}
                className="h-8 rounded-lg border border-line bg-bg px-2 text-xs focus:outline-none"
              >
                <option value={7}>7d</option>
                <option value={14}>14d</option>
                <option value={30}>30d</option>
              </select>
              <Button size="sm" variant="secondary" loading={suspend.isPending} onClick={() => run(() => suspend.mutateAsync({ id: user.id, days }), "User suspended")}>
                Suspend
              </Button>
              <Button size="sm" variant="danger" loading={ban.isPending} onClick={() => run(() => ban.mutateAsync({ id: user.id }), "User banned")}>
                Ban
              </Button>
            </>
          ) : (
            <Button size="sm" loading={unban.isPending} onClick={() => run(() => unban.mutateAsync(user.id), "User reinstated")}>
              Reinstate
            </Button>
          )}
        </div>
      )}
    </div>
  );
}
