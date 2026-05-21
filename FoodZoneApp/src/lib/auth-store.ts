import { create } from 'zustand';
import { api, ApiError } from './api';
import { clearToken, loadToken, setToken } from './token';
import type { User } from './types';

type AuthStatus = 'idle' | 'loading' | 'authenticated' | 'guest';

interface AuthState {
  user: User | null;
  status: AuthStatus;
  setAuth: (user: User, token: string) => Promise<void>;
  setUser: (user: User) => void;
  hydrate: () => Promise<void>;
  logout: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  status: 'idle',

  setAuth: async (user, token) => {
    await setToken(token);
    set({ user, status: 'authenticated' });
  },

  setUser: (user) => set({ user }),

  hydrate: async () => {
    set({ status: 'loading' });
    const token = await loadToken();
    if (!token) {
      set({ user: null, status: 'guest' });
      return;
    }
    try {
      const { data } = await api.get<User>('/auth/me');
      set({ user: data, status: 'authenticated' });
    } catch (e) {
      if (e instanceof ApiError && e.status === 401) await clearToken();
      set({ user: null, status: 'guest' });
    }
  },

  logout: async () => {
    try {
      await api.post('/auth/logout');
    } catch {
      // best-effort
    }
    await clearToken();
    set({ user: null, status: 'guest' });
  },
}));
