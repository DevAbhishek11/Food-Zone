import { create } from "zustand";
import { api, ApiError } from "./api";
import { clearToken, setToken } from "./token";
import type { User } from "./types";

type AuthStatus = "idle" | "loading" | "authenticated" | "guest";

interface AuthState {
  user: User | null;
  status: AuthStatus;
  /** Persist a fresh login/registration result. */
  setAuth: (user: User, token: string) => void;
  setUser: (user: User) => void;
  /** Resolve the current session from a stored token (call once on mount). */
  hydrate: () => Promise<void>;
  logout: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  status: "idle",

  setAuth: (user, token) => {
    setToken(token);
    set({ user, status: "authenticated" });
  },

  setUser: (user) => set({ user }),

  hydrate: async () => {
    set({ status: "loading" });
    try {
      const { data } = await api.get<User>("/auth/me");
      set({ user: data, status: "authenticated" });
    } catch (e) {
      if (e instanceof ApiError && e.status === 401) clearToken();
      set({ user: null, status: "guest" });
    }
  },

  logout: async () => {
    try {
      await api.post("/auth/logout");
    } catch {
      // best-effort; clear locally regardless
    }
    clearToken();
    set({ user: null, status: "guest" });
  },
}));
