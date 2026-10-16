import test from "node:test";
import assert from "node:assert/strict";

import {
  hasDifficultySplit,
  summarizeDifficulty,
} from "../src/pages/dashboard/ps/difficulty.mts";

/**
 * The difficulty summary decides whether Easy / Medium / Hard are shown as
 * counts or as unavailable. These are the four states the dashboard has to get
 * right, plus the partial-split case an upstream shape change can produce.
 *
 * Only the aggregation is exercised here: the rendering is a ternary on the
 * `known` flags, verified in the browser for the unconnected state and by
 * inspection for the connected ones (no connected account exists, and linking
 * one would write to the database).
 */

/** A row shape close enough to CodingProfile for the fields this module reads. */
const profile = (
  totalSolved: number,
  easy: number | null,
  medium: number | null,
  hard: number | null
) => ({ totalSolved, easySolved: easy, mediumSolved: medium, hardSolved: hard });

test('no connected platforms: every bucket is unknown, not zero', () => {
  const summary = summarizeDifficulty([]);

  assert.equal(summary.anyKnown, false);
  assert.equal(summary.easy.known, false);
  assert.equal(summary.medium.known, false);
  assert.equal(summary.hard.known, false);
  assert.equal(summary.easy.count, 0);
  assert.equal(summary.classified, 0);
  assert.equal(summary.unclassified, 0);
  assert.equal(summary.total, 0);
});

test('GeeksforGeeks only: solves are counted, difficulty stays unknown', () => {
  // What the backend actually stores for a GeeksforGeeks row: a solve total and
  // null for all three buckets, because the site publishes no split.
  const gfg = profile(412, null, null, null);
  const summary = summarizeDifficulty([gfg]);

  assert.equal(hasDifficultySplit(gfg), false);
  assert.equal(summary.total, 412, 'the solve total is real and is still counted');
  assert.equal(summary.unclassified, 412);
  assert.equal(summary.classified, 0);
  assert.equal(summary.anyKnown, false, 'nothing published a split, so nothing is a zero');
  assert.equal(summary.easy.known, false);
  assert.equal(summary.medium.known, false);
  assert.equal(summary.hard.known, false);
});

test('LeetCode with a genuine all-zero split: zeros are shown, not dashes', () => {
  // A brand-new account: every bucket reported, all of them 0.
  const leetcode = profile(0, 0, 0, 0);
  const summary = summarizeDifficulty([leetcode]);

  assert.equal(hasDifficultySplit(leetcode), true);
  assert.equal(summary.anyKnown, true);
  assert.equal(summary.easy.known, true);
  assert.equal(summary.medium.known, true);
  assert.equal(summary.hard.known, true);
  assert.equal(summary.easy.count, 0, 'a reported zero is a measurement');
  assert.equal(summary.medium.count, 0);
  assert.equal(summary.hard.count, 0);
  assert.equal(summary.classified, 0, 'and it is still the percentage denominator');
  assert.equal(summary.unclassified, 0);
});

test('mixed platforms: only the reporting platform feeds the counts and the denominator', () => {
  const leetcode = profile(100, 40, 50, 10);
  const gfg = profile(300, null, null, null);
  const summary = summarizeDifficulty([leetcode, gfg]);

  assert.equal(summary.anyKnown, true);
  assert.equal(summary.easy.count, 40);
  assert.equal(summary.medium.count, 50);
  assert.equal(summary.hard.count, 10);
  assert.equal(summary.classified, 100, 'shares are of the classified solves');
  assert.equal(summary.unclassified, 300, 'the platform without a split is excluded');
  assert.equal(summary.total, 400);
});

test('a partly published split leaves the missing bucket unknown', () => {
  // An upstream change that keeps "All" and "Easy" but drops the other buckets.
  const leetcode = profile(300, 150, null, null);
  const summary = summarizeDifficulty([leetcode]);

  assert.equal(summary.easy.known, true);
  assert.equal(summary.easy.count, 150);
  assert.equal(summary.medium.known, false, 'the missing bucket must not read as 0');
  assert.equal(summary.hard.known, false);
  assert.equal(summary.medium.count, 0);
  assert.equal(summary.hard.count, 0);
  assert.equal(summary.anyKnown, true);
});

test('two platforms that both report a split are summed per bucket', () => {
  const summary = summarizeDifficulty([profile(10, 5, 4, 1), profile(20, 8, 9, 3)]);

  assert.equal(summary.easy.count, 13);
  assert.equal(summary.medium.count, 13);
  assert.equal(summary.hard.count, 4);
  assert.equal(summary.classified, 30);
  assert.equal(summary.unclassified, 0);
});
