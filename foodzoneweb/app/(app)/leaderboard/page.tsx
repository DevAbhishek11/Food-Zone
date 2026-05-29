"use client";

import { Avatar } from "@/components/ui/Avatar";
import { PageHeader } from "@/components/ui/PageHeader";
import { EmptyState, ErrorState } from "@/components/ui/States";
import { useLeaderboard } from "@/lib/hooks/use-loyalty";
import { Crown, Medal, Trophy } from "lucide-react";
import Link from "next/link";
import { useState } from "react";

type LeaderboardType = "points" | "orders" | "reviews";

const TABS: { id: LeaderboardType; label: string }[] = [
  { id: "points", label: "Points" },
  { id: "orders", label: "Orders" },
  { id: "reviews", label: "Reviews" },
];

export default function LeaderboardPage() {
  const [type, setType] = useState<LeaderboardType>("points");
  const { data, isLoading, isError, refetch } = useLeaderboard(type);

  const rankIcon = (rank: number) => {
    if (rank === 1) return <Crown className="h-5 w-5 text-yellow-500" />;
    if (rank === 2) return <Medal className="h-5 w-5 text-zinc-400" />;
    if (rank === 3) return <Medal className="h-5 w-5 text-orange-700" />;
    return null;
  };

  return (
    <>
      <PageHeader title="Leaderboard" subtitle="Top foodies on FoodZone" />

      <div className="mx-auto w-full max-w-2xl p-4">
        <div className="mb-4 flex gap-2">
          {TABS.map((t) => (
            <button
              key={t.id}
              onClick={() => setType(t.id)}
              className={`rounded-full border px-3 py-1.5 text-sm transition-colors ${
                type === t.id ? "border-brand bg-brand text-white" : "border-line bg-bg-soft text-muted hover:text-content"
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {isError && <ErrorState message="Couldn't load leaderboard." onRetry={() => refetch()} />}
        {isLoading && (
          <div className="space-y-2">
            {Array.from({ length: 10 }).map((_, i) => (
              <div key={i} className="h-14 rounded-card bg-bg-soft" />
            ))}
          </div>
        )}
        {data && data.entries.length === 0 && (
          <EmptyState title="No entries yet" hint="The leaderboard fills up as people order and post." />
        )}
        {data && data.entries.length > 0 && (
          <ol className="space-y-1">
            {data.entries.map((entry) => (
              <li key={entry.user.id}>
                <Link
                  href={`/u/${entry.user.username}`}
                  className="flex items-center gap-3 rounded-card border border-line bg-bg-soft p-3 hover:bg-surface"
                >
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center font-semibold text-muted">
                    {rankIcon(entry.rank) ?? `#${entry.rank}`}
                  </span>
                  <Avatar name={entry.user.name} size={36} />
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-medium">{entry.user.name}</p>
                    <p className="truncate text-xs text-muted">@{entry.user.username}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold">{entry.score.toLocaleString()}</p>
                    <p className="text-xs text-muted">
                      {type === "points" ? "pts" : type === "orders" ? "orders" : "reviews"}
                    </p>
                  </div>
                </Link>
              </li>
            ))}
          </ol>
        )}

        {!isLoading && !isError && (
          <p className="mt-6 text-center text-xs text-muted">
            <Trophy className="mr-1 inline h-3.5 w-3.5" />
            Top 50 shown
          </p>
        )}
      </div>
    </>
  );
}
