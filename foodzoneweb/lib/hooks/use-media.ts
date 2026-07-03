"use client";

import { api } from "@/lib/api";
import { prepareImageForUpload } from "@/lib/image";
import { useMutation } from "@tanstack/react-query";

export interface UploadedMedia {
  url: string;
  path: string;
  disk: string;
}

/** Upload an image file to POST /media and receive its absolute URL. */
export function useUploadMedia() {
  return useMutation({
    mutationFn: async ({ file, category }: { file: File; category?: string }) => {
      // Downscale/re-encode oversized photos client-side so a normal camera
      // shot never bounces off the server's upload cap.
      const prepared = await prepareImageForUpload(file);
      const fd = new FormData();
      fd.append("file", prepared);
      if (category) fd.append("category", category);
      const res = await api.post<UploadedMedia>("/media", fd);
      return res.data;
    },
  });
}
