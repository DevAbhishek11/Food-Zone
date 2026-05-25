"use client";

import { cn } from "@/lib/cn";
import { useUploadMedia } from "@/lib/hooks/use-media";
import { toast } from "@/lib/toast-store";
import { ImagePlus, Loader2, X } from "lucide-react";
import { useRef } from "react";

/** File-picker → uploads to /media → returns the URL via onChange. */
export function ImageUpload({
  value,
  onChange,
  category = "misc",
  className,
  rounded,
  label = "Upload image",
}: {
  value: string | null;
  onChange: (url: string | null) => void;
  category?: string;
  className?: string;
  rounded?: boolean;
  label?: string;
}) {
  const upload = useUploadMedia();
  const inputRef = useRef<HTMLInputElement>(null);

  const pick = () => inputRef.current?.click();

  const onFile = async (file: File | undefined) => {
    if (!file) return;
    try {
      const media = await upload.mutateAsync({ file, category });
      onChange(media.url);
    } catch {
      toast.error("Upload failed. Try a smaller image.");
    }
  };

  return (
    <div className={cn("flex items-center gap-3", className)}>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => onFile(e.target.files?.[0])}
      />
      <button
        type="button"
        onClick={pick}
        disabled={upload.isPending}
        className={cn(
          "relative flex items-center justify-center overflow-hidden border border-line bg-surface text-muted transition-colors hover:border-brand/50",
          rounded ? "h-16 w-16 rounded-full" : "h-20 w-20 rounded-lg",
        )}
        aria-label={label}
      >
        {upload.isPending ? (
          <Loader2 className="h-5 w-5 animate-spin text-brand" />
        ) : value ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={value} alt="" className="h-full w-full object-cover" />
        ) : (
          <ImagePlus className="h-5 w-5" />
        )}
      </button>
      <div className="flex flex-col gap-1">
        <button type="button" onClick={pick} disabled={upload.isPending} className="text-sm text-brand hover:underline disabled:opacity-50">
          {value ? "Change" : label}
        </button>
        {value && (
          <button type="button" onClick={() => onChange(null)} className="flex items-center gap-1 text-xs text-muted hover:text-danger">
            <X className="h-3 w-3" /> Remove
          </button>
        )}
      </div>
    </div>
  );
}
