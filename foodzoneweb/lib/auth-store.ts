import { create } from "zustand";
import { api, ApiError } from "./api";
import { clearToken, setToken } from "./token";
import type { User } from "./types";

type AuthStatus = "idle" | "loading" | "authenticated" | "guest" | "deactivated" | "error";

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

// GET /auth/me deliberately sits outside the 'active' middleware group (a
// deactivated user must be able to resolve who they are to reach the
// reactivate flow), so hydrate() has to check the status field itself
// instead of relying on a 403 — every OTHER endpoint would 403 first.
function resolveStatus(user: User): AuthStatus {
  return user.status === "deactivated" ? "deactivated" : "authenticated";
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  status: "idle",

  setAuth: (user, token) => {
    setToken(token);
    set({ user, status: resolveStatus(user) });
  },

  // Recomputes status too: this is how ReactivateScreen transitions the
  // store from "deactivated" back to "authenticated" after a successful
  // POST /profile/reactivate.
  setUser: (user) => set({ user, status: resolveStatus(user) }),

  hydrate: async () => {
    set({ status: "loading" });
    try {
      const { data } = await api.get<User>("/auth/me");
      set({ user: data, status: resolveStatus(data) });
    } catch (e) {
      // Only an actual 401 (invalid/expired token) means "you're logged
      // out" — a network blip or a backend 500 here would otherwise bounce
      // a genuinely-authenticated user to the login screen with the token
      // still valid, which just looks like a random glitch to them.
      if (e instanceof ApiError && e.status === 401) {
        clearToken();
        set({ user: null, status: "guest" });
      } else {
        set({ user: null, status: "error" });
      }
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
