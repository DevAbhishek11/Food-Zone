"use client";

import { cn } from "@/lib/cn";
import { useToastStore } from "@/lib/toast-store";
import { CheckCircle2, Info, X, XCircle } from "lucide-react";

const icons = {
  success: CheckCircle2,
  error: XCircle,
  info: Info,
};

const accents = {
  success: "border-success/40",
  error: "border-danger/40",
  info: "border-info/40",
};

export function Toaster() {
  const toasts = useToastStore((s) => s.toasts);
  const dismiss = useToastStore((s) => s.dismiss);

  return (
    <div className="fixed right-4 top-4 z-[100] flex w-full max-w-sm flex-col gap-2">
      {toasts.map((t) => {
        const Icon = icons[t.variant];
        return (
          <div
            key={t.id}
            role="status"
            className={cn(
              "flex items-start gap-3 rounded-lg border bg-surface px-4 py-3 shadow-lg",
              "animate-[fz-shimmer_0s] duration-200",
              accents[t.variant],
            )}
          >
            <Icon
              className={cn(
                "mt-0.5 h-5 w-5 shrink-0",
                t.variant === "success" && "text-success",
                t.variant === "error" && "text-danger",
                t.variant === "info" && "text-info",
              )}
            />
            <p className="flex-1 text-sm text-content">{t.message}</p>
            <button
              onClick={() => dismiss(t.id)}
              className="text-muted hover:text-content"
              aria-label="Dismiss"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        );
      })}
    </div>
  );
}
