import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

import {
  addUtcDays,
  longestStreakFrom,
  mergeCalendars,
  seriesFrom,
  submissionsWithin,
  utcDayKey,
  utcToday,
} from "../src/pages/dashboard/ps/activityDays.mts";

import { EXIT_DEMO_PATH } from "../src/demo/routes.mts";

/**
 * Deterministic tests for the dashboard's calendar-day convention: every key is
 * a UTC day, every window ends on a UTC day, and no day is ever read from the
 * viewer's local clock.
 *
 * Every case passes an explicit anchor instant and every expectation is written
 * as a UTC day, so nothing here consults the host clock — the results are the
 * same whenever and wherever the suite runs. The zone-shift test below pins the
 * property the convention exists to protect: a viewer west or east of UTC reads
 * the same day the server filed the submission under.
 */

const HERE = fileURLToPath(new URL(".", import.meta.url));
const SRC = `${HERE}../src/`;

function source(relative: string): string {
  return readFileSync(`${SRC}${relative}`, "utf8");
}

/** A fixed anchor: 2024-06-15 in UTC. */
const ANCHOR = new Date("2024-06-15T00:00:00Z");

const day = (offset: number) => utcDayKey(addUtcDays(ANCHOR, offset));

test('a day key is the UTC day, not the local one', () => {
  assert.equal(utcDayKey(new Date("2024-01-01T00:00:00Z")), "2024-01-01");
  assert.equal(
    utcDayKey(new Date("2023-12-31T23:59:59Z")),
    "2023-12-31",
    "one second before UTC midnight still belongs to the previous UTC day"
  );
  assert.equal(
    utcDayKey(new Date("2024-01-01T00:00:01Z")),
    "2024-01-01",
    "one second after belongs to the new UTC day"
  );
});

test('the anchor is UTC midnight of the current UTC day', () => {
  const anchor = utcToday(new Date("2024-06-15T18:30:45.123Z"));

  assert.equal(anchor.getUTCHours(), 0, "the anchor carries no time of day");
  assert.equal(anchor.getUTCMinutes(), 0);
  assert.equal(anchor.getUTCSeconds(), 0);
  assert.equal(utcDayKey(anchor), "2024-06-15");

  assert.equal(
    utcDayKey(utcToday(new Date("2024-06-15T23:59:59Z"))),
    "2024-06-15",
    "the day rolls at UTC midnight, not before"
  );
  assert.equal(utcDayKey(utcToday(new Date("2024-06-16T00:00:00Z"))), "2024-06-16");
});

test('day arithmetic is exact across month, leap-year and year boundaries', () => {
  assert.equal(utcDayKey(addUtcDays(new Date("2024-12-31T00:00:00Z"), 1)), "2025-01-01");
  assert.equal(utcDayKey(addUtcDays(new Date("2025-01-01T00:00:00Z"), -1)), "2024-12-31");
  assert.equal(utcDayKey(addUtcDays(new Date("2024-02-28T00:00:00Z"), 1)), "2024-02-29");
  assert.equal(utcDayKey(addUtcDays(new Date("2023-02-28T00:00:00Z"), 1)), "2023-03-01");
});

test('a viewer west or east of UTC reads the day the submission was filed under', () => {
  // 02:30 UTC on the 15th is still the 14th in New York; 20:00 UTC on the 14th
  // is already the 15th in India. Keys are UTC days, so both viewers look up the
  // day the server stored and not their own local day.
  const lateUtcEvening = new Date("2024-06-15T02:30:00Z");
  const earlyUtcMorning = new Date("2024-06-14T20:00:00Z");
  const inZone = (zone: string, date: Date) =>
    new Intl.DateTimeFormat("en-CA", {
      timeZone: zone,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    }).format(date);

  assert.equal(utcDayKey(lateUtcEvening), "2024-06-15");
  assert.equal(utcDayKey(earlyUtcMorning), "2024-06-14");

  assert.equal(
    inZone("America/New_York", lateUtcEvening),
    "2024-06-14",
    "a New York viewer's local day differs, which is the day a local-key grid used to look up"
  );
  assert.equal(inZone("Asia/Kolkata", earlyUtcMorning), "2024-06-15");

  const filedUnder = { [utcDayKey(lateUtcEvening)]: 4 };
  assert.equal(
    submissionsWithin(filedUnder, 1, lateUtcEvening),
    4,
    "the submission is counted on the day it was filed under"
  );
});

