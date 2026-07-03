"use client";

import { Avatar } from "@/components/ui/Avatar";
import { Button } from "@/components/ui/Button";
import { ApiError } from "@/lib/api";
import { cn } from "@/lib/cn";
import { useAuth } from "@/lib/auth-context";
import { useUploadMedia } from "@/lib/hooks/use-media";
import { useCreatePost } from "@/lib/hooks/use-feed";
import { toast } from "@/lib/toast-store";
import { Globe, ImagePlus, Loader2, Lock, Users, X } from "lucide-react";
import { useRef, useState, type DragEvent } from "react";

const MAX_IMAGES = 10;

type Privacy = "public" | "followers" | "private";

const PRIVACY_OPTIONS: { value: Privacy; label: string; icon: typeof Globe }[] = [
  { value: "public", label: "Public", icon: Globe },
  { value: "followers", label: "Followers", icon: Users },
  { value: "private", label: "Only me", icon: Lock },
];

interface PendingImage {
  /** Local key — object URL used for the optimistic thumbnail. */
  key: string;
  preview: string;
  /** Uploaded URL once the server confirms; null while in flight. */
  url: string | null;
  failed?: boolean;
}

export function PostComposer() {
  const { user } = useAuth();
  const [body, setBody] = useState("");
  const [images, setImages] = useState<PendingImage[]>([]);
  const [privacy, setPrivacy] = useState<Privacy>("public");
  const [dragOver, setDragOver] = useState(false);
  const createPost = useCreatePost();
  const upload = useUploadMedia();
  const inputRef = useRef<HTMLInputElement>(null);

  const uploading = images.some((i) => i.url === null && !i.failed);

  const addFiles = (files: FileList | File[]) => {
    const incoming = Array.from(files).filter((f) => f.type.startsWith("image/"));
    if (incoming.length === 0) return;

    const room = MAX_IMAGES - images.length;
    if (room <= 0) {
      toast.error(`A post can have at most ${MAX_IMAGES} photos.`);
      return;
    }
    if (incoming.length > room) toast.error(`Only ${room} more photo${room === 1 ? "" : "s"} allowed — extras skipped.`);

    for (const file of incoming.slice(0, room)) {
      const key = URL.createObjectURL(file);
      setImages((prev) => [...prev, { key, preview: key, url: null }]);
      upload
        .mutateAsync({ file, category: "post" })
        .then((media) => {
          setImages((prev) => prev.map((im) => (im.key === key ? { ...im, url: media.url } : im)));
        })
        .catch((e) => {
          setImages((prev) => prev.filter((im) => im.key !== key));
          URL.revokeObjectURL(key);
          toast.error(e instanceof ApiError ? (e.fieldError("file") ?? e.message) : "Image upload failed.");
        });
    }
  };

  const removeImage = (key: string) => {
    setImages((prev) => prev.filter((im) => im.key !== key));
    URL.revokeObjectURL(key);
  };

  const onDrop = (e: DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    if (e.dataTransfer.files.length) addFiles(e.dataTransfer.files);
  };

  const submit = async () => {
    const trimmed = body.trim();
    const uploaded = images.filter((i) => i.url !== null);
    if (!trimmed && uploaded.length === 0) return;
    if (uploading) {
      toast.error("Hang on — photos are still uploading.");
      return;
    }
    try {
      await createPost.mutateAsync({
        body: trimmed,
        privacy,
        media: uploaded.length ? uploaded.map((i) => ({ url: i.url!, type: "image" as const })) : undefined,
      });
      images.forEach((i) => URL.revokeObjectURL(i.key));
      setBody("");
      setImages([]);
      setPrivacy("public");
      toast.success("Posted!");
    } catch (e) {
      toast.error(e instanceof ApiError ? e.message : "Could not create post.");
    }
  };

  return (
    <div
      onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
      onDragLeave={() => setDragOver(false)}
      onDrop={onDrop}
      className={cn(
        "rounded-card border bg-bg-soft p-4 transition-colors",
        dragOver ? "border-brand/60 bg-brand/5" : "border-line",
      )}
    >
      <div className="flex gap-3">
        <Avatar src={user.profile?.avatar} name={user.name} size={40} />
        <div className="min-w-0 flex-1">
          <textarea
            value={body}
            onChange={(e) => setBody(e.target.value)}
            placeholder="Share something tasty…"
            rows={3}
            maxLength={5000}
            className="w-full resize-none rounded-lg border border-line bg-bg px-3 py-2 text-sm text-content placeholder:text-muted/60 focus:outline-none focus:ring-2 focus:ring-brand/60"
          />

          {images.length > 0 && (
            <div className="mt-2 grid grid-cols-3 gap-2 sm:grid-cols-5">
              {images.map((im) => (
                <div key={im.key} className="group relative aspect-square overflow-hidden rounded-lg border border-line">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={im.preview} alt="" className={cn("h-full w-full object-cover", im.url === null && "opacity-50")} />
                  {im.url === null && (
                    <span className="absolute inset-0 flex items-center justify-center">
                      <Loader2 className="h-5 w-5 animate-spin text-brand" />
                    </span>
                  )}
                  <button
                    onClick={() => removeImage(im.key)}
                    aria-label="Remove image"
                    className="absolute right-1 top-1 rounded-full bg-black/60 p-1 text-white opacity-0 transition-opacity hover:bg-black/80 group-hover:opacity-100"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                </div>
              ))}
            </div>
          )}

          <input
            ref={inputRef}
            type="file"
            accept="image/*"
            multiple
            className="hidden"
            onChange={(e) => {
              if (e.target.files) addFiles(e.target.files);
              e.target.value = "";
            }}
          />

          <div className="mt-2 flex items-center justify-between gap-2">
            <div className="flex items-center gap-1">
              <button
                onClick={() => inputRef.current?.click()}
                disabled={images.length >= MAX_IMAGES}
                className="flex items-center gap-1.5 rounded-lg px-2 py-1.5 text-sm text-muted transition-colors hover:bg-surface hover:text-brand disabled:opacity-50"
              >
                <ImagePlus className="h-4 w-4" />
                Photos
                {images.length > 0 && <span className="text-xs text-text-tertiary">{images.length}/{MAX_IMAGES}</span>}
              </button>

              {/* Privacy selector */}
              <div className="flex rounded-lg border border-line p-0.5">
                {PRIVACY_OPTIONS.map(({ value, label, icon: Icon }) => (
                  <button
                    key={value}
                    onClick={() => setPrivacy(value)}
                    title={label}
                    aria-pressed={privacy === value}
                    className={cn(
                      "flex items-center gap-1 rounded-md px-2 py-1 text-xs font-medium transition-colors",
                      privacy === value ? "bg-surface text-content" : "text-muted hover:text-content",
                    )}
                  >
                    <Icon className="h-3.5 w-3.5" />
                    <span className="hidden sm:inline">{label}</span>
                  </button>
                ))}
              </div>
            </div>

            <Button
              onClick={submit}
              loading={createPost.isPending}
              disabled={(!body.trim() && images.filter((i) => i.url).length === 0) || uploading}
              size="sm"
            >
              Post
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
