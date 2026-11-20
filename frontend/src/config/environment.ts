export const env = {
  apiBaseUrl: import.meta.env.VITE_API_BASE_URL || "http://localhost:8000",
  appName: import.meta.env.VITE_APP_NAME || "AI Smart Bazar",
  appEnv: import.meta.env.VITE_APP_ENV || "development",
  isProduction: import.meta.env.VITE_APP_ENV === "production",
  isDevelopment: import.meta.env.VITE_APP_ENV !== "production",
} as const;

