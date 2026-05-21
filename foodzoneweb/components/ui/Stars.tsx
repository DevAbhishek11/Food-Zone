"use client";

import { cn } from "@/lib/cn";
import { Star } from "lucide-react";

/** Read-only or interactive 1–5 star rating. */
export function Stars({
  value,
  size = 16,
  onChange,
  className,
}: {
  value: number;
  size?: number;
  onChange?: (value: number) => void;
  className?: string;
}) {
  const interactive = !!onChange;
  return (
    <div className={cn("flex items-center gap-0.5", className)}>
      {[1, 2, 3, 4, 5].map((n) => {
        const filled = n <= value;
        const star = (
          <Star
            style={{ width: size, height: size }}
            className={cn(filled ? "fill-warning text-warning" : "text-line", interactive && "cursor-pointer")}
          />
        );
        return interactive ? (
          <button key={n} type="button" onClick={() => onChange(n)} aria-label={`${n} star${n > 1 ? "s" : ""}`}>
            {star}
          </button>
        ) : (
          <span key={n}>{star}</span>
        );
      })}
    </div>
  );
}
