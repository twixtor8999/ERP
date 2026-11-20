import { User } from "@/types/common";

export interface AuthTokens {
  access_token: string;
  token_type: string;
  expires_in: number;
}

export interface LoginResponse {
  user: User;
  access_token: string;
  token_type: string;
}

export interface AuthState {
  initialized: boolean;
}
