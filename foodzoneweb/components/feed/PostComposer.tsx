"use client";

import { Avatar } from "@/components/ui/Avatar";
import { Button } from "@/components/ui/Button";
import { ApiError } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
import { useUploadMedia } from "@/lib/hooks/use-media";
import { useCreatePost } from "@/lib/hooks/use-feed";
import { toast } from "@/lib/toast-store";
import { ImagePlus, Loader2, X } from "lucide-react";
import { useRef, useState } from "react";

export function PostComposer() {
  const { user } = useAuth();
  const [body, setBody] = useState("");
  const [image, setImage] = useState<string | null>(null);
  const createPost = useCreatePost();
  const upload = useUploadMedia();
  const inputRef = useRef<HTMLInputElement>(null);

  const onFile = async (file: File | undefined) => {
    if (!file) return;
    try {
      const media = await upload.mutateAsync({ file, category: "post" });
      setImage(media.url);
    } catch {
      toast.error("Image upload failed.");
    }
  };

  const submit = async () => {
    const trimmed = body.trim();
    if (!trimmed && !image) return;
    try {
      await createPost.mutateAsync({
        body: trimmed,
        media: image ? [{ url: image, type: "image" }] : undefined,
      });
      setBody("");
      setImage(null);
      toast.success("Posted!");
    } catch (e) {
      toast.error(e instanceof ApiError ? e.message : "Could not create post.");
    }
  };

  return (
    <div className="rounded-card border border-line bg-bg-soft p-4">
      <div className="flex gap-3">
        <Avatar src={user.profile?.avatar} name={user.name} size={40} />
        <div className="flex-1">
          <textarea
            value={body}
            onChange={(e) => setBody(e.target.value)}
            placeholder="Share something tasty…"
            rows={3}
            maxLength={5000}
            className="w-full resize-none rounded-lg border border-line bg-bg px-3 py-2 text-sm text-content placeholder:text-muted/60 focus:outline-none focus:ring-2 focus:ring-brand/60"
          />

          {image && (
            <div className="relative mt-2 inline-block">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={image} alt="" className="max-h-48 rounded-lg border border-line object-cover" />
              <button
                onClick={() => setImage(null)}
                className="absolute right-2 top-2 rounded-full bg-bg/80 p-1 text-muted hover:text-danger"
                aria-label="Remove image"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          )}

          <input ref={inputRef} type="file" accept="image/*" className="hidden" onChange={(e) => onFile(e.target.files?.[0])} />

          <div className="mt-2 flex items-center justify-between">
            <button
              onClick={() => inputRef.current?.click()}
              disabled={upload.isPending}
              className="flex items-center gap-1.5 text-sm text-muted hover:text-brand disabled:opacity-50"
            >
              {upload.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <ImagePlus className="h-4 w-4" />}
              Photo
            </button>
            <Button onClick={submit} loading={createPost.isPending} disabled={!body.trim() && !image} size="sm">
              Post
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
