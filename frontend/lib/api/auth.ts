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

export interface User {
  id: number;
  username: string;
  email: string;
  display_name: string | null;
  created_at: string;
}

export interface OAuthUrlResponse {
  url: string;
}

export interface AuthConfig {
  github: boolean;
  google: boolean;
}

export interface ForgotPasswordResponse {
  has_oauth_providers: boolean;
  oauth_providers: string[];
  reset_code: string | null;
  message: string;
}

export const authApi = {
  signup(data: SignupData) {
    return api.post<{ status: string }>("/auth/signup", data);
  },

  login(data: LoginData) {
    return api.post<{ status: string }>("/auth/login", data);
  },

  refresh() {
    return api.post<{ status: string }>("/auth/refresh");
  },

  logout() {
    return api.post<{ status: string }>("/auth/logout");
  },

  getMe() {
    return api.get<User>("/auth/me");
  },

  getOAuthUrl(provider: "github" | "google") {
    return api.get<OAuthUrlResponse>(`/auth/oauth/${provider}`);
  },

  getAuthConfig() {
    return api.get<AuthConfig>("/auth/config");
  },

  forgotPassword(username: string) {
    return api.post<ForgotPasswordResponse>("/auth/forgot-password", { username });
  },

  resetPassword(code: string, newPassword: string) {
    return api.post<{ status: string }>("/auth/reset-password", { code, new_password: newPassword });
  },

  setPassword(currentPassword: string | null, newPassword: string) {
    return api.post<{ status: string }>("/auth/set-password", { current_password: currentPassword, new_password: newPassword });
  },
};
