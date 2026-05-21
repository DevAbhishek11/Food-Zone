"use client";

import { Avatar } from "@/components/ui/Avatar";
import { Button } from "@/components/ui/Button";
import { ApiError } from "@/lib/api";
import { useAddComment, useComments } from "@/lib/hooks/use-comments";
import { timeAgo } from "@/lib/format";
import { toast } from "@/lib/toast-store";
import { Loader2 } from "lucide-react";
import { useState } from "react";

export function CommentSection({
  postId,
  onCommentAdded,
}: {
  postId: number;
  onCommentAdded: () => void;
}) {
  const { data, isLoading } = useComments(postId, true);
  const addComment = useAddComment(postId);
  const [body, setBody] = useState("");

  const submit = async () => {
    const trimmed = body.trim();
    if (!trimmed) return;
    try {
      await addComment.mutateAsync(trimmed);
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
            <li key={c.id} className="flex gap-2">
              <Avatar src={c.author.avatar} name={c.author.name} size={28} />
              <div className="rounded-2xl bg-surface px-3 py-2">
                <p className="text-xs font-medium">
                  @{c.author.username}
                  <span className="ml-2 font-normal text-muted">{timeAgo(c.created_at)}</span>
                </p>
                <p className="text-sm text-content">{c.body}</p>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
