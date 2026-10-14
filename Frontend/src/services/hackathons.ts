import { api } from "../lib/api";
import type {
  HackathonInput,
  HackathonMutationResponse,
  HackathonsResponse,
} from "../lib/types";

/**
 * Client for the existing /hackathons backend (list, add, update, remove).
 *
 * Unlike courses and certifications, a hackathon mutation returns
 * `recordedSkills` (technologies newly created at CLAIMED) rather than
 * promotedSkills — a hackathon is self-reported and evidences nothing on its
 * own, so it never moves a skill up the evidence ladder.
 */
export const hackathonsService = {
  async list(): Promise<HackathonsResponse> {
    return api.get<HackathonsResponse>("/hackathons");
  },

  async add(input: HackathonInput): Promise<HackathonMutationResponse> {
    return api.post<HackathonMutationResponse>("/hackathons", input);
  },

  async update(id: string, input: HackathonInput): Promise<HackathonMutationResponse> {
    return api.patch<HackathonMutationResponse>(`/hackathons/${id}`, input);
  },

  async remove(id: string): Promise<void> {
    await api.delete(`/hackathons/${id}`);
  },
};
