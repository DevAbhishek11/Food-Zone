"use client";

import { api } from "@/lib/api";
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
      const fd = new FormData();
      fd.append("file", file);
      if (category) fd.append("category", category);
      const res = await api.post<UploadedMedia>("/media", fd);
      return res.data;
    },
  });
}
