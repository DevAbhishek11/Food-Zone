"use client";

import { cn } from "@/lib/cn";
import type { Post } from "@/lib/types";
import { ChevronLeft, ChevronRight, X } from "lucide-react";
import { useCallback, useEffect, useState } from "react";

type Media = Post["media"][number];

/**
 * Post media with layout-aware grid (1 hero, 2/3/4 tiles, "+N" overflow)
 * and a keyboard-navigable lightbox.
 */
export function MediaGrid({ media }: { media: Media[] }) {
  const [lightbox, setLightbox] = useState<number | null>(null);

  const close = useCallback(() => setLightbox(null), []);
  const step = useCallback(
    (dir: 1 | -1) =>
      setLightbox((cur) => (cur === null ? cur : (cur + dir + media.length) % media.length)),
    [media.length],
  );

  useEffect(() => {
    if (lightbox === null) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
      if (e.key === "ArrowRight") step(1);
      if (e.key === "ArrowLeft") step(-1);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [lightbox, close, step]);

  if (media.length === 0) return null;

  const shown = media.slice(0, 4);
  const overflow = media.length - shown.length;

  return (
    <>
      <div
        className={cn(
          "grid gap-0.5",
          shown.length === 1 && "grid-cols-1",
          shown.length === 2 && "grid-cols-2",
          shown.length >= 3 && "grid-cols-2",
        )}
      >
        {shown.map((m, i) => {
          const isHero = shown.length === 3 && i === 0;
          return (
            <button
              key={m.id}
              onClick={() => setLightbox(i)}
              className={cn(
                "relative block overflow-hidden focus:outline-none focus-visible:ring-2 focus-visible:ring-brand/60",
                isHero && "row-span-2",
              )}
              aria-label={`Open photo ${i + 1} of ${media.length}`}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={m.url}
                alt=""
                loading="lazy"
                className={cn(
                  "w-full object-cover transition-transform duration-300 hover:scale-[1.02]",
                  shown.length === 1 ? "max-h-[32rem]" : isHero ? "h-full max-h-96" : "aspect-[4/3] max-h-48",
                )}
              />
              {overflow > 0 && i === shown.length - 1 && (
                <span className="absolute inset-0 flex items-center justify-center bg-black/60 text-xl font-semibold text-white">
                  +{overflow}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Lightbox */}
      {lightbox !== null && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90" onClick={close}>
          <button onClick={close} aria-label="Close" className="absolute right-4 top-4 rounded-full bg-white/10 p-2 text-white hover:bg-white/20">
            <X className="h-5 w-5" />
          </button>

          {media.length > 1 && (
            <>
              <button
                onClick={(e) => { e.stopPropagation(); step(-1); }}
                aria-label="Previous photo"
                className="absolute left-4 rounded-full bg-white/10 p-2 text-white hover:bg-white/20"
              >
                <ChevronLeft className="h-6 w-6" />
              </button>
              <button
                onClick={(e) => { e.stopPropagation(); step(1); }}
                aria-label="Next photo"
                className="absolute right-4 rounded-full bg-white/10 p-2 text-white hover:bg-white/20"
              >
                <ChevronRight className="h-6 w-6" />
              </button>
            </>
          )}

          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={media[lightbox].url}
            alt=""
            onClick={(e) => e.stopPropagation()}
            className="max-h-[90dvh] max-w-[92vw] rounded-lg object-contain"
          />

          {media.length > 1 && (
            <span className="absolute bottom-4 rounded-full bg-white/10 px-3 py-1 text-sm text-white">
              {lightbox + 1} / {media.length}
            </span>
          )}
        </div>
      )}
    </>
  );
}
