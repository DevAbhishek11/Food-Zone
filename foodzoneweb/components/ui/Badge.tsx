import { cn } from "@/lib/cn";
import type { ReactNode } from "react";

type BadgeVariant = "neutral" | "brand" | "success" | "warning" | "danger" | "info";

const filled: Record<BadgeVariant, string> = {
  neutral: "bg-surface text-muted",
  brand: "bg-brand/15 text-brand",
  success: "bg-success-bg text-success",
  warning: "bg-warning-bg text-warning",
  danger: "bg-danger-bg text-danger",
  info: "bg-info-bg text-info",
};

const outlined: Record<BadgeVariant, string> = {
  neutral: "border border-line text-muted",
  brand: "border border-brand/40 text-brand",
  success: "border border-success/40 text-success",
  warning: "border border-warning/40 text-warning",
  danger: "border border-danger/40 text-danger",
  info: "border border-info/40 text-info",
};

export function Badge({
  variant = "neutral",
  dot = false,
  outline = false,
  className,
  children,
}: {
  variant?: BadgeVariant;
  dot?: boolean;
  outline?: boolean;
  className?: string;
  children: ReactNode;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium",
        outline ? outlined[variant] : filled[variant],
        className,
      )}
    >
      {dot && <span className="h-1.5 w-1.5 rounded-full bg-current" />}
      {children}
    </span>
  );
}
