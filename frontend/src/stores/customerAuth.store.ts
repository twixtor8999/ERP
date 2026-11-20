import { create } from "zustand";
import { persist } from "zustand/middleware";

export interface CustomerUser {
  id: string;
  fullName?: string;
  full_name?: string;
  phone: string;
  email?: string | null;
  role?: string;
  status?: string;
}

export interface CustomerProfile {
  id: string;
  user_id?: string;
  customerCode?: string;
  customer_code?: string;
  displayName?: string;
  display_name?: string;
  phone?: string;
  email?: string | null;
  customer_type?: string;
  pricing_tier?: string;
  loyalty_points?: number;
}

export interface SetAuthPayload {
  token: string;
  user: CustomerUser;
  customer: CustomerProfile;
}

interface CustomerAuthState {
  token: string | null;
  user: CustomerUser | null;
  customer: CustomerProfile | null;
  isAuthenticated: boolean;
  setAuth: (
    authDataOrToken: SetAuthPayload | string,
    user?: CustomerUser,
    customer?: CustomerProfile
  ) => void;
  logout: () => void;
}

export const useCustomerAuthStore = create<CustomerAuthState>()(
  persist(
    (set) => ({
      token: null,
      user: null,
      customer: null,
      isAuthenticated: false,
      setAuth: (authDataOrToken, user, customer) => {
        if (typeof authDataOrToken === "string") {
          set({
            token: authDataOrToken,
            user: user || null,
            customer: customer || null,
            isAuthenticated: true,
          });
        } else {
          set({
            token: authDataOrToken.token,
            user: authDataOrToken.user || null,
            customer: authDataOrToken.customer || null,
            isAuthenticated: true,
          });
        }
      },
      logout: () =>
        set({
          token: null,
          user: null,
          customer: null,
          isAuthenticated: false,
        }),
    }),
    {
      name: "siddeshwar_customer_auth",
      // CRITICAL SECURITY HARDENING: Never persist authentication tokens in localStorage!
      // Session persistence is secured via 30-day HttpOnly, SameSite=Lax server cookies.
      partialize: (state) => ({
        user: state.user,
        customer: state.customer,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
);
