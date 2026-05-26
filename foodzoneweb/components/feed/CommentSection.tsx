"use client";

import { Avatar } from "@/components/ui/Avatar";
import { Button } from "@/components/ui/Button";
import { ApiError } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
import { useAddComment, useComments, useDeleteComment } from "@/lib/hooks/use-comments";
import { timeAgo } from "@/lib/format";
import { toast } from "@/lib/toast-store";
import type { Comment } from "@/lib/types";
import { Loader2, Trash2 } from "lucide-react";
import Link from "next/link";
import { useState } from "react";

export function CommentSection({
  postId,
  onCommentAdded,
  onCommentRemoved,
}: {
  postId: number;
  onCommentAdded: () => void;
  onCommentRemoved?: (n: number) => void;
}) {
  const { data, isLoading } = useComments(postId, true);
  const addComment = useAddComment(postId);
  const [body, setBody] = useState("");

  const submit = async () => {
    const trimmed = body.trim();
    if (!trimmed) return;
    try {
      await addComment.mutateAsync({ body: trimmed });
      setBody("");
      onCommentAdded();
    } catch (e) {
      toast.error(e instanceof ApiError ? e.message : "Could not add comment.");
    }
  };

  const comments = data?.data ?? [];

  return (
    <div className="border-t border-line px-4 py-3">
      <div className="mb-3 flex gap-2">
        <input
          value={body}
          onChange={(e) => setBody(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && submit()}
          placeholder="Write a comment…"
          className="h-9 flex-1 rounded-full border border-line bg-bg px-4 text-sm focus:outline-none focus:ring-2 focus:ring-brand/60"
        />
        <Button onClick={submit} size="sm" loading={addComment.isPending} disabled={!body.trim()}>
          Send
        </Button>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-3">
          <Loader2 className="h-5 w-5 animate-spin text-muted" />
        </div>
      ) : comments.length === 0 ? (
        <p className="py-2 text-center text-xs text-muted">No comments yet. Be the first!</p>
      ) : (
        <ul className="flex flex-col gap-3">
          {comments.map((c) => (
            <CommentItem
              key={c.id}
              comment={c}
              postId={postId}
              onAdded={onCommentAdded}
              onRemoved={onCommentRemoved}
            />
          ))}
        </ul>
      )}
    </div>
  );
}

function CommentItem({
  comment,
  postId,
  onAdded,
  onRemoved,
}: {
  comment: Comment;
  postId: number;
  onAdded: () => void;
  onRemoved?: (n: number) => void;
}) {
  const { user } = useAuth();
  const addComment = useAddComment(postId);
  const deleteComment = useDeleteComment(postId);
  const [replying, setReplying] = useState(false);
  const [replyBody, setReplyBody] = useState("");

  const isTopLevel = comment.parent_id === null;
  const canDelete = user.id === comment.author.id || user.role === "admin" || user.role === "super_admin";

  const submitReply = async () => {
    const trimmed = replyBody.trim();
    if (!trimmed) return;
    try {
      await addComment.mutateAsync({ body: trimmed, parentId: comment.id });
      setReplyBody("");
      setReplying(false);
      onAdded();
    } catch (e) {
      toast.error(e instanceof ApiError ? e.message : "Could not reply.");
    }
  };

  const remove = async () => {
    try {
      const removed = 1 + (comment.replies?.length ?? 0);
      await deleteComment.mutateAsync(comment.id);
      onRemoved?.(removed);
    } catch (e) {
      toast.error(e instanceof ApiError ? e.message : "Could not delete.");
    }
  };

  return (
    <li className="flex gap-2">
      <Link href={`/u/${comment.author.username}`}>
        <Avatar src={comment.author.avatar} name={comment.author.name} size={28} />
      </Link>
      <div className="min-w-0 flex-1">
        <div className="inline-block rounded-2xl bg-surface px-3 py-2">
          <p className="text-xs font-medium">
            <Link href={`/u/${comment.author.username}`} className="hover:underline">
              @{comment.author.username}
            </Link>
            <span className="ml-2 font-normal text-muted">{timeAgo(comment.created_at)}</span>
          </p>
          <p className="text-sm text-content">{comment.body}</p>
        </div>

        <div className="mt-1 flex items-center gap-3 pl-1 text-xs text-muted">
          {isTopLevel && (
            <button onClick={() => setReplying((v) => !v)} className="hover:text-content">
              Reply
            </button>
          )}
          {canDelete && (
            <button onClick={remove} className="inline-flex items-center gap-1 hover:text-danger" disabled={deleteComment.isPending}>
              <Trash2 className="h-3 w-3" /> Delete
            </button>
          )}
        </div>

        {replying && (
          <div className="mt-2 flex gap-2">
            <input
              value={replyBody}
              onChange={(e) => setReplyBody(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && submitReply()}
              placeholder={`Reply to @${comment.author.username}…`}
              autoFocus
              className="h-8 flex-1 rounded-full border border-line bg-bg px-3 text-sm focus:outline-none focus:ring-2 focus:ring-brand/60"
            />
            <Button onClick={submitReply} size="sm" loading={addComment.isPending} disabled={!replyBody.trim()}>
              Reply
            </Button>
          </div>
        )}

        {comment.replies && comment.replies.length > 0 && (
          <ul className="mt-2 flex flex-col gap-2 border-l border-line pl-3">
            {comment.replies.map((r) => (
              <CommentItem key={r.id} comment={r} postId={postId} onAdded={onAdded} onRemoved={onRemoved} />
            ))}
          </ul>
        )}
      </div>
    </li>
  );
}
