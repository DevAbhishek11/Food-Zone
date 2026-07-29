"use client";

import { PostCard } from "@/components/feed/PostCard";
import { Button } from "@/components/ui/Button";
import { PageHeader } from "@/components/ui/PageHeader";
import { CardSkeleton, EmptyState, ErrorState } from "@/components/ui/States";
import { ApiError } from "@/lib/api";
import { useFollowedHashtags, useHashtagPosts, useToggleHashtagFollow } from "@/lib/hooks/use-hashtags";
import { toast } from "@/lib/toast-store";
import { ArrowLeft, Bell, BellOff } from "lucide-react";
import Link from "next/link";
import { useParams } from "next/navigation";

export default function HashtagPage() {
  const params = useParams<{ tag: string }>();
  const tag = decodeURIComponent(params.tag);
  const { data, isLoading, isError, refetch, fetchNextPage, hasNextPage, isFetchingNextPage } = useHashtagPosts(tag);
  const posts = data?.pages.flatMap((p) => p.data) ?? [];

  const { data: followed } = useFollowedHashtags();
  const { follow, unfollow } = useToggleHashtagFollow();
  const isFollowing = !!followed?.includes(tag.toLowerCase());

  const toggle = async () => {
    try {
      if (isFollowing) {
        await unfollow.mutateAsync(tag);
        toast.success(`Unfollowed #${tag}`);
      } else {
        await follow.mutateAsync(tag);
        toast.success(`Following #${tag} — its posts will surface in your feed.`);
      }
    } catch (e) {
      toast.error(e instanceof ApiError ? e.message : "Could not update follow.");
    }
  };

  return (
    <>
      <PageHeader
        title={`#${tag}`}
        subtitle="Posts with this hashtag"
        action={
          <Button
            size="sm"
            variant={isFollowing ? "secondary" : "primary"}
            loading={follow.isPending || unfollow.isPending}
            onClick={toggle}
            leftIcon={isFollowing ? <BellOff className="h-4 w-4" /> : <Bell className="h-4 w-4" />}
          >
            {isFollowing ? "Following" : "Follow"}
          </Button>
        }
      />
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
