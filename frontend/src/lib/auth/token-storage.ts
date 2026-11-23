/**
 * Resilient Access Token Storage.
 * Syncs in-memory state with localStorage to survive page reloads and cross-module routing.
 */

const STORAGE_KEY = "ai_smart_bazar_access_token";

let inMemoryAccessToken: string | null = null;

export const tokenStorage = {
  getAccessToken(): string | null {
    if (!inMemoryAccessToken && typeof window !== "undefined") {
      try {
        inMemoryAccessToken = localStorage.getItem(STORAGE_KEY);
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
          localStorage.setItem(STORAGE_KEY, token);
        } else {
          localStorage.removeItem(STORAGE_KEY);
        }
      } catch {}
    }
  },

  clear(): void {
    inMemoryAccessToken = null;
    if (typeof window !== "undefined") {
      try {
        localStorage.removeItem(STORAGE_KEY);
      } catch {}
    }
  },
};
