"use client";

import { api } from "@/lib/api";
import { useAuthStore } from "@/lib/auth-store";
import type { User } from "@/lib/types";
import { useMutation } from "@tanstack/react-query";

export interface ProfileInput {
  name?: string;
  username?: string;
  bio?: string;
  website?: string;
  avatar?: string | null;
  cover?: string | null;
  is_private?: boolean;
}

/** Update the current user's profile and sync the auth store. */
export function useUpdateProfile() {
  return useMutation({
    mutationFn: (body: ProfileInput) => api.put<User>("/profile", body),
    onSuccess: (res) => useAuthStore.getState().setUser(res.data),
  });
}
