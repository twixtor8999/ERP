import { apiClient } from "@/lib/api/client";
import { tokenStorage } from "@/lib/auth/token-storage";
import { type User } from "@/types/common";
import { type LoginFormData } from "../schemas/login.schema";
import { type LoginResponse } from "../types";

export const authService = {
  async login(credentials: LoginFormData): Promise<LoginResponse> {
    const response = await apiClient.post<LoginResponse>(
      "/api/v1/auth/login",
      credentials
    );
    tokenStorage.setAccessToken(response.data.access_token);
    return response.data;
  },

  async getCurrentUser(): Promise<User> {
    const response = await apiClient.get<User>("/api/v1/auth/me");
    return response.data;
  },

  async logout(): Promise<void> {
    try {
      await apiClient.post("/api/v1/auth/logout");
    } finally {
      tokenStorage.clear();
    }
  },

  async refreshToken(): Promise<string> {
    const response = await apiClient.post<{ access_token: string }>(
      "/api/v1/auth/refresh"
    );
    tokenStorage.setAccessToken(response.data.access_token);
    return response.data.access_token;
  },
};
