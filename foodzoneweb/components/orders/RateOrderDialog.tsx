"use client";

import { Button } from "@/components/ui/Button";
import { Stars } from "@/components/ui/Stars";
import { ApiError } from "@/lib/api";
import { useRateOrder } from "@/lib/hooks/use-orders";
import { toast } from "@/lib/toast-store";
import { X } from "lucide-react";
import { useState } from "react";

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
  const rate = useRateOrder(orderId);

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
      await rate.mutateAsync({ rating, review: review.trim() || undefined });
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

        <Button className="mt-4 w-full" onClick={submit} loading={rate.isPending}>
          Submit review
        </Button>
      </div>
    </div>
  );
}
