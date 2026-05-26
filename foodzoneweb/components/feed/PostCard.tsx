"use client";

import { Avatar } from "@/components/ui/Avatar";
import { api, ApiError } from "@/lib/api";
import { timeAgo } from "@/lib/format";
import { toast } from "@/lib/toast-store";
import type { Post } from "@/lib/types";
import { cn } from "@/lib/cn";
import { Heart, MessageCircle } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { CommentSection } from "./CommentSection";

export function PostCard({ post, defaultShowComments = false }: { post: Post; defaultShowComments?: boolean }) {
  const [liked, setLiked] = useState(post.liked_by_me);
  const [likes, setLikes] = useState(post.likes_count);
  const [comments, setComments] = useState(post.comments_count);
  const [showComments, setShowComments] = useState(defaultShowComments);
  const [busy, setBusy] = useState(false);

  const toggleLike = async () => {
    if (busy) return;
    setBusy(true);
    const next = !liked;
    // Optimistic update.
    setLiked(next);
    setLikes((n) => n + (next ? 1 : -1));
    try {
      const res = next
        ? await api.post<{ likes_count: number }>(`/posts/${post.id}/like`)
        : await api.del<{ likes_count: number }>(`/posts/${post.id}/like`);
      setLikes(res.data.likes_count);
    } catch (e) {
      // Roll back.
      setLiked(!next);
      setLikes((n) => n + (next ? -1 : 1));
      toast.error(e instanceof ApiError ? e.message : "Action failed.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <article className="overflow-hidden rounded-card border border-line bg-bg-soft">
      <header className="flex items-center gap-3 p-4">
        <Link href={`/u/${post.author.username}`}>
          <Avatar src={post.author.avatar} name={post.author.name} size={40} />
        </Link>
        <div className="min-w-0">
          <Link href={`/u/${post.author.username}`} className="truncate text-sm font-semibold hover:underline">
            {post.author.name}
          </Link>
          <p className="truncate text-xs text-muted">
            @{post.author.username} ·{" "}
            <Link href={`/posts/${post.id}`} className="hover:underline">
              {timeAgo(post.created_at)}
            </Link>
            {post.privacy !== "public" && ` · ${post.privacy}`}
          </p>
        </div>
      </header>

      {post.body && <p className="whitespace-pre-wrap px-4 pb-3 text-sm text-content">{post.body}</p>}

      {post.media.length > 0 && (
        <div className={cn("grid gap-0.5", post.media.length > 1 ? "grid-cols-2" : "grid-cols-1")}>
          {post.media.slice(0, 4).map((m) => (
            // eslint-disable-next-line @next/next/no-img-element
            <img key={m.id} src={m.url} alt="" className="max-h-96 w-full object-cover" />
          ))}
        </div>
      )}

      <footer className="flex items-center gap-1 border-t border-line px-2 py-1">
        <button
          onClick={toggleLike}
          className={cn(
            "flex items-center gap-2 rounded-lg px-3 py-2 text-sm transition-colors hover:bg-surface",
            liked ? "text-brand" : "text-muted",
          )}
          aria-pressed={liked}
        >
          <Heart className={cn("h-5 w-5", liked && "fill-current")} />
          {likes}
        </button>
        <button
          onClick={() => setShowComments((v) => !v)}
          className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-muted transition-colors hover:bg-surface"
        >
          <MessageCircle className="h-5 w-5" />
          {comments}
        </button>
      </footer>

      {showComments && (
        <CommentSection
          postId={post.id}
          onCommentAdded={() => setComments((n) => n + 1)}
          onCommentRemoved={(n) => setComments((c) => Math.max(0, c - n))}
        />
      )}
    </article>
  );
}
