import type { CodingProfile } from "../../../lib/types";
import type { ActivityPoint } from "./ProblemActivityChart";

/**
 * The dashboard's calendar-day convention: **every day key is a UTC calendar
 * day** (`YYYY-MM-DD`).
 *
 * The backend derives the submission calendar from LeetCode's epoch-keyed
 * payload with `new Date(epoch * 1000).toISOString().slice(0, 10)` (see
 * Backend/src/services/leetcode.service.ts, parseCalendar), so a stored key is
 * the UTC day a submission happened. A server cannot know the viewer's
 * timezone, so the calendar is UTC by construction.
 *
 * The page therefore reads days in UTC as well. It previously built keys from
 * local date parts, which disagreed with the stored keys for anyone who is not
 * on UTC: a submission at 2026-10-13T02:00Z was filed under 2026-10-13 and then
 * looked up under 2026-10-12 (UTC-5), landing on the wrong heatmap cell and in
 * the wrong trailing-window counts. Day maths, key building and label rendering
 * all happen in UTC here so no submission can shift a day.
 *
 * This module is `.mts` on purpose: it holds no JSX and no runtime imports, so
 * `node --test` can execute it directly (type stripping, no build, no new
 * dependency) while Vite bundles it for the app as usual.
 */

const MS_PER_DAY = 86_400_000;

/** The `YYYY-MM-DD` UTC day key for an instant. */
export function utcDayKey(date: Date): string {
  return date.toISOString().slice(0, 10);
}

/** UTC midnight of the current UTC day — the anchor every window is measured from. */
export function utcToday(now: Date = new Date()): Date {
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
}

/** Exact day arithmetic: UTC has no daylight-saving transitions to absorb. */
export function addUtcDays(date: Date, days: number): Date {
  return new Date(date.getTime() + days * MS_PER_DAY);
}

/**
 * A human label for a UTC day.
 *
 * `timeZone: "UTC"` is not decoration: rendering a UTC-midnight instant in the
 * viewer's local zone would print the previous day for anyone west of
 * Greenwich, so the label would disagree with the key it came from.
 */
export function formatUtcDay(
  date: Date,
  options: Intl.DateTimeFormatOptions = { month: "short", day: "numeric" }
): string {
  return date.toLocaleDateString(undefined, { ...options, timeZone: "UTC" });
}

/** Period selectors the analytics chart offers, in days. */
const WINDOWS: Record<string, number> = { "7D": 7, "30D": 30, "90D": 90, "1Y": 365 };

/**
 * Merges every connected platform's daily counts into one UTC-date map.
 *
 * A platform that publishes no calendar contributes nothing, so an empty result
 * means "no history available" — which the UI renders as unavailable, not as a
 * stretch of zero-activity days.
 */
export function mergeCalendars(
  profiles: Pick<CodingProfile, "rawStats">[]
): Record<string, number> {
  const merged: Record<string, number> = {};
  for (const profile of profiles) {
    for (const [day, count] of Object.entries(profile.rawStats?.submissionCalendar ?? {})) {
      merged[day] = (merged[day] ?? 0) + count;
    }
  }
  return merged;
}

/**
 * Submission counts over the trailing window the period selector asks for,
 * newest bucket last, ending on `today` (inclusive).
 *
 * Windows longer than a quarter are bucketed into whole weeks so the line stays
 * readable — and the buckets end on the anchor day, so nothing in the future is
 * counted and no history is dropped off the far end. Each weekly point carries
 * the `range` it sums, because a weekly bucket labelled with a single date reads
 * as a single day.
 */
export function seriesFrom(
  calendar: Record<string, number>,
  period: string,
  today: Date = utcToday()
): ActivityPoint[] {
  const days = WINDOWS[period] ?? WINDOWS["30D"];
  const step = days > 90 ? 7 : 1;
  const buckets = step > 1 ? Math.floor(days / step) : days;

  const points: ActivityPoint[] = [];
  for (let bucket = buckets - 1; bucket >= 0; bucket--) {
    const start = addUtcDays(today, -(bucket * step + step - 1));

    let value = 0;
    for (let offset = 0; offset < step; offset++) {
      value += calendar[utcDayKey(addUtcDays(start, offset))] ?? 0;
    }

    const end = addUtcDays(start, step - 1);
    points.push({
      label: formatUtcDay(start),
      range: step > 1 ? `${formatUtcDay(start)} – ${formatUtcDay(end)}` : undefined,
      value,
    });
  }
  return points;
}

/** Submissions across the trailing `days` window, `today` included. */
export function submissionsWithin(
  calendar: Record<string, number>,
  days: number,
  today: Date = utcToday()
): number {
  let total = 0;
  for (let i = 0; i < days; i++) {
    total += calendar[utcDayKey(addUtcDays(today, -i))] ?? 0;
  }
  return total;
}

/**
 * Longest run of consecutive active UTC days anywhere in the recorded history.
 *
 * Days are compared as UTC instants, so a year boundary (or any other calendar
 * change) is just another consecutive day.
 */
export function longestStreakFrom(calendar: Record<string, number>): number {
  const days = Object.keys(calendar).sort();
  let longest = 0;
  let run = 0;
  let previous: number | null = null;

  for (const day of days) {
    const time = Date.parse(`${day}T00:00:00Z`);
    if (Number.isNaN(time)) continue;
    const consecutive = previous !== null && Math.round((time - previous) / MS_PER_DAY) === 1;
    run = consecutive ? run + 1 : 1;
    if (run > longest) longest = run;
    previous = time;
  }
  return longest;
}
