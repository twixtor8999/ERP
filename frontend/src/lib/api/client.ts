import axios, { type InternalAxiosRequestConfig } from "axios";
import { tokenStorage } from "@/lib/auth/token-storage";

export const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || "",
  withCredentials: true,
  headers: {
    "Content-Type": "application/json",
  },
});

apiClient.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  if (config.url && !config.url.startsWith("http://") && !config.url.startsWith("https://")) {
    // If URL does not already start with /api/v1, prepend it
    if (!config.url.startsWith("/api/v1") && !config.url.startsWith("api/v1")) {
      const cleanUrl = config.url.startsWith("/") ? config.url : `/${config.url}`;
      config.url = `/api/v1${cleanUrl}`;
    }
  }

  const token = tokenStorage.getAccessToken();
  if (token && !config.headers.Authorization) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});
