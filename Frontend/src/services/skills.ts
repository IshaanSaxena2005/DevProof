import { api } from "../lib/api";
import type {
  DeriveSkillsResponse,
  SkillCategory,
  SkillResponse,
  SkillsResponse,
} from "../lib/types";

export const skillsService = {
  async getSkills(): Promise<SkillsResponse> {
    return api.get<SkillsResponse>("/skills");
  },

  /** Rebuilds evidenced skills from the user's analyzed repositories. */
  async deriveSkills(): Promise<DeriveSkillsResponse> {
    return api.post<DeriveSkillsResponse>("/skills/derive");
  },

  /** Adds a skill the user claims; the backend records it at CLAIMED. */
  async addSkill(name: string, category: SkillCategory): Promise<SkillResponse> {
    return api.post<SkillResponse>("/skills", { name, category });
  },

  async deleteSkill(id: string): Promise<void> {
    await api.delete(`/skills/${id}`);
  },
};
