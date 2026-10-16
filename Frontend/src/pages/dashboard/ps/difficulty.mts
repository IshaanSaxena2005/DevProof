/**
 * Difficulty aggregation for the Problem Solving dashboard.
 *
 * The rule the whole page follows: a platform that publishes no easy/medium/hard
 * split has not told us those counts are zero, and GeeksforGeeks publishes none
 * at all. So the summary tracks, per bucket, whether any connected platform
 * actually reported it — an unknown bucket renders as "—" while a reported zero
 * renders as 0. The two look the same in a bare number and mean opposite things.
 *
 * `.mts` so `node --test` can execute it without a build step (see
 * activityDays.mts for the same reasoning).
 */

/** The fields of a coding-profile row this aggregation reads. */
export interface DifficultySource {
  totalSolved: number;
  easySolved: number | null;
  mediumSolved: number | null;
  hardSolved: number | null;
}

export interface DifficultyBucket {
  /** True when at least one connected platform reported this bucket. */
  known: boolean;
  /** Sum of the reported counts. Zero when nothing was reported. */
  count: number;
}

export interface DifficultySummary {
  easy: DifficultyBucket;
  medium: DifficultyBucket;
  hard: DifficultyBucket;
  /** True when any platform published any part of a split. */
  anyKnown: boolean;
  /** Solves on platforms that published a split — the percentage denominator. */
  classified: number;
  /** Solves on platforms that published none; excluded from the shares. */
  unclassified: number;
  total: number;
}

/**
 * Does this platform report how many of its solves were easy/medium/hard?
 *
 * GeeksforGeeks sends null for all three rather than a zero that would look like
 * a measurement.
 */
export function hasDifficultySplit(profile: DifficultySource): boolean {
  return (
    profile.easySolved !== null || profile.mediumSolved !== null || profile.hardSolved !== null
  );
}

/**
 * Sums the difficulty counts of the connected platforms.
 *
 * Per bucket, not per platform: a platform that reports Easy but not Hard leaves
 * Hard unknown rather than contributing a zero to it, which is what the
 * dashboard would otherwise show as a real count.
 *
 * `classified` keeps its established meaning — the solves on platforms that
 * published a split, and therefore the denominator for every share shown next to
 * these counts. A platform whose split is only partly published still counts as
 * classified: the buckets that did arrive are shares of its solves.
 */
export function summarizeDifficulty(profiles: DifficultySource[]): DifficultySummary {
  const summary: DifficultySummary = {
    easy: { known: false, count: 0 },
    medium: { known: false, count: 0 },
    hard: { known: false, count: 0 },
    anyKnown: false,
    classified: 0,
    unclassified: 0,
    total: 0,
  };

  for (const profile of profiles) {
    summary.total += profile.totalSolved;

    if (!hasDifficultySplit(profile)) {
      summary.unclassified += profile.totalSolved;
      continue;
    }

    summary.anyKnown = true;
    summary.classified += profile.totalSolved;

    const buckets: [DifficultyBucket, number | null][] = [
      [summary.easy, profile.easySolved],
      [summary.medium, profile.mediumSolved],
      [summary.hard, profile.hardSolved],
    ];
    for (const [bucket, value] of buckets) {
      if (value === null) continue;
      bucket.known = true;
      bucket.count += value;
    }
  }

  return summary;
}
