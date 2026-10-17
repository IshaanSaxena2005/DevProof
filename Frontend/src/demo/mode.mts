/**
 * Whether the app is currently rendering the public demo.
 *
 * The demo is read-only by design: its data is synthetic and lives entirely in
 * the frontend, so a demo visitor has no account behind them and no row of their
 * own to create, update or delete. Rather than relying on every page to
 * remember that, the demo turns the *mutating* half of the API client off for as
 * long as it is mounted (see lib/api.mts).
 *
 * This is deliberately a module-scoped flag rather than storage or a cookie: it
 * must not survive a reload (a reloaded demo re-arms it from the route) and it
 * must not be readable by the authenticated dashboard. The normal dashboard
 * never sets it, so every real request behaves exactly as before.
 *
 * `.mts` so `node --test` can execute it without a build step (same reasoning as
 * pages/dashboard/ps/activityDays.mts).
 */

let demoActive = false;

/** Explicitly true only while the demo shell is mounted. */
export function setDemoActive(active: boolean): void {
  demoActive = active;
}

export function isDemoActive(): boolean {
  return demoActive;
}

/**
 * The message the API client raises when a demo visitor is not signed in and
 * something tries to write. Wording says "sample" rather than "demo" so it reads
 * on its own in a toast or error block, without the badge nearby.
 */
export const DEMO_READ_ONLY_MESSAGE =
  "Demo mode is read-only: this sample profile has no account to change. Exit the demo and sign in to make changes.";
