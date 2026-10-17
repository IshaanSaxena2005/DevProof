import { api } from "../lib/api.mts";
import type { CareerReadinessResponse } from "../lib/types";

/**
 * Client for /career.
 *
 * Readiness is computed from stored evidence on every read, so it is always
 * current and there is nothing to trigger or refresh.
 */
export const careerService = {
  async readiness(): Promise<CareerReadinessResponse> {
    return api.get<CareerReadinessResponse>("/career/readiness");
  },
};
