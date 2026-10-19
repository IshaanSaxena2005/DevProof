/**
 * The Problem Solving page's render state, decided in one place.
 *
 * Exists because of a navigation flash: the page branches on `loading` and
 * `error` before rendering, and the rule that matters for correctness is that
 * the disconnected UI ("Not connected" chip, amber notice, zeroed cards) may
 * only ever be reached from the *ready* state — never while the fetch is still
 * in flight. Pinning that decision as a pure function makes it testable with
 * `node --test`, the same reasoning as activityDays.mts and difficulty.mts.
 *
 * `.mts` so `node --test` can execute it without a build step.
 */
import type { CodingProfilesResponse } from "../../../lib/types";

export type CodingProfilesView = "loading" | "error" | "ready";

/**
 * Loading wins over everything: the caller must render the loading skeleton
 * whenever a request is in flight, even if an error string or stale data is
 * also present. Error is checked only once loading has settled, and "ready"
 * means exactly "the request settled without failure" — it says nothing about
 * whether a platform is connected (see hasConnectedPlatform).
 */
export function codingProfilesView(input: {
  loading: boolean;
  error: string | null;
}): CodingProfilesView {
  if (input.loading) return "loading";
  if (input.error) return "error";
  return "ready";
}

/**
 * Whether the response actually carries a connected platform.
 *
 * A null response (nothing loaded yet) is "not connected" the same way an
 * empty profiles list is — but this is only ever consulted from the ready
 * state, where data has settled, so the two cases cannot be confused on screen.
 */
export function hasConnectedPlatform(data: CodingProfilesResponse | null): boolean {
  return (data?.profiles?.length ?? 0) > 0;
}
