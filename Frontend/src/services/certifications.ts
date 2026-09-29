import { api } from "../lib/api";
import type {
  CertificationInput,
  CertificationMutationResponse,
  CertificationsResponse,
} from "../lib/types";

/**
 * Client for the existing /certifications backend (list, add, update, remove).
 * Verification is not part of the API, so the UI must never render a
 * "Verified" state — "Credential added" is the strongest claim available.
 */
export const certificationsService = {
  async list(): Promise<CertificationsResponse> {
    return api.get<CertificationsResponse>("/certifications");
  },

  async add(input: CertificationInput): Promise<CertificationMutationResponse> {
    return api.post<CertificationMutationResponse>("/certifications", input);
  },

  async update(id: string, input: CertificationInput): Promise<CertificationMutationResponse> {
    return api.patch<CertificationMutationResponse>(`/certifications/${id}`, input);
  },

  async remove(id: string): Promise<void> {
    await api.delete(`/certifications/${id}`);
  },
};
