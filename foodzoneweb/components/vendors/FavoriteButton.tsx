"use client";

import { cn } from "@/lib/cn";
import { useToggleFavorite } from "@/lib/hooks/use-favorites";
import { Heart } from "lucide-react";
import { useState } from "react";

export function FavoriteButton({
  vendorId,
  initial,
  size = 18,
  className,
}: {
  vendorId: number;
  initial?: boolean;
  size?: number;
  className?: string;
}) {
  const [fav, setFav] = useState(!!initial);
  const { favorite, unfavorite } = useToggleFavorite();
  const busy = favorite.isPending || unfavorite.isPending;

  const toggle = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (busy) return;
    const next = !fav;
    setFav(next);
    const m = next ? favorite : unfavorite;
    m.mutate(vendorId, { onError: () => setFav(!next) });
  };

  return (
    <button
      onClick={toggle}
      aria-label={fav ? "Remove from favorites" : "Add to favorites"}
      aria-pressed={fav}
      className={cn(
        "inline-flex items-center justify-center rounded-full bg-bg/70 p-1.5 backdrop-blur transition-colors hover:bg-bg",
        className,
      )}
    >
      <Heart style={{ width: size, height: size }} className={cn(fav ? "fill-brand text-brand" : "text-muted")} />
    </button>
  );
}
