import { api } from "../lib/api";
import type { AuthResponse, MeResponse } from "../lib/types";

export const authService = {
  async register(email: string, password: string, name?: string): Promise<AuthResponse> {
    return api.post<AuthResponse>("/auth/register", {
      email,
      password,
      ...(name ? { name } : {}),
    });
  },

  async login(email: string, password: string): Promise<AuthResponse> {
    return api.post<AuthResponse>("/auth/login", { email, password });
  },

  async logout(): Promise<void> {
    await api.post("/auth/logout");
  },

  async getCurrentUser(): Promise<MeResponse> {
    return api.get<MeResponse>("/auth/me");
  },
};
