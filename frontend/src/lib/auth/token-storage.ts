/**
 * In-memory access token storage.
 * Enforces zero tokens stored in browser localStorage or sessionStorage.
 */

let inMemoryAccessToken: string | null = null;

export const tokenStorage = {
  getAccessToken(): string | null {
    return inMemoryAccessToken;
  },

  setAccessToken(token: string | null): void {
    inMemoryAccessToken = token;
  },

  clear(): void {
    inMemoryAccessToken = null;
  },
};
