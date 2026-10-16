/**
 * The dashboard's sections, and the two prefixes they are mounted under.
 *
 * The demo exists so a visitor can walk the *real* dashboard, which means the
 * same ten pages are mounted twice: once under `/dashboard` behind
 * `ProtectedRoute`, once under `/demo` in the open. Listing them here rather than
 * typing them out twice is what keeps that promise honest — the sidebar cannot
 * link to a section the router forgot to mount (or vice versa), and the pages
 * that build links to "the rest of the dashboard" have one place to ask for the
 * prefix instead of guessing.
 *
 * `.mts` so `node --test` can import it directly, the same reasoning as
 * `demo/mode.mts` and `pages/dashboard/ps/activityDays.mts`.
 */

export const DASHBOARD_BASE = "/dashboard";
export const DEMO_BASE = "/demo";

/** Leaving the demo — and signing out — both land on the marketing homepage. */
export const EXIT_DEMO_PATH = "/";

export interface DashboardSection {
  /** Path segment, and the page's identity in both route tables. */
  readonly id: string;
  /** Sidebar and page title label, so the two never disagree. */
  readonly label: string;
}

/**
 * Every section, in sidebar order. `satisfies` pins the ids to a union, which the
 * route tables use as `Record<DashboardSectionId, ...>` — so adding a section here
 * is a compile error until both tables mount it.
 */
export const DASHBOARD_SECTIONS = [
  { id: "overview", label: "Overview" },
  { id: "repositories", label: "Repositories" },
  { id: "developer-360", label: "Developer 360" },
  { id: "skills", label: "Skills" },
  { id: "problem-solving", label: "Problem Solving" },
  { id: "learning", label: "Learning & Achievements" },
  { id: "growth", label: "Growth" },
  { id: "career-readiness", label: "Career Readiness" },
  { id: "ai-insights", label: "AI Insights" },
  { id: "settings", label: "Settings" },
] as const satisfies readonly DashboardSection[];

export type DashboardSectionId = (typeof DASHBOARD_SECTIONS)[number]["id"];

/** Settings sits in the sidebar footer, not the main nav list. */
export const NAV_SECTIONS = DASHBOARD_SECTIONS.filter((section) => section.id !== "settings");

/** Section page under either prefix: `/dashboard/skills` or `/demo/skills`. */
export function sectionPath(base: string, id: DashboardSectionId): string {
  return `${base}/${id}`;
}

/** A repository detail route under either prefix. */
export function repositoryPath(base: string, repoId: string): string {
  return `${base}/repositories/${repoId}`;
}
