import { api } from "./client";

export interface SignupData {
  username: string;
  email: string;
  password: string;
  display_name?: string;
}

export interface LoginData {
  username: string;
  password: string;
}

export interface TokenResponse {
  access_token: string;
  token_type: string;
}

export interface User {
  id: number;
  username: string;
  email: string;
  display_name: string | null;
  created_at: string;
}

export const authApi = {
  signup(data: SignupData) {
    return api.post<TokenResponse>("/auth/signup", data);
  },

  login(data: LoginData) {
    return api.post<TokenResponse>("/auth/login", data);
  },

  getMe() {
    return api.get<User>("/auth/me");
  },
};
