import { api } from "../lib/api";
import type {
  CodingPlatform,
  CodingProfileResponse,
  CodingProfilesResponse,
} from "../lib/types";

/**
 * Client for /coding-profiles.
 *
 * connect and sync both call out to the platform, so they are slower than a
 * normal request and are rate limited server-side; the UI should disable its
 * trigger while one is in flight.
 */
export const codingProfilesService = {
  async list(): Promise<CodingProfilesResponse> {
    return api.get<CodingProfilesResponse>("/coding-profiles");
  },

  async connect(platform: CodingPlatform, handle: string): Promise<CodingProfileResponse> {
    return api.post<CodingProfileResponse>("/coding-profiles", { platform, handle });
  },

  async sync(platform: CodingPlatform): Promise<CodingProfileResponse> {
    return api.post<CodingProfileResponse>(`/coding-profiles/${platform}/sync`);
  },

  async disconnect(platform: CodingPlatform): Promise<void> {
    await api.delete(`/coding-profiles/${platform}`);
  },
};
