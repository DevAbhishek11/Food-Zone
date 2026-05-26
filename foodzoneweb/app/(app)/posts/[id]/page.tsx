"use client";

import { PostCard } from "@/components/feed/PostCard";
import { PageHeader } from "@/components/ui/PageHeader";
import { ErrorState } from "@/components/ui/States";
import { Skeleton } from "@/components/ui/Skeleton";
import { usePost } from "@/lib/hooks/use-comments";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { useParams } from "next/navigation";

export default function PostDetailPage() {
  const params = useParams<{ id: string }>();
  const postId = Number(params.id);
  const { data: post, isLoading, isError, refetch } = usePost(postId);

  return (
    <>
      <PageHeader title="Post" />
      <div className="mx-auto w-full max-w-2xl space-y-4 p-4">
        <Link href="/" className="inline-flex items-center gap-1 text-sm text-muted hover:text-content">
          <ArrowLeft className="h-4 w-4" /> Back to feed
        </Link>

        {isLoading ? (
          <Skeleton className="h-64 rounded-card" />
        ) : isError || !post ? (
          <ErrorState message="Couldn't load this post." onRetry={() => refetch()} />
        ) : (
          <PostCard post={post} defaultShowComments />
        )}
      </div>
    </>
  );
}
