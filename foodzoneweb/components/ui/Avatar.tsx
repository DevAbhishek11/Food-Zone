import { cn } from "@/lib/cn";
import { BadgeCheck } from "lucide-react";

interface AvatarProps {
  src?: string | null;
  name: string;
  size?: number;
  className?: string;
  /** Gradient story ring around the avatar. */
  ring?: boolean;
  /** Green online-presence dot (bottom-right). */
  online?: boolean;
  /** Verified checkmark overlay (bottom-right; takes precedence over `online`). */
  verified?: boolean;
}

/** Deterministic hue from a string, for initials-fallback gradients. */
function hueFrom(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) % 360;
  return h;
}

/** Avatar with graceful initials fallback, optional story ring + status badges. */
export function Avatar({ src, name, size = 40, className, ring, online, verified }: AvatarProps) {
  const initials = name
    .split(" ")
    .map((p) => p[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase();

  const hue = hueFrom(name || "?");
  const badgeSize = Math.max(10, Math.round(size * 0.3));

  const inner = (
    <span
      className={cn(
        "inline-flex shrink-0 items-center justify-center overflow-hidden rounded-full text-xs font-semibold text-white",
        className,
      )}
      style={{
        width: size,
        height: size,
        background: src ? undefined : `linear-gradient(135deg, hsl(${hue} 55% 45%), hsl(${(hue + 40) % 360} 55% 32%))`,
      }}
    >
      {src ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={src} alt={name} className="h-full w-full object-cover" />
      ) : (
        initials || "?"
      )}
    </span>
  );

  // No decorations → return the bare avatar (keeps existing call sites identical).
  if (!ring && !online && !verified) return inner;

  return (
    <span className="relative inline-flex shrink-0">
      {ring ? (
        <span className="fz-gradient-brand inline-flex items-center justify-center rounded-full p-[2px]">
          <span className="rounded-full bg-bg p-[2px]">{inner}</span>
        </span>
      ) : (
        inner
      )}

      {verified ? (
        <BadgeCheck
          className="absolute -bottom-0.5 -right-0.5 rounded-full bg-bg text-info"
          style={{ width: badgeSize, height: badgeSize }}
        />
      ) : online ? (
        <span
          className="absolute bottom-0 right-0 rounded-full border-2 border-bg bg-success"
          style={{ width: badgeSize, height: badgeSize }}
        />
      ) : null}
    </span>
  );
}
