import { create } from "zustand";
import { type User } from "@/types/common";
import { tokenStorage } from "@/lib/auth/token-storage";

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  setUser: (user: User | null) => void;
  setAuthenticated: (status: boolean) => void;
  setLoading: (status: boolean) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isAuthenticated: false,
  isLoading: true,
  setUser: (user) => set({ user, isAuthenticated: !!user }),
  setAuthenticated: (status) => set({ isAuthenticated: status }),
  setLoading: (status) => set({ isLoading: status }),
  logout: () => {
    tokenStorage.clear();
    set({ user: null, isAuthenticated: false, isLoading: false });
  },
}));
