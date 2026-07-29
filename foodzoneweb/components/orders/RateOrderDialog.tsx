"use client";

import { Button } from "@/components/ui/Button";
import { Stars } from "@/components/ui/Stars";
import { ApiError } from "@/lib/api";
import { useUploadMedia } from "@/lib/hooks/use-media";
import { useRateOrder } from "@/lib/hooks/use-orders";
import { toast } from "@/lib/toast-store";
import { ImagePlus, Loader2, X } from "lucide-react";
import { useRef, useState } from "react";

const MAX_PHOTOS = 5;

export function RateOrderDialog({
  orderId,
  vendorName,
  onClose,
}: {
  orderId: number;
  vendorName: string;
  onClose: () => void;
}) {
  const [rating, setRating] = useState(0);
  const [review, setReview] = useState("");
  const [images, setImages] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);
  const rate = useRateOrder(orderId);
  const upload = useUploadMedia();
  const inputRef = useRef<HTMLInputElement>(null);

  const addPhotos = async (files: FileList) => {
    const room = MAX_PHOTOS - images.length;
    if (room <= 0) {
      toast.error(`You can attach up to ${MAX_PHOTOS} photos.`);
      return;
    }
    const picked = Array.from(files).filter((f) => f.type.startsWith("image/")).slice(0, room);
    if (picked.length === 0) return;
    setUploading(true);
    try {
      const uploaded = await Promise.all(picked.map((file) => upload.mutateAsync({ file, category: "review" })));
      setImages((prev) => [...prev, ...uploaded.map((m) => m.url)]);
    } catch (e) {
      toast.error(e instanceof ApiError ? (e.fieldError("file") ?? e.message) : "Photo upload failed.");
    } finally {
      setUploading(false);
    }
  };

  const submit = async () => {
    if (rating < 1) {
      toast.error("Please pick a star rating.");
      return;
    }
    // Backend requires a review of at least 20 chars when one is provided.
    if (review.trim() && review.trim().length < 20) {
      toast.error("Reviews must be at least 20 characters (or leave it blank).");
      return;
    }
    try {
      await rate.mutateAsync({ rating, review: review.trim() || undefined, images: images.length ? images : undefined });
      toast.success("Thanks for your review!");
      onClose();
    } catch (e) {
      toast.error(e instanceof ApiError ? e.message : "Could not submit rating.");
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4" onClick={onClose}>
      <div className="w-full max-w-sm rounded-2xl border border-line bg-bg-soft p-6" onClick={(e) => e.stopPropagation()}>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold">Rate {vendorName}</h2>
          <button onClick={onClose} aria-label="Close" className="text-muted hover:text-content">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="flex justify-center py-2">
          <Stars value={rating} size={36} onChange={setRating} />
        </div>

        <textarea
          value={review}
          onChange={(e) => setReview(e.target.value)}
          placeholder="Share details of your experience (optional, min 20 chars)…"
          rows={4}
          maxLength={2000}
          className="mt-3 w-full resize-none rounded-lg border border-line bg-bg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand/60"
        />

        {images.length > 0 && (
          <div className="mt-3 grid grid-cols-5 gap-2">
            {images.map((url) => (
              <div key={url} className="group relative aspect-square overflow-hidden rounded-lg border border-line">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={url} alt="" className="h-full w-full object-cover" />
                <button
                  onClick={() => setImages((prev) => prev.filter((u) => u !== url))}
                  aria-label="Remove photo"
                  className="absolute right-0.5 top-0.5 rounded-full bg-black/60 p-0.5 text-white opacity-0 transition-opacity group-hover:opacity-100"
                >
                  <X className="h-3 w-3" />
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
            if (e.target.files) addPhotos(e.target.files);
            e.target.value = "";
          }}
        />
        <button
          onClick={() => inputRef.current?.click()}
          disabled={uploading || images.length >= MAX_PHOTOS}
          className="mt-3 flex items-center gap-1.5 text-sm text-muted transition-colors hover:text-brand disabled:opacity-50"
        >
          {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <ImagePlus className="h-4 w-4" />}
          Add photos {images.length > 0 && <span className="text-xs text-text-tertiary">{images.length}/{MAX_PHOTOS}</span>}
        </button>

        <Button className="mt-4 w-full" onClick={submit} loading={rate.isPending} disabled={uploading}>
          Submit review
        </Button>
      </div>
    </div>
  );
}
