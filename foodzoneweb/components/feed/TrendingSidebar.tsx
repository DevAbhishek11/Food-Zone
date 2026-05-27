"use client";

import { useTrendingHashtags } from "@/lib/hooks/use-hashtags";
import { Hash, TrendingUp } from "lucide-react";
import Link from "next/link";

export function TrendingSidebar() {
  const { data: tags, isLoading } = useTrendingHashtags();

  return (
    <aside className="hidden w-72 shrink-0 lg:block">
      <div className="sticky top-4 rounded-card border border-line bg-bg-soft p-4">
        <h2 className="flex items-center gap-2 text-sm font-semibold">
          <TrendingUp className="h-4 w-4 text-brand" /> Trending hashtags
        </h2>
        <ul className="mt-3 space-y-1">
          {isLoading ? (
            Array.from({ length: 5 }).map((_, i) => <li key={i} className="h-7 rounded skeleton" />)
          ) : (tags?.length ?? 0) === 0 ? (
            <li className="py-2 text-xs text-muted">Nothing trending yet — start posting!</li>
          ) : (
            tags!.map((t) => (
              <li key={t.tag}>
                <Link
                  href={`/hashtag/${t.tag}`}
                  className="flex items-center justify-between rounded-lg px-2 py-1.5 text-sm transition-colors hover:bg-surface"
                >
                  <span className="flex items-center gap-1 font-medium">
                    <Hash className="h-3.5 w-3.5 text-muted" />
                    {t.tag}
                  </span>
                  <span className="text-xs text-muted">{t.count} posts</span>
                </Link>
              </li>
            ))
          )}
        </ul>
      </div>
    </aside>
  );
}