test('merging calendars sums the same UTC day across platforms', () => {
  const merged = mergeCalendars([
    { rawStats: { submissionCalendar: { "2024-06-15": 2, "2024-06-14": 1 } } },
    { rawStats: { submissionCalendar: { "2024-06-15": 3 } } },
    { rawStats: { submissionCalendar: {} } },
    { rawStats: null },
  ]);

  assert.deepEqual(merged, { "2024-06-15": 5, "2024-06-14": 1 });
});

test('no calendar data merges to nothing, so the UI can say "unavailable"', () => {
  const merged = mergeCalendars([
    { rawStats: null },
    { rawStats: { submissionCalendar: {} } },
  ]);

  assert.deepEqual(merged, {}, "an empty merge is the signal for unavailable history");
  assert.equal(Object.keys(merged).length, 0);
});

test('the 7-day series ends on the anchor day and ignores the future', () => {
  const calendar = {
    [day(-7)]: 5, // one day before the window
    [day(-6)]: 1, // first day in the window
    [day(0)]: 1, // the anchor day
    [day(1)]: 9, // has not happened yet
  };

  const points = seriesFrom(calendar, "7D", ANCHOR);

  assert.equal(points.length, 7);
  assert.equal(points[0].value, 1, "the window starts six days before the anchor");
  assert.equal(points[6].value, 1, "the last point is the anchor day itself");
  assert.equal(
    points.reduce((sum, p) => sum + p.value, 0),
    2,
    "neither the day before the window nor the future day is counted"
  );
  assert.ok(
    points.every((p) => p.range === undefined),
    "daily points carry no bucket range"
  );
});

test('the 30- and 90-day series span exactly their windows, anchor included', () => {
  // One day inside each window and one day just outside it, all distinct so each
  // window's total names the days it actually covers.
  const calendar = {
    [day(-29)]: 1, // inside 30D and 90D; the first day of 30D
    [day(-30)]: 7, // outside 30D, inside 90D
    [day(-89)]: 2, // inside both; the first day of 90D
    [day(-90)]: 7, // outside both
  };

  const monthly = seriesFrom(calendar, "30D", ANCHOR);
  assert.equal(monthly.length, 30);
  assert.equal(monthly[0].value, 1, "the first point is 29 days before the anchor");
  assert.equal(
    monthly.reduce((sum, p) => sum + p.value, 0),
    1,
    "only the 29th day back is inside the 30-day window"
  );

  const quarterly = seriesFrom(calendar, "90D", ANCHOR);
  assert.equal(quarterly.length, 90);
  assert.equal(quarterly[0].value, 2, "the first point is 89 days before the anchor");
  assert.equal(
    quarterly.reduce((sum, p) => sum + p.value, 0),
    2 + 7 + 1,
    "all three in-window days are summed, and the 90th day back is not"
  );
});

test('the 1Y series is whole weeks ending on the anchor day, with no future days', () => {
  const calendar = {
    [day(-363)]: 1, // the first day of the earliest bucket
    [day(-364)]: 7, // one day before the whole chart
    [day(0)]: 1, // the last day of the most recent bucket
    [day(1)]: 9, // future
  };

  const points = seriesFrom(calendar, "1Y", ANCHOR);

  assert.equal(points.length, 52, "52 whole weeks, not 365 daily columns");
  assert.equal(points[0].value, 1, "the earliest bucket starts 363 days back");
  assert.equal(points[points.length - 1].value, 1, "the last bucket includes the anchor day");
  assert.equal(
    points.reduce((sum, p) => sum + p.value, 0),
    2,
    "nothing older than the chart and nothing in the future is counted"
  );
  assert.ok(
    points.every((p) => typeof p.range === "string" && p.range.length > 0),
    "each weekly point states the span it sums"
  );
});

