import test from "node:test";
import assert from "node:assert/strict";

import {
  codingProfilesView,
  hasConnectedPlatform,
} from "../src/pages/dashboard/ps/viewState.mts";
import { sampleData } from "../src/demo/sampleData.mts";
import type { CodingProfilesResponse } from "../src/lib/types";

/**
 * The render-state rule behind the Problem Solving navigation-flash fix.
 *
 * The flash came from the page being able to show its disconnected UI before
 * the connection status had settled. These tests pin the decision function the
 * page now routes through: loading always wins, error surfaces only after
 * loading settles, and "connected" is derived from the settled response — so a
 * future refactor cannot silently put the amber "Not connected" warning back
 * in front of an in-flight request.
 */

test("an in-flight request is always the loading view, never error or ready", () => {
  // Even with a stale error string present, loading wins.
  assert.equal(codingProfilesView({ loading: true, error: "boom" }), "loading");
  assert.equal(codingProfilesView({ loading: true, error: null }), "loading");
});

test("a settled failure is the error view, not a disconnected page", () => {
  assert.equal(codingProfilesView({ loading: false, error: "boom" }), "error");
});

test("a settled success is the ready view", () => {
  assert.equal(codingProfilesView({ loading: false, error: null }), "ready");
});

test("connection status is read from the settled response only", () => {
  // Nothing loaded yet — the page must not treat this as "disconnected",
  // which is why the ready view is the only caller.
  assert.equal(hasConnectedPlatform(null), false);
  assert.equal(hasConnectedPlatform({ profiles: [] }), false);
  assert.equal(hasConnectedPlatform(sampleData.codingProfilesResponse), true);

  const empty: CodingProfilesResponse = { profiles: [] };
  assert.equal(hasConnectedPlatform(empty), false);
});
