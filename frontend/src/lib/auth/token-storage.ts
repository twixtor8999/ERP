/**
 * Resilient Access Token Storage.
 * Uses sessionStorage so each browser tab maintains its own independent session.
 * Logging in on Tab 1 does not overwrite or hijack Tab 2.
 */

const STORAGE_KEY = "ai_smart_bazar_access_token";

let inMemoryAccessToken: string | null = null;

export const tokenStorage = {
  getAccessToken(): string | null {
    if (!inMemoryAccessToken && typeof window !== "undefined") {
      try {
        inMemoryAccessToken = sessionStorage.getItem(STORAGE_KEY) || localStorage.getItem(STORAGE_KEY);
      } catch {
        inMemoryAccessToken = null;
      }
    }
    return inMemoryAccessToken;
  },

  setAccessToken(token: string | null): void {
    inMemoryAccessToken = token;
    if (typeof window !== "undefined") {
      try {
        if (token) {
          sessionStorage.setItem(STORAGE_KEY, token);
          // Also clear any legacy persistent token so tabs remain truly isolated
          localStorage.removeItem(STORAGE_KEY);
        } else {
          sessionStorage.removeItem(STORAGE_KEY);
          localStorage.removeItem(STORAGE_KEY);
        }
      } catch {}
    }
  },

  clear(): void {
    inMemoryAccessToken = null;
    if (typeof window !== "undefined") {
      try {
        sessionStorage.removeItem(STORAGE_KEY);
        localStorage.removeItem(STORAGE_KEY);
      } catch {}
    }
  },
};
