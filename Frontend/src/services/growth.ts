import { api } from "../lib/api.mts";
import type { GrowthHistoryResponse } from "../lib/types";

/**
 * Client for /growth.
 *
 * The history is derived on read from rows that already exist, so it is cheap
 * and always current — there is nothing to trigger or refresh.
 */
export const growthService = {
  async history(): Promise<GrowthHistoryResponse> {
    return api.get<GrowthHistoryResponse>("/growth/history");
  },
};
