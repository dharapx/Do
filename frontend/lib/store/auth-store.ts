import { create } from "zustand";
import { persist } from "zustand/middleware";

interface User {
  id: number;
  username: string;
  email: string;
  display_name: string | null;
}

interface AuthState {
  user: User | null;
  hasHydrated: boolean;
  accessToken: string | null;
  refreshToken: string | null;
  setAuth: (user: User | null) => void;
  setTokens: (accessToken: string | null, refreshToken: string | null) => void;
  clearAuth: () => void;
  setHasHydrated: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      hasHydrated: false,
      accessToken: null,
      refreshToken: null,
      setAuth: (user) => set({ user }),
      setTokens: (accessToken, refreshToken) => set({ accessToken, refreshToken }),
      clearAuth: () => set({ user: null, accessToken: null, refreshToken: null }),
      setHasHydrated: () => set({ hasHydrated: true }),
    }),
    {
      name: "auth-storage",
      partialize: (state) => ({ user: state.user }),
      onRehydrateStorage: () => (state) => {
        if (state) state.setHasHydrated();
      },
    }
  )
);

if (typeof window !== "undefined") {
  (window as any).__ZUSTAND_STORE__ = useAuthStore;
}
