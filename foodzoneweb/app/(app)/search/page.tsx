"use client";

import { PostCard } from "@/components/feed/PostCard";
import { Avatar } from "@/components/ui/Avatar";
import { Button } from "@/components/ui/Button";
import { PageHeader } from "@/components/ui/PageHeader";
import { EmptyState } from "@/components/ui/States";
import { VendorCard } from "@/components/vendors/VendorCard";
import { cn } from "@/lib/cn";
import { useCombinedSearch, useTypedSearch } from "@/lib/hooks/use-search";
import { useDebounce } from "@/lib/use-debounce";
import type { Post, User, Vendor } from "@/lib/types";
import { Loader2, Search } from "lucide-react";
import Link from "next/link";
import { useState } from "react";

type Tab = "all" | "users" | "vendors" | "posts";
const TABS: { id: Tab; label: string }[] = [
  { id: "all", label: "All" },
  { id: "users", label: "People" },
  { id: "vendors", label: "Restaurants" },
  { id: "posts", label: "Posts" },
];

export default function SearchPage() {
  const [query, setQuery] = useState("");
  const [tab, setTab] = useState<Tab>("all");
  const q = useDebounce(query.trim());
  const ready = q.length >= 2;

  return (
    <>
      <PageHeader title="Search" subtitle="Find people, restaurants and posts" />

      <div className="mx-auto w-full max-w-2xl space-y-4 p-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
          <input
            autoFocus
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search FoodZone…"
            className="h-11 w-full rounded-lg border border-line bg-bg-soft pl-9 pr-3 text-sm focus:outline-none focus:ring-2 focus:ring-brand/60"
          />
        </div>

        <div className="flex gap-1 border-b border-line">
          {TABS.map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={cn(
                "border-b-2 px-3 py-2 text-sm font-medium transition-colors",
                tab === t.id ? "border-brand text-brand" : "border-transparent text-muted hover:text-content",
              )}
            >
              {t.label}
            </button>
          ))}
        </div>

        {!ready ? (
          <EmptyState title="Search FoodZone" hint="Type at least 2 characters to begin." />
        ) : tab === "all" ? (
          <AllResults q={q} onSeeAll={setTab} />
        ) : tab === "users" ? (
          <UsersResults q={q} />
        ) : tab === "vendors" ? (
          <VendorsResults q={q} />
        ) : (
          <PostsResults q={q} />
        )}
      </div>
    </>
  );
}

function Spinner() {
  return (
    <div className="flex justify-center py-6">
      <Loader2 className="h-6 w-6 animate-spin text-muted" />
    </div>
  );
}

function UserRow({ user }: { user: User }) {
  return (
    <Link href={`/u/${user.username}`} className="flex items-center gap-3 rounded-card border border-line bg-bg-soft p-3 hover:bg-surface">
      <Avatar src={user.profile?.avatar} name={user.name} size={40} />
      <div className="min-w-0">
        <p className="truncate text-sm font-medium">{user.name}</p>
        <p className="truncate text-xs text-muted">@{user.username}</p>
      </div>
    </Link>
  );
}

function AllResults({ q, onSeeAll }: { q: string; onSeeAll: (t: Tab) => void }) {
  const { data, isLoading } = useCombinedSearch(q);
  if (isLoading) return <Spinner />;
  if (!data) return null;
  const empty = data.users.length === 0 && data.vendors.length === 0 && data.posts.length === 0;
  if (empty) return <EmptyState title="No results" hint={`Nothing matched “${q}”.`} />;

  return (
    <div className="space-y-5">
      {data.users.length > 0 && (
        <Group title="People" onSeeAll={() => onSeeAll("users")}>
          {data.users.map((u) => <UserRow key={u.id} user={u} />)}
        </Group>
      )}
      {data.vendors.length > 0 && (
        <Group title="Restaurants" onSeeAll={() => onSeeAll("vendors")}>
          {data.vendors.map((v) => <VendorCard key={v.id} vendor={v} />)}
        </Group>
      )}
      {data.posts.length > 0 && (
        <Group title="Posts" onSeeAll={() => onSeeAll("posts")}>
          {data.posts.map((p) => <PostCard key={p.id} post={p} />)}
        </Group>
      )}
    </div>
  );
}

function Group({ title, onSeeAll, children }: { title: string; onSeeAll: () => void; children: React.ReactNode }) {
  return (
    <section>
      <div className="mb-2 flex items-center justify-between">
        <h2 className="text-sm font-semibold text-muted">{title}</h2>
        <button onClick={onSeeAll} className="text-xs text-brand hover:underline">See all</button>
      </div>
      <div className="space-y-2">{children}</div>
    </section>
  );
}

function LoadMore({ query }: { query: ReturnType<typeof useTypedSearch> }) {
  if (!query.hasNextPage) return null;
  return (
    <div className="flex justify-center pt-2">
      <Button variant="secondary" onClick={() => query.fetchNextPage()} loading={query.isFetchingNextPage}>Load more</Button>
    </div>
  );
}

function UsersResults({ q }: { q: string }) {
  const query = useTypedSearch(q, "users");
  const items = (query.data?.pages.flatMap((p) => p.data) ?? []) as User[];
  if (query.isLoading) return <Spinner />;
  if (items.length === 0) return <EmptyState title="No people found" />;
  return (
    <div className="space-y-2">
      {items.map((u) => <UserRow key={u.id} user={u} />)}
      <LoadMore query={query} />
    </div>
  );
}

function VendorsResults({ q }: { q: string }) {
  const query = useTypedSearch(q, "vendors");
  const items = (query.data?.pages.flatMap((p) => p.data) ?? []) as Vendor[];
  if (query.isLoading) return <Spinner />;
  if (items.length === 0) return <EmptyState title="No restaurants found" />;
  return (
    <div className="space-y-2">
      {items.map((v) => <VendorCard key={v.id} vendor={v} />)}
      <LoadMore query={query} />
    </div>
  );
}

function PostsResults({ q }: { q: string }) {
  const query = useTypedSearch(q, "posts");
  const items = (query.data?.pages.flatMap((p) => p.data) ?? []) as Post[];
  if (query.isLoading) return <Spinner />;
  if (items.length === 0) return <EmptyState title="No posts found" />;
  return (
    <div className="space-y-3">
      {items.map((p) => <PostCard key={p.id} post={p} />)}
      <LoadMore query={query} />
    </div>
  );
}
