"use client";

import { Avatar } from "@/components/ui/Avatar";
import { Button } from "@/components/ui/Button";
import { PageHeader } from "@/components/ui/PageHeader";
import { EmptyState, ErrorState } from "@/components/ui/States";
import { Skeleton } from "@/components/ui/Skeleton";
import { VendorCard } from "@/components/vendors/VendorCard";
import {
  type SuggestedUserRow,
  type TrendingHashtagRow,
  type TrendingItemRow,
  type TrendingVendorRow,
  useExplore,
} from "@/lib/hooks/use-explore";
import { useToggleFollow } from "@/lib/hooks/use-users";
import { ApiError } from "@/lib/api";
import { toast } from "@/lib/toast-store";
import type { Post } from "@/lib/types";
import { ArrowUpRight, Hash, Heart, MapPin, Search, TrendingDown, TrendingUp, UtensilsCrossed } from "lucide-react";
import dynamic from "next/dynamic";
import Link from "next/link";
import { useEffect, useState } from "react";

const ExploreMap = dynamic(() => import("@/components/explore/ExploreMap").then((m) => m.ExploreMap), {
  ssr: false,
  loading: () => <div className="h-[480px] rounded-card border border-line bg-bg-soft" />,
});

const FILTERS = ["all", "food", "people", "vendors", "hashtags"] as const;
type Filter = (typeof FILTERS)[number];

const HERO_PLACEHOLDERS = [
  "Search restaurants…",
  "Find food lovers…",
  "Discover trending posts…",
];

export default function ExplorePage() {
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [filter, setFilter] = useState<Filter>("all");
  const [showMap, setShowMap] = useState(false);
  const [search, setSearch] = useState("");
  const [placeholderIdx, setPlaceholderIdx] = useState(0);

  // Request geolocation once for the nearby section.
  useEffect(() => {
    if (typeof navigator === "undefined" || !navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(
      (pos) => setCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
      () => {},
      { timeout: 6000, maximumAge: 5 * 60 * 1000 },
    );
  }, []);

  // Rotating hero placeholder.
  useEffect(() => {
    const t = setInterval(() => setPlaceholderIdx((i) => (i + 1) % HERO_PLACEHOLDERS.length), 2500);
    return () => clearInterval(t);
  }, []);

  const { data, isLoading, isError, refetch } = useExplore(coords);

  const submitSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const q = search.trim();
    if (q) window.location.href = `/search?q=${encodeURIComponent(q)}`;
  };

  const showFood = filter === "all" || filter === "food";
  const showPeople = filter === "all" || filter === "people";
  const showVendors = filter === "all" || filter === "vendors";
  const showHashtags = filter === "all" || filter === "hashtags";

  return (
    <>
      <PageHeader
        title="Explore"
        subtitle="Trending posts, hot restaurants and people you may know"
        action={
          <Button variant="ghost" size="sm" onClick={() => setShowMap((v) => !v)} leftIcon={<MapPin className="h-4 w-4" />}>
            {showMap ? "Hide map" : "Map view"}
          </Button>
        }
      />

      {/* Hero search */}
      <section className="border-b border-line bg-gradient-to-br from-brand/10 via-bg to-bg px-4 py-10 md:py-14">
        <form onSubmit={submitSearch} className="mx-auto flex w-full max-w-2xl items-center gap-2 rounded-card border border-line bg-bg-soft px-4 py-3 shadow-sm">
          <Search className="h-5 w-5 text-muted" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={HERO_PLACEHOLDERS[placeholderIdx]}
            className="flex-1 bg-transparent text-base focus:outline-none"
          />
          <Button type="submit" size="sm" disabled={!search.trim()}>Go</Button>
        </form>
      </section>

      {/* Category bar */}
      <div className="sticky top-[72px] z-20 flex gap-2 overflow-x-auto border-b border-line bg-bg/80 px-4 py-3 backdrop-blur md:px-6">
        {FILTERS.map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`whitespace-nowrap rounded-full border px-3 py-1.5 text-sm capitalize transition-colors ${
              filter === f
                ? "border-brand bg-brand text-white"
                : "border-line bg-bg-soft text-muted hover:text-content"
            }`}
          >
            {f}
          </button>
        ))}
      </div>

      <div className="mx-auto w-full max-w-6xl space-y-10 p-4 md:p-6">
        {showMap && (
          <section>
            <SectionHeader icon={MapPin} title="Vendors on the map" subtitle="OpenStreetMap, no API key needed" />
            <ExploreMap />
          </section>
        )}

        {isError && <ErrorState message="Could not load Explore." onRetry={() => refetch()} />}
        {isLoading && <ExploreSkeleton />}

        {data && (
          <>
            {showFood && data.trending_posts.length > 0 && (
              <TrendingPosts posts={data.trending_posts} />
            )}

            {showVendors && data.trending_vendors.length > 0 && (
              <TrendingVendors rows={data.trending_vendors} />
            )}

            {showHashtags && data.trending_hashtags.length > 0 && (
              <TrendingHashtags rows={data.trending_hashtags} />
            )}

            {showFood && data.trending_items.length > 0 && (
              <TrendingItems rows={data.trending_items} />
            )}

            {showPeople && data.suggested_users.length > 0 && (
              <SuggestedUsers rows={data.suggested_users} />
            )}

            {showVendors && coords && data.nearby_vendors.length > 0 && (
              <NearbyVendors rows={data.nearby_vendors} />
            )}

            {!data.trending_posts.length &&
              !data.trending_vendors.length &&
              !data.trending_hashtags.length &&
              !data.trending_items.length &&
              !data.suggested_users.length &&
              !data.nearby_vendors.length && (
                <EmptyState title="Nothing trending yet" hint="Check back soon — Explore grows with the community." />
              )}
          </>
        )}
      </div>
    </>
  );
}

