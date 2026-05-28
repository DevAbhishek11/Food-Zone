"use client";

import { PostCard } from "@/components/feed/PostCard";
import { Avatar } from "@/components/ui/Avatar";
import { Button } from "@/components/ui/Button";
import { PageHeader } from "@/components/ui/PageHeader";
import { CardSkeleton, EmptyState, ErrorState } from "@/components/ui/States";
import { Skeleton } from "@/components/ui/Skeleton";
import { useAuthStore } from "@/lib/auth-store";
import { cn } from "@/lib/cn";
import { useStartConversation } from "@/lib/hooks/use-chat";
import { useSaved } from "@/lib/hooks/use-feed";
import { useToggleFollow, useUserFoodJourney, useUserPosts, useUserProfile, useUserTaggedIn } from "@/lib/hooks/use-users";
import { ArrowLeft, BadgeCheck, Globe, MapPin, MessageCircle } from "lucide-react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useState } from "react";

type Tab = "posts" | "food" | "tagged" | "saved";

export default function UserProfilePage() {
  const { username } = useParams<{ username: string }>();
  const router = useRouter();
  const me = useAuthStore((s) => s.user);
  const { data: user, isLoading, isError, refetch } = useUserProfile(username);
  const startConversation = useStartConversation();
  const { follow, unfollow } = useToggleFollow(username);
  const [tab, setTab] = useState<Tab>("posts");

  const isSelf = !!user && me?.id === user.id;
  const posts = useUserPosts(username, tab === "posts");
  const food = useUserFoodJourney(username, tab === "food");
  const tagged = useUserTaggedIn(username, tab === "tagged");
  const saved = useSaved(); // own-only; only shown to self

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

  const following = !!user.is_following;
  const cover = user.profile?.cover;
  const messageUser = async (userId: number) => {
    const res = await startConversation.mutateAsync(userId);
    router.push(`/messages/${res.data.id}`);
  };

  const active = tab === "posts" ? posts : tab === "food" ? food : tab === "tagged" ? tagged : saved;
  const postList = active.data?.pages.flatMap((p) => p.data) ?? [];

  return (
    <>
      <PageHeader
        title={`@${user.username}`}
        action={
          <Link href="/feed" className="flex items-center gap-1 text-sm text-muted hover:text-content">
            <ArrowLeft className="h-4 w-4" /> Feed
          </Link>
        }
      />

      <div className="mx-auto w-full max-w-2xl p-4">
        {/* Cover + avatar */}
        <div className="overflow-hidden rounded-card border border-line bg-bg-soft">
          <div
            className="h-40 w-full"
            style={{
              background: cover
                ? `url(${cover}) center/cover no-repeat`
                : "linear-gradient(135deg, rgba(255,107,53,0.25), rgba(255,64,129,0.15))",
            }}
          />
          <div className="px-6 pb-6">
            <div className="-mt-12 mb-3 flex items-end justify-between gap-3">
              <div className="rounded-full border-4 border-bg-soft">
                <Avatar src={user.profile?.avatar} name={user.name} size={96} verified={user.is_verified} />
              </div>
              <div className="mb-2 flex items-center gap-2">
                {isSelf ? (
                  <Link href="/profile">
                    <Button variant="secondary" size="sm">Edit profile</Button>
                  </Link>
                ) : (
                  <>
                    <Button variant="secondary" size="sm" loading={startConversation.isPending} onClick={() => messageUser(user.id)} aria-label="Message">
                      <MessageCircle className="h-4 w-4" />
                    </Button>
                    {following ? (
                      <Button variant="secondary" size="sm" loading={unfollow.isPending} onClick={() => unfollow.mutate(user.id)}>
                        Following
                      </Button>
                    ) : (
                      <Button size="sm" loading={follow.isPending} onClick={() => follow.mutate(user.id)}>
                        {user.profile?.is_private ? "Request" : "Follow"}
                      </Button>
                    )}
                  </>
                )}
              </div>
            </div>

            <h2 className="flex items-center gap-1.5 text-xl font-semibold">
              {user.name}
              {user.is_verified && <BadgeCheck className="h-5 w-5 text-info" />}
            </h2>
            <p className="text-sm text-muted">@{user.username}</p>

            {user.profile?.bio && <p className="mt-3 text-sm text-content">{user.profile.bio}</p>}

            <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted">
              {user.profile?.location && (
                <span className="inline-flex items-center gap-1">
                  <MapPin className="h-3.5 w-3.5" /> {user.profile.location}
                </span>
              )}
              {user.profile?.website && (
                <a href={user.profile.website} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-brand hover:underline">
                  <Globe className="h-3.5 w-3.5" /> {user.profile.website.replace(/^https?:\/\//, "")}
                </a>
              )}
              {user.member_since && <span>Joined {user.member_since}</span>}
            </div>

            {user.top_food_tags && user.top_food_tags.length > 0 && (
              <div className="mt-3 flex flex-wrap gap-1.5">
                {user.top_food_tags.map((t) => (
                  <Link
                    key={t}
                    href={`/hashtag/${t}`}
                    className="rounded-full bg-brand/15 px-2 py-0.5 text-xs font-medium text-brand hover:bg-brand/25"
                  >
                    #{t}
                  </Link>
                ))}
              </div>
            )}

            {!isSelf && user.mutual_followers && user.mutual_followers.length > 0 && (
              <div className="mt-3 flex flex-wrap items-center gap-2 rounded-lg bg-surface px-3 py-2 text-xs text-muted">
                <div className="flex -space-x-2">
                  {user.mutual_followers.map((m) => (
                    <Avatar key={m.id} src={m.avatar} name={m.name} size={20} className="ring-2 ring-bg-soft" />
                  ))}
                </div>
                <span>
                  Followed by{" "}
                  {user.mutual_followers.map((m, i) => (
                    <span key={m.id}>
                      <Link href={`/u/${m.username}`} className="font-medium text-content hover:underline">@{m.username}</Link>
                      {i < user.mutual_followers!.length - 1 ? ", " : ""}
                    </span>
                  ))}
                </span>
              </div>
            )}

            <div className="mt-5 grid grid-cols-3 gap-2 border-t border-line pt-5">
              <Stat label="Posts" value={user.profile?.posts_count ?? 0} />
              <Stat label="Followers" value={user.profile?.followers_count ?? 0} />
              <Stat label="Following" value={user.profile?.following_count ?? 0} />
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="mt-4 flex gap-1 rounded-lg border border-line bg-bg-soft p-1 text-sm">
          {(["posts", "food", "tagged", ...(isSelf ? ["saved" as Tab] : [])] as Tab[]).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={cn(
                "flex-1 rounded-md px-3 py-1.5 capitalize transition",
                tab === t ? "bg-brand text-white" : "text-muted hover:text-content",
              )}
            >
              {t === "food" ? "Food journey" : t}
            </button>
          ))}
        </div>

        {/* Tab content */}
        <div className="mt-4 space-y-4">
          {active.isLoading ? (
            <CardSkeleton />
          ) : active.isError ? (
            <ErrorState message="Couldn't load posts." onRetry={() => active.refetch()} />
          ) : postList.length === 0 ? (
            <EmptyState
              title={
                tab === "saved"
                  ? "No saved posts yet"
                  : tab === "tagged"
                    ? "No mentions yet"
                    : tab === "food"
                      ? "No food posts yet"
                      : "No posts yet"
              }
              hint={isSelf && tab === "posts" ? "Share your first post from the feed." : undefined}
            />
          ) : (
            <>
              {postList.map((post) => (
                <PostCard key={post.id} post={post} />
              ))}
              {active.hasNextPage && (
                <div className="flex justify-center pt-2">
                  <Button variant="secondary" onClick={() => active.fetchNextPage()} loading={active.isFetchingNextPage}>
                    Load more
                  </Button>
                </div>
              )}
            </>
          )}
        </div>
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
