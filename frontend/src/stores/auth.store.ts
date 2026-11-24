import { create } from "zustand";
import { type User } from "@/types/common";
import { tokenStorage } from "@/lib/auth/token-storage";

const USER_STORAGE_KEY = "ai_smart_bazar_user";

function getCachedUser(): User | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = sessionStorage.getItem(USER_STORAGE_KEY) || localStorage.getItem(USER_STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as User;
  } catch {
    return null;
  }
}

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  setUser: (user: User | null) => void;
  setAuthenticated: (status: boolean) => void;
  setLoading: (status: boolean) => void;
  logout: () => void;
}

const initialCachedUser = getCachedUser();
const hasInitialToken = !!tokenStorage.getAccessToken();

export const useAuthStore = create<AuthState>((set) => ({
  user: initialCachedUser,
  isAuthenticated: !!(initialCachedUser && hasInitialToken),
  isLoading: false,
  setUser: (user) => {
    if (typeof window !== "undefined") {
      try {
        if (user) {
          sessionStorage.setItem(USER_STORAGE_KEY, JSON.stringify(user));
          // Remove legacy global key so each tab retains independent login identity
          localStorage.removeItem(USER_STORAGE_KEY);
        } else {
          sessionStorage.removeItem(USER_STORAGE_KEY);
          localStorage.removeItem(USER_STORAGE_KEY);
        }
      } catch {}
    }
    set({ user, isAuthenticated: !!user, isLoading: false });
  },
  setAuthenticated: (status) => set({ isAuthenticated: status }),
  setLoading: (status) => set({ isLoading: status }),
  logout: () => {
    tokenStorage.clear();
    if (typeof window !== "undefined") {
      try {
        sessionStorage.removeItem(USER_STORAGE_KEY);
        localStorage.removeItem(USER_STORAGE_KEY);
      } catch {}
    }
    set({ user: null, isAuthenticated: false, isLoading: false });
  },
}));

