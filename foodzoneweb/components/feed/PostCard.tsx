"use client";

import { Avatar } from "@/components/ui/Avatar";
import { api, ApiError } from "@/lib/api";
import { cn } from "@/lib/cn";
import { useAuthStore } from "@/lib/auth-store";
import { timeAgo } from "@/lib/format";
import { useSharePost, useToggleSave } from "@/lib/hooks/use-feed";
import { toast } from "@/lib/toast-store";
import type { Post } from "@/lib/types";
import { useQueryClient } from "@tanstack/react-query";
import { Bookmark, Heart, LinkIcon, MessageCircle, MoreHorizontal, Pencil, Pin, Share2, Trash2 } from "lucide-react";
import Link from "next/link";
import { Fragment, useEffect, useRef, useState } from "react";
import { CommentSection } from "./CommentSection";
import { MediaGrid } from "./MediaGrid";

/** Linkify #hashtags and @mentions inside post body text. */
function RichBody({ text }: { text: string }) {
  const parts = text.split(/(#\w+|@\w+)/g);
  return (
    <>
      {parts.map((part, i) => {
        if (/^#\w+$/.test(part)) {
          return (
            <Link key={i} href={`/hashtag/${part.slice(1)}`} className="text-brand hover:underline">
              {part}
            </Link>
          );
        }
        if (/^@\w+$/.test(part)) {
          return (
            <Link key={i} href={`/u/${part.slice(1)}`} className="text-brand hover:underline">
              {part}
            </Link>
          );
        }
        return <Fragment key={i}>{part}</Fragment>;
      })}
    </>
  );
}

export function PostCard({ post, defaultShowComments = false }: { post: Post; defaultShowComments?: boolean }) {
  const [liked, setLiked] = useState(post.liked_by_me);
  const [likes, setLikes] = useState(post.likes_count);
  const [comments, setComments] = useState(post.comments_count);
  const [saved, setSaved] = useState(!!post.is_saved);
  const [shares, setShares] = useState(post.shares_count);
  const [showComments, setShowComments] = useState(defaultShowComments);
  const [busy, setBusy] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [removed, setRemoved] = useState(false);
  const [pinned, setPinned] = useState(!!post.is_pinned);
  const menuRef = useRef<HTMLDivElement>(null);

  const me = useAuthStore((s) => s.user);
  const isMine = me != null && me.id === post.author.id;
  const isOwner = isMine || (me != null && (me.role === "admin" || me.role === "super_admin"));
  const qc = useQueryClient();

  // Inline editing (own posts only).
  const [editing, setEditing] = useState(false);
  const [body, setBody] = useState(post.body ?? "");
  const [draft, setDraft] = useState(post.body ?? "");
  const [saving, setSaving] = useState(false);

  const saveEdit = async () => {
    const trimmed = draft.trim();
    if (!trimmed && post.media.length === 0) {
      toast.error("A post needs text or a photo.");
      return;
    }
    setSaving(true);
    try {
      await api.put(`/posts/${post.id}`, { body: trimmed });
      setBody(trimmed);
      setEditing(false);
      toast.success("Post updated.");
    } catch (e) {
      toast.error(e instanceof ApiError ? e.message : "Could not update post.");
    } finally {
      setSaving(false);
    }
  };

  const toggleSave = useToggleSave();
  const sharePost = useSharePost();

  // Close the "…" menu on outside click.
  useEffect(() => {
    if (!menuOpen) return;
    const onDown = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setMenuOpen(false);
    };
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, [menuOpen]);

  const copyLink = async () => {
    setMenuOpen(false);
    try {
      await navigator.clipboard.writeText(`${window.location.origin}/posts/${post.id}`);
      toast.success("Link copied");
    } catch {
      toast.error("Could not copy link.");
    }
  };

  const deletePost = async () => {
    setMenuOpen(false);
    if (!window.confirm("Delete this post? This cannot be undone.")) return;
    try {
      await api.del(`/posts/${post.id}`);
      setRemoved(true);
      toast.success("Post deleted.");
      void qc.invalidateQueries({ queryKey: ["feed"] });
    } catch (e) {
      toast.error(e instanceof ApiError ? e.message : "Could not delete post.");
    }
  };

  const togglePin = async () => {
    setMenuOpen(false);
    try {
      const res = await api.put<{ is_pinned: boolean }>(`/posts/${post.id}/pin`);
      setPinned(res.data.is_pinned);
      toast.success(res.data.is_pinned ? "Pinned to your profile." : "Unpinned.");
      void qc.invalidateQueries({ queryKey: ["user-posts"] });
    } catch (e) {
      toast.error(e instanceof ApiError ? e.message : "Could not pin post.");
    }
  };

  const toggleLike = async () => {
    if (busy) return;
    setBusy(true);
    const next = !liked;
    setLiked(next);
    setLikes((n) => n + (next ? 1 : -1));
    try {
      const res = next
        ? await api.post<{ likes_count: number }>(`/posts/${post.id}/like`)
        : await api.del<{ likes_count: number }>(`/posts/${post.id}/like`);
      setLikes(res.data.likes_count);
    } catch (e) {
      setLiked(!next);
      setLikes((n) => n + (next ? -1 : 1));
      toast.error(e instanceof ApiError ? e.message : "Action failed.");
    } finally {
      setBusy(false);
    }
  };

  const onSave = () => {
    const next = !saved;
    setSaved(next);
    toggleSave.mutate(
      { postId: post.id, saved: !next },
      { onError: () => setSaved(!next) },
    );
  };

  const onShare = async () => {
    try {
      const res = await sharePost.mutateAsync(post.id);
      setShares(res.data.shares_count);
      if (typeof navigator !== "undefined" && navigator.clipboard) {
        await navigator.clipboard.writeText(`${window.location.origin}/posts/${post.id}`);
        toast.success("Link copied & shared");
      } else {
        toast.success("Shared");
      }
    } catch (e) {
      toast.error(e instanceof ApiError ? e.message : "Could not share.");
    }
  };

  if (removed) return null;

  return (
    <article className="overflow-hidden rounded-card border border-line bg-bg-soft">
      <header className="flex items-center gap-3 p-4">
        <Link href={`/u/${post.author.username}`}>
          <Avatar src={post.author.avatar} name={post.author.name} size={40} />
        </Link>
        <div className="min-w-0 flex-1">
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
        {pinned && (
          <span className="flex items-center gap-1 rounded-full bg-brand/15 px-2 py-0.5 text-[10px] font-medium uppercase text-brand">
            <Pin className="h-3 w-3" /> Pinned
          </span>
        )}
        {post.source === "suggested" && (
          <span className="rounded-full bg-surface px-2 py-0.5 text-[10px] font-medium uppercase text-muted">Suggested</span>
        )}

        <div ref={menuRef} className="relative">
          <button
            onClick={() => setMenuOpen((v) => !v)}
            aria-label="Post options"
            aria-expanded={menuOpen}
            className="rounded-lg p-1.5 text-muted transition-colors hover:bg-surface hover:text-content"
          >
            <MoreHorizontal className="h-5 w-5" />
          </button>
          {menuOpen && (
            <div className="absolute right-0 top-9 z-20 w-44 overflow-hidden rounded-lg border border-line bg-bg-overlay shadow-md">
              <button onClick={copyLink} className="flex w-full items-center gap-2 px-3 py-2.5 text-left text-sm text-content transition-colors hover:bg-surface">
                <LinkIcon className="h-4 w-4 text-muted" /> Copy link
              </button>
              {isMine && (
                <>
                  <button
                    onClick={() => { setMenuOpen(false); setDraft(body); setEditing(true); }}
                    className="flex w-full items-center gap-2 px-3 py-2.5 text-left text-sm text-content transition-colors hover:bg-surface"
                  >
                    <Pencil className="h-4 w-4 text-muted" /> Edit post
                  </button>
                  <button onClick={togglePin} className="flex w-full items-center gap-2 px-3 py-2.5 text-left text-sm text-content transition-colors hover:bg-surface">
                    <Pin className="h-4 w-4 text-muted" /> {pinned ? "Unpin from profile" : "Pin to profile"}
                  </button>
                </>
              )}
              {isOwner && (
                <button onClick={deletePost} className="flex w-full items-center gap-2 px-3 py-2.5 text-left text-sm text-danger transition-colors hover:bg-danger/10">
                  <Trash2 className="h-4 w-4" /> Delete post
                </button>
              )}
            </div>
          )}
        </div>
      </header>

      {editing ? (
        <div className="px-4 pb-3">
          <textarea
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            rows={3}
            maxLength={5000}
            autoFocus
            className="w-full resize-none rounded-lg border border-line bg-bg px-3 py-2 text-sm text-content focus:outline-none focus:ring-2 focus:ring-brand/60"
          />
          <div className="mt-2 flex justify-end gap-2">
            <button onClick={() => setEditing(false)} className="rounded-lg px-3 py-1.5 text-sm text-muted hover:bg-surface hover:text-content">
              Cancel
            </button>
            <button
              onClick={saveEdit}
              disabled={saving}
              className="rounded-lg bg-brand px-3 py-1.5 text-sm font-medium text-white hover:bg-brand-hover disabled:opacity-50"
            >
              {saving ? "Saving…" : "Save"}
            </button>
          </div>
        </div>
      ) : body ? (
        <p className="whitespace-pre-wrap px-4 pb-3 text-sm text-content">
          <RichBody text={body} />
        </p>
      ) : null}

      <MediaGrid media={post.media} />

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
        <button
          onClick={onShare}
          className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-muted transition-colors hover:bg-surface"
        >
          <Share2 className="h-5 w-5" />
          {shares > 0 && shares}
        </button>
        <button
          onClick={onSave}
          aria-pressed={saved}
          aria-label={saved ? "Unsave" : "Save"}
          className={cn(
            "ml-auto rounded-lg px-3 py-2 transition-colors hover:bg-surface",
            saved ? "text-brand" : "text-muted",
          )}
        >
          <Bookmark className={cn("h-5 w-5", saved && "fill-current")} />
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
