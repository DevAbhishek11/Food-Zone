"use client";

import { PostCard } from "@/components/feed/PostCard";
import { PostComposer } from "@/components/feed/PostComposer";
import { StoryBar } from "@/components/feed/StoryBar";
import { TrendingSidebar } from "@/components/feed/TrendingSidebar";
import { Button } from "@/components/ui/Button";
import { PageHeader } from "@/components/ui/PageHeader";
import { CardSkeleton, EmptyState, ErrorState } from "@/components/ui/States";
import { useFeed } from "@/lib/hooks/use-feed";
import { Search } from "lucide-react";
import Link from "next/link";

export default function FeedPage() {
  const { data, isLoading, isError, refetch, fetchNextPage, hasNextPage, isFetchingNextPage } = useFeed();

  const posts = data?.pages.flatMap((p) => p.data) ?? [];

  return (
    <>
      <PageHeader
        title="Feed"
        subtitle="What's cooking in your circle"
        action={
          <Link href="/search" aria-label="Search" className="rounded-lg p-2 text-muted hover:bg-surface hover:text-content">
            <Search className="h-5 w-5" />
          </Link>
        }
      />

      <div className="mx-auto flex w-full max-w-5xl justify-center gap-6 p-4">
        <div className="w-full max-w-2xl space-y-4">
          <StoryBar />
          <PostComposer />

        {isLoading ? (
          <>
            <CardSkeleton />
            <CardSkeleton />
          </>
        ) : isError ? (
          <ErrorState message="We couldn't load your feed." onRetry={() => refetch()} />
        ) : posts.length === 0 ? (
          <EmptyState
            title="Your feed is empty"
            hint="Follow people or create your first post above."
          />
        ) : (
          <>
            {posts.map((post) => (
              <PostCard key={post.id} post={post} />
            ))}
            {hasNextPage && (
              <div className="flex justify-center pt-2">
                <Button variant="secondary" onClick={() => fetchNextPage()} loading={isFetchingNextPage}>
                  Load more
                </Button>
              </div>
            )}
          </>
        )}
        </div>

        <TrendingSidebar />
      </div>
    </>
  );
}
