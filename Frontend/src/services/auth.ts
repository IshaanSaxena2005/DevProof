import { api } from "../lib/api.mts";
import type { AuthResponse, MeResponse, AccountExportResponse, DeleteAccountResponse } from "../lib/types";

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

  /** Update the current user's editable profile fields. Only name is supported. */
  async updateProfile(name?: string): Promise<AuthResponse> {
    return api.patch<AuthResponse>("/auth/me", { name });
  },

  /** Request an inline JSON export of the current user's own data. */
  async exportData(): Promise<AccountExportResponse> {
    return api.post<AccountExportResponse>("/auth/export");
  },

  /** Permanently delete the current user's account and all of their data. */
  async deleteAccount(): Promise<DeleteAccountResponse> {
    return api.delete<DeleteAccountResponse>("/auth/account");
  },
};
