"use client";

import { PostCard } from "@/components/feed/PostCard";
import { Avatar } from "@/components/ui/Avatar";
import { Button } from "@/components/ui/Button";
import { PageHeader } from "@/components/ui/PageHeader";
import { CardSkeleton, EmptyState, ErrorState } from "@/components/ui/States";
import { Skeleton } from "@/components/ui/Skeleton";
import { useAuthStore } from "@/lib/auth-store";
import { useToggleFollow, useUserPosts, useUserProfile } from "@/lib/hooks/use-users";
import { ArrowLeft, BadgeCheck } from "lucide-react";
import Link from "next/link";
import { useParams } from "next/navigation";

export default function UserProfilePage() {
  const { username } = useParams<{ username: string }>();
  const me = useAuthStore((s) => s.user);
  const { data: user, isLoading, isError, refetch } = useUserProfile(username);
  const posts = useUserPosts(username);
  const { follow, unfollow } = useToggleFollow(username);

  if (isLoading) {
    return (
      <>
        <PageHeader title="Profile" />
        <div className="mx-auto w-full max-w-2xl space-y-4 p-4">
          <Skeleton className="h-40 rounded-card" />
          <CardSkeleton />
        </div>
      </>
    );
  }

  if (isError || !user) {
    return (
      <>
        <PageHeader title="Profile" />
        <div className="mx-auto w-full max-w-2xl p-4">
          <ErrorState message="This user could not be found." onRetry={() => refetch()} />
        </div>
      </>
    );
  }

  const isSelf = me?.id === user.id;
  const following = !!user.is_following;
  const postList = posts.data?.pages.flatMap((p) => p.data) ?? [];

  return (
    <>
      <PageHeader
        title={`@${user.username}`}
        action={
          <Link href="/" className="flex items-center gap-1 text-sm text-muted hover:text-content">
            <ArrowLeft className="h-4 w-4" /> Feed
          </Link>
        }
      />

      <div className="mx-auto w-full max-w-2xl space-y-4 p-4">
        <div className="rounded-card border border-line bg-bg-soft p-6">
          <div className="flex items-start gap-4">
            <Avatar src={user.profile?.avatar} name={user.name} size={72} />
            <div className="min-w-0 flex-1">
              <h2 className="flex items-center gap-1.5 text-xl font-semibold">
                {user.name}
                {user.email_verified && <BadgeCheck className="h-5 w-5 text-info" />}
              </h2>
              <p className="text-sm text-muted">@{user.username}</p>
            </div>
            {!isSelf && (
              following ? (
                <Button variant="secondary" size="sm" loading={unfollow.isPending} onClick={() => unfollow.mutate(user.id)}>
                  Following
                </Button>
              ) : (
                <Button size="sm" loading={follow.isPending} onClick={() => follow.mutate(user.id)}>
                  {user.profile?.is_private ? "Request" : "Follow"}
                </Button>
              )
            )}
          </div>

          {user.profile?.bio && <p className="mt-4 text-sm text-content">{user.profile.bio}</p>}

          <div className="mt-5 grid grid-cols-3 gap-2 border-t border-line pt-5">
            <Stat label="Posts" value={user.profile?.posts_count ?? 0} />
            <Stat label="Followers" value={user.profile?.followers_count ?? 0} />
            <Stat label="Following" value={user.profile?.following_count ?? 0} />
          </div>
        </div>

        {posts.isLoading ? (
          <CardSkeleton />
        ) : posts.isError ? (
          <ErrorState message="Couldn't load posts." onRetry={() => posts.refetch()} />
        ) : postList.length === 0 ? (
          <EmptyState title="No posts yet" hint={isSelf ? "Share your first post from the feed." : "This user hasn't posted, or their posts are private."} />
        ) : (
          <>
            {postList.map((post) => (
              <PostCard key={post.id} post={post} />
            ))}
            {posts.hasNextPage && (
              <div className="flex justify-center pt-2">
                <Button variant="secondary" onClick={() => posts.fetchNextPage()} loading={posts.isFetchingNextPage}>
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

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="text-center">
      <p className="text-lg font-semibold">{value}</p>
      <p className="text-xs text-muted">{label}</p>
    </div>
  );
}
