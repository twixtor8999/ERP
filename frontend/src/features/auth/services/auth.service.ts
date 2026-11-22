import { apiClient } from "@/lib/api/client";
import { tokenStorage } from "@/lib/auth/token-storage";
import { type User } from "@/types/common";
import { type LoginFormData } from "../schemas/login.schema";
import { type LoginResponse } from "../types";

export interface RegisterFormData {
  full_name: string;
  phone: string;
  password: string;
  role_slug: string;
  email?: string;
}

export interface RegistrationRoleItem {
  slug: string;
  name: string;
  badge: string;
  description: string;
}

export const authService = {
  async login(credentials: LoginFormData): Promise<LoginResponse> {
    const response = await apiClient.post<LoginResponse>(
      "/api/v1/auth/login",
      credentials
    );
    tokenStorage.setAccessToken(response.data.access_token);
    return response.data;
  },

  async register(data: RegisterFormData): Promise<any> {
    const response = await apiClient.post("/api/v1/auth/register", {
      ...data,
      requested_role_slug: data.role_slug,
    });
    return response.data;
  },

  async getRegistrationRoles(): Promise<RegistrationRoleItem[]> {
    const response = await apiClient.get<RegistrationRoleItem[]>("/api/v1/auth/registration-roles");
    return response.data;
  },

  async getCurrentUser(): Promise<User> {
    const response = await apiClient.get<User>("/api/v1/auth/me");
    if (!response.data || typeof response.data !== "object" || typeof (response.data as any).id !== "string") {
      throw new Error("Invalid session payload received");
    }
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

