import { cn } from "@/lib/cn";
import type { HTMLAttributes } from "react";

type CardVariant = "default" | "elevated" | "interactive" | "glass";

const variants: Record<CardVariant, string> = {
  default: "bg-bg-card border border-border shadow-md",
  elevated: "bg-bg-card border border-border shadow-lg",
  interactive:
    "bg-bg-card border border-border shadow-md transition-all duration-200 hover:-translate-y-0.5 hover:border-brand/40 hover:shadow-glow",
  glass: "border border-border bg-white/[0.04] backdrop-blur-xl",
};

export function Card({
  variant = "default",
  className,
  ...props
}: HTMLAttributes<HTMLDivElement> & { variant?: CardVariant }) {
  return <div className={cn("rounded-lg", variants[variant], className)} {...props} />;
}
