"use client";

import { PostCard } from "@/components/feed/PostCard";
import { Button } from "@/components/ui/Button";
import { PageHeader } from "@/components/ui/PageHeader";
import { CardSkeleton, EmptyState, ErrorState } from "@/components/ui/States";
import { useHashtagPosts } from "@/lib/hooks/use-hashtags";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { useParams } from "next/navigation";

export default function HashtagPage() {
  const params = useParams<{ tag: string }>();
  const tag = decodeURIComponent(params.tag);
  const { data, isLoading, isError, refetch, fetchNextPage, hasNextPage, isFetchingNextPage } = useHashtagPosts(tag);
  const posts = data?.pages.flatMap((p) => p.data) ?? [];

  return (
    <>
      <PageHeader title={`#${tag}`} subtitle="Posts with this hashtag" />
      <div className="mx-auto w-full max-w-2xl space-y-4 p-4">
        <Link href="/feed" className="inline-flex items-center gap-1 text-sm text-muted hover:text-content">
          <ArrowLeft className="h-4 w-4" /> Back to feed
        </Link>

        {isLoading ? (
          <>
            <CardSkeleton />
            <CardSkeleton />
          </>
        ) : isError ? (
          <ErrorState message="Couldn't load these posts." onRetry={() => refetch()} />
        ) : posts.length === 0 ? (
          <EmptyState title={`No posts for #${tag} yet`} hint="Be the first to use this hashtag." />
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
    </>
  );
}
