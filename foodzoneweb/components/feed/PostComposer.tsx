"use client";

import { Button } from "@/components/ui/Button";
import { Avatar } from "@/components/ui/Avatar";
import { useAuthStore } from "@/lib/auth-store";
import { ApiError } from "@/lib/api";
import { useCreatePost } from "@/lib/hooks/use-feed";
import { toast } from "@/lib/toast-store";
import { useState } from "react";

export function PostComposer() {
  const user = useAuthStore((s) => s.user);
  const [body, setBody] = useState("");
  const createPost = useCreatePost();

  const submit = async () => {
    const trimmed = body.trim();
    if (!trimmed) return;
    try {
      await createPost.mutateAsync({ body: trimmed });
      setBody("");
      toast.success("Posted!");
    } catch (e) {
      toast.error(e instanceof ApiError ? e.message : "Could not create post.");
    }
  };

  return (
    <div className="rounded-card border border-line bg-bg-soft p-4">
      <div className="flex gap-3">
        <Avatar src={user?.profile?.avatar} name={user?.name ?? "?"} size={40} />
        <div className="flex-1">
          <textarea
            value={body}
            onChange={(e) => setBody(e.target.value)}
            placeholder="Share something tasty…"
            rows={3}
            maxLength={5000}
            className="w-full resize-none rounded-lg border border-line bg-bg px-3 py-2 text-sm text-content placeholder:text-muted/60 focus:outline-none focus:ring-2 focus:ring-brand/60"
          />
          <div className="mt-2 flex items-center justify-between">
            <span className="text-xs text-muted">{body.length}/5000</span>
            <Button onClick={submit} loading={createPost.isPending} disabled={!body.trim()} size="sm">
              Post
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