function SectionHeader({
  icon: Icon,
  title,
  subtitle,
  href,
}: {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  subtitle?: string;
  href?: string;
}) {
  return (
    <div className="mb-3 flex items-end justify-between gap-3">
      <div>
        <h2 className="flex items-center gap-2 text-lg font-semibold">
          <Icon className="h-5 w-5 text-brand" />
          {title}
        </h2>
        {subtitle && <p className="text-xs text-muted">{subtitle}</p>}
      </div>
      {href && (
        <Link href={href} className="text-sm text-brand hover:underline">
          See all
        </Link>
      )}
    </div>
  );
}

function TrendingPosts({ posts }: { posts: Post[] }) {
  return (
    <section>
      <SectionHeader icon={TrendingUp} title="Trending Now" subtitle="Top posts in the last 6 hours" />
      <div className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-4">
        {posts.map((p) => (
          <Link
            key={p.id}
            href={`/posts/${p.id}`}
            className="group flex flex-col overflow-hidden rounded-card border border-line bg-bg-soft transition-colors hover:border-brand/50"
          >
            <div className="relative aspect-square w-full bg-surface">
              {p.media[0] ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={p.media[0].url} alt="" className="h-full w-full object-cover" />
              ) : (
                <div className="flex h-full items-center justify-center p-3 text-center text-sm text-muted">
                  {p.body?.slice(0, 80) ?? "—"}
                </div>
              )}
              <div className="absolute inset-x-0 bottom-0 flex items-center gap-3 bg-gradient-to-t from-black/60 to-transparent p-2 text-xs text-white">
                <span className="flex items-center gap-1"><Heart className="h-3.5 w-3.5" />{p.likes_count}</span>
                <span>·</span>
                <span>{p.shares_count} shares</span>
              </div>
            </div>
            <div className="flex items-center gap-2 p-2">
              <Avatar src={p.author.avatar} name={p.author.name} size={20} />
              <span className="truncate text-xs text-muted">@{p.author.username}</span>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}

function TrendingVendors({ rows }: { rows: TrendingVendorRow[] }) {
  return (
    <section>
      <SectionHeader icon={UtensilsCrossed} title="🔥 Hot Restaurants Today" subtitle="Most orders in the last 24 hours" />
      <div className="-mx-4 flex gap-3 overflow-x-auto px-4 pb-2 md:mx-0 md:px-0">
        {rows.map((r) => (
          <div key={r.vendor.id} className="relative w-64 shrink-0">
            <VendorCard vendor={r.vendor} />
            <div className="absolute right-2 top-2 flex items-center gap-1 rounded-full bg-bg/90 px-2 py-1 text-xs">
              {r.order_delta >= 0 ? (
                <TrendingUp className="h-3.5 w-3.5 text-success" />
              ) : (
                <TrendingDown className="h-3.5 w-3.5 text-danger" />
              )}
              <span className={r.order_delta >= 0 ? "text-success" : "text-danger"}>
                {r.order_delta >= 0 ? "+" : ""}{r.order_delta}%
              </span>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

function TrendingHashtags({ rows }: { rows: TrendingHashtagRow[] }) {
  const max = Math.max(...rows.map((r) => r.count), 1);
  return (
    <section>
      <SectionHeader icon={Hash} title="📈 Trending Hashtags" subtitle="Last 24 hours" />
      <div className="flex flex-wrap gap-2">
        {rows.map((r) => {
          const ratio = r.count / max;
          // Size scales between 14px and 28px.
          const size = Math.round(14 + ratio * 14);
          return (
            <Link
              key={r.tag}
              href={`/hashtag/${r.tag}`}
              className="rounded-full border border-line bg-bg-soft px-3 py-1.5 text-brand transition-colors hover:bg-brand/10"
              style={{ fontSize: `${size}px`, lineHeight: 1.2 }}
            >
              #{r.tag}
              <span className="ml-1 text-xs text-muted">·{r.count}</span>
            </Link>
          );
        })}
      </div>
    </section>
  );
}

function TrendingItems({ rows }: { rows: TrendingItemRow[] }) {
  return (
    <section>
      <SectionHeader icon={UtensilsCrossed} title="🍽 Most Ordered Today" subtitle="Globally popular menu items" />
      <div className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-5">
        {rows.map((r) => (
          <div key={r.item.id} className="overflow-hidden rounded-card border border-line bg-bg-soft">
            <div className="aspect-square w-full bg-surface">
              {r.item.images?.[0] ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={r.item.images[0]} alt="" className="h-full w-full object-cover" />
              ) : null}
            </div>
            <div className="p-3">
              <p className="truncate font-medium">{r.item.name}</p>
              <p className="text-xs text-muted">{r.recent_orders} ordered today</p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

function SuggestedUsers({ rows }: { rows: SuggestedUserRow[] }) {
  return (
    <section>
      <SectionHeader icon={Heart} title="👥 People You May Know" subtitle="Foodies followed by people you follow" />
      <div className="-mx-4 flex gap-3 overflow-x-auto px-4 pb-2 md:mx-0 md:grid md:grid-cols-3 md:px-0 lg:grid-cols-5">
        {rows.map((r) => (
          <SuggestedUserCard key={r.user.id} row={r} />
        ))}
      </div>
    </section>
  );
}

function SuggestedUserCard({ row }: { row: SuggestedUserRow }) {
  const { follow } = useToggleFollow(row.user.username);
  const [followed, setFollowed] = useState(false);

  const onFollow = async () => {
    try {
      await follow.mutateAsync(row.user.id);
      setFollowed(true);
    } catch (e) {
      toast.error(e instanceof ApiError ? e.message : "Could not follow. Try again.");
    }
  };

  return (
    <div className="flex w-44 shrink-0 flex-col items-center gap-2 rounded-card border border-line bg-bg-soft p-4 text-center md:w-auto">
      <Avatar src={row.user.avatar} name={row.user.name} size={56} />
      <Link href={`/u/${row.user.username}`} className="truncate font-semibold hover:text-brand">{row.user.name}</Link>
      <p className="truncate text-xs text-muted">
        {row.reason === "mutuals" && row.mutual_count > 0
          ? `${row.mutual_count} mutual ${row.mutual_count === 1 ? "follow" : "follows"}`
          : "Popular on FoodZone"}
      </p>
      <Button size="sm" variant={followed ? "ghost" : "primary"} disabled={followed} loading={follow.isPending} onClick={onFollow} className="w-full">
        {followed ? "Following" : "Follow"}
      </Button>
    </div>
  );
}

function NearbyVendors({ rows }: { rows: (TrendingVendorRow["vendor"] & { distance_km: number })[] }) {
  return (
    <section>
      <SectionHeader icon={MapPin} title="Near you" subtitle="Within 10 km" />
      <div className="-mx-4 flex gap-3 overflow-x-auto px-4 pb-2 md:mx-0 md:px-0">
        {rows.map((v) => (
          <div key={v.id} className="relative w-64 shrink-0">
            <VendorCard vendor={v} />
            <span className="absolute left-2 top-2 flex items-center gap-1 rounded-full bg-bg/90 px-2 py-0.5 text-xs">
              <ArrowUpRight className="h-3.5 w-3.5" /> {v.distance_km.toFixed(1)} km
            </span>
          </div>
        ))}
      </div>
    </section>
  );
}

function ExploreSkeleton() {
  return (
    <div className="space-y-6">
      <Skeleton className="h-6 w-40" />
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <Skeleton key={i} className="aspect-square w-full" />
        ))}
      </div>
    </div>
  );
}