test('an empty calendar yields zero counts, not a broken series', () => {
  const points = seriesFrom({}, "30D", ANCHOR);

  assert.equal(points.length, 30);
  assert.ok(
    points.every((p) => p.value === 0),
    "an empty map is a stretch of zero-activity days; the page decides what to show"
  );
});

test('trailing windows include the anchor day and stop at their boundary', () => {
  const calendar = { [day(0)]: 1, [day(-1)]: 2, [day(-6)]: 3, [day(-7)]: 4 };

  assert.equal(submissionsWithin(calendar, 7, ANCHOR), 6);
  assert.equal(submissionsWithin(calendar, 1, ANCHOR), 1);
  assert.equal(submissionsWithin({}, 7, ANCHOR), 0);
});

test('a trailing window crosses a year boundary without losing days', () => {
  const calendar = {
    "2025-01-02": 1,
    "2024-12-31": 2,
    "2024-12-27": 3,
    "2024-12-26": 4,
  };

  assert.equal(
    submissionsWithin(calendar, 7, new Date("2025-01-02T00:00:00Z")),
    6,
    "2024-12-27 through 2025-01-02 is a single 7-day window"
  );
});

test('streaks count consecutive UTC days and cross the year boundary', () => {
  assert.equal(longestStreakFrom({}), 0);
  assert.equal(longestStreakFrom({ "2024-06-15": 1 }), 1);
  assert.equal(
    longestStreakFrom({ "2024-06-13": 1, "2024-06-15": 1 }),
    1,
    "a missing day breaks the run"
  );
  assert.equal(longestStreakFrom({ "2024-06-14": 1, "2024-06-15": 1 }), 2);
  assert.equal(
    longestStreakFrom({ "2025-01-01": 1, "2024-12-31": 1, "2024-12-30": 1 }),
    3,
    "the year boundary is just another consecutive day"
  );
  assert.equal(
    longestStreakFrom({ "2024-06-01": 1, "2024-06-02": 1, "2024-07-01": 1 }),
    2
  );
});

/* ────────────────────────────────────────────────────────────
   Logout redirect behavior
   ──────────────────────────────────────────────────────────── */

test("the sidebar logout navigates to the homepage, not /login", () => {
  const sidebar = source("components/Sidebar.tsx");

  // The real logout path (not the demo exit) must navigate to the shared exit
  // path, which is "/" — the public homepage — not "/login".
  assert.match(sidebar, /navigate\(EXIT_DEMO_PATH/);
  assert.equal(EXIT_DEMO_PATH, "/", "EXIT_DEMO_PATH is the homepage");
});

test("the sidebar logout handles API failure without blocking navigation", () => {
  const sidebar = source("components/Sidebar.tsx");

  // Navigation must happen before the logout request resolves, so a failing or
  // slow backend never traps the user in the dashboard.
  assert.match(
    sidebar,
    /navigate\(EXIT_DEMO_PATH/,
    "navigation is called with EXIT_DEMO_PATH"
  );

  // The logout request is fire-and-forget: .catch handles failures.
  assert.match(sidebar, /logout\(\)\.catch/);

  // Navigation happens before the catch, so failure doesn't block it.
  const navigatePos = sidebar.indexOf("navigate(EXIT_DEMO_PATH");
  const catchPos = sidebar.indexOf(".catch");
  assert.ok(navigatePos < catchPos, "navigation call appears before the catch handler");
});

test("the logout flow preserves route protection", () => {
  const protectedRoute = source("components/ProtectedRoute.tsx");

  // ProtectedRoute must still gate the dashboard after logout.
  assert.match(protectedRoute, /<Navigate to="\/login"/);
  assert.match(protectedRoute, /from: location\.pathname/);
});

test("the public homepage remains the logout destination on mobile too", () => {
  // Both shells that can trigger logout (desktop sidebar + mobile drawer) share
  // the same Sidebar component and therefore the same EXIT_DEMO_PATH.
  const layout = source("layouts/DashboardLayout.tsx");

  assert.match(layout, /<Sidebar onClose/);
  assert.match(layout, /<Sidebar \/>/);
  assert.equal(EXIT_DEMO_PATH, "/");
});;
