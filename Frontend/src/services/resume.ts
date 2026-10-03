import { api, ApiError, BASE_URL } from "../lib/api";
import type { ResumeResponse, ResumeUploadResponse } from "../lib/types";

export const resumeService = {
  async get(): Promise<ResumeResponse> {
    return api.get<ResumeResponse>("/resume");
  },

  /**
   * Upload a PDF resume, replacing any previous one.
   *
   * Sent with fetch rather than the shared `api` client because that client
   * sets a JSON content type; multipart needs the browser to set its own
   * boundary, so the header must be left alone entirely.
   */
  async upload(file: File): Promise<ResumeUploadResponse> {
    const body = new FormData();
    body.append("resume", file);

    let response: Response;
    try {
      response = await fetch(`${BASE_URL}/resume`, {
        method: "POST",
        credentials: "include",
        body,
      });
    } catch {
      throw new ApiError("Cannot reach the DevProof API. Is the backend running?", 0);
    }

    const payload = await response.json().catch(() => null);
    if (!response.ok || payload?.success === false) {
      throw new ApiError(payload?.message ?? `Upload failed with status ${response.status}`, response.status);
    }
    return payload.data as ResumeUploadResponse;
  },

  async remove(): Promise<void> {
    await api.delete("/resume");
  },

  /** Direct link to the stored PDF; the session cookie authorises it. */
  downloadUrl(): string {
    return `${BASE_URL}/resume/download`;
  },
};
