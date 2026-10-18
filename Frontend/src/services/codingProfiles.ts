import { api } from "../lib/api.mts";
import type {
  CodingProfilesResponse,
  CodingProfileResponse,
  CodingPlatform,
} from "../lib/types";

export const codingProfilesService = {
  async getProfiles(): Promise<CodingProfilesResponse> {
    return api.get<CodingProfilesResponse>("/coding-profiles");
  },

  async connectProfile(platform: CodingPlatform, handle: string): Promise<CodingProfileResponse> {
    return api.post<CodingProfileResponse>("/coding-profiles", { platform, handle });
  },

  /** Legacy name kept for ProblemSolving.tsx. */
  async connect(platform: CodingPlatform, handle: string): Promise<CodingProfileResponse> {
    return this.connectProfile(platform, handle);
  },

  async syncProfile(platform: CodingPlatform): Promise<CodingProfileResponse> {
    return api.post<CodingProfileResponse>(`/coding-profiles/${platform}/sync`);
  },

  /** Legacy name kept for ProblemSolving.tsx. */
  async sync(platform: CodingPlatform): Promise<CodingProfileResponse> {
    return this.syncProfile(platform);
  },

  async disconnectProfile(platform: CodingPlatform): Promise<void> {
    await api.delete(`/coding-profiles/${platform}`);
  },

  /** Legacy name kept for ProblemSolving.tsx. */
  async disconnect(platform: CodingPlatform): Promise<void> {
    return this.disconnectProfile(platform);
  },
};
