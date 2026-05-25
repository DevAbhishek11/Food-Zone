"use client";

import { createContext, useContext, type ReactNode } from "react";
import { useAuthStore } from "./auth-store";
import type { User } from "./types";

/**
 * Provides a GUARANTEED non-null authenticated user to the protected app area.
 * Mounted only after the session is resolved (see app/(app)/layout.tsx), so any
 * component under it can read `useAuth().user` without null checks — preventing
 * "cannot read property of null" crashes when the session changes.
 */
interface AuthContextValue {
  user: User;
  setUser: (user: User) => void;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ user, children }: { user: User; children: ReactNode }) {
  const setUser = useAuthStore((s) => s.setUser);
  const logout = useAuthStore((s) => s.logout);

  return <AuthContext.Provider value={{ user, setUser, logout }}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth must be used within the authenticated area (AuthProvider).");
  }
  return ctx;
}
