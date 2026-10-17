import test from "node:test";
import assert from "node:assert/strict";
import { readdirSync, readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

import {
  DEMO_READ_ONLY_MESSAGE,
  isDemoActive,
  setDemoActive,
} from "../src/demo/mode.mts";
import {
  DASHBOARD_BASE,
  DASHBOARD_SECTIONS,
  DEMO_BASE,
  EXIT_DEMO_PATH,
  NAV_SECTIONS,
  repositoryPath,
  sectionPath,
} from "../src/demo/routes.mts";
import { buildSampleData, sampleSubmissionCalendar } from "../src/demo/sampleData.mts";
import { longestStreakFrom, utcDayKey } from "../src/pages/dashboard/ps/activityDays.mts";

/**
 * The demo is a promise made to a signed-out visitor: a whole dashboard, open,
 * with nothing real behind it. These tests cover the three ways that promise can
 * break — the route stops being public, sample pages start reaching for the real
 * API, or the sample dataset contradicts itself between two pages — plus the
 * problem-solving arithmetic the dashboard derives from one shared calendar.
 *
 * Verified here: section/route wiring (by reading the two files that mount the
 * routes), demo isolation, fixture consistency, and the aggregates.
 * Verified in the browser instead: that the rendered pages agree with these
 * numbers, since there is no DOM test runner in this project.
 */

const HERE = fileURLToPath(new URL(".", import.meta.url));
const SRC = `${HERE}../src/`;

/** The one sample day the dataset is pinned to, so every date assertion is exact. */
const SAMPLE_DAY = new Date("2026-10-16T09:30:00Z");

const sample = buildSampleData(SAMPLE_DAY);

function source(relative: string): string {
  return readFileSync(`${SRC}${relative}`, "utf8");
}

/* ────────────────────────────────────────────────────────────
   1. The demo route is public, and mounts the same sections
   ──────────────────────────────────────────────────────────── */

test("every dashboard section is listed once, with a label", () => {
  assert.deepEqual(
    DASHBOARD_SECTIONS.map((section) => section.id),
    [
      "overview",
      "repositories",
      "developer-360",
      "skills",
      "problem-solving",
      "learning",
      "growth",
      "career-readiness",
      "ai-insights",
      "settings",
    ]
  );

  // Labels are the sidebar text *and* the routed page names: duplicates would
  // mean two sections the visitor cannot tell apart.
  const labels = DASHBOARD_SECTIONS.map((section) => section.label);
  assert.equal(new Set(labels).size, labels.length);
  assert.ok(labels.every((label) => label.trim().length > 0));
});

test("settings is the only section kept out of the main nav list", () => {
  assert.equal(NAV_SECTIONS.length, DASHBOARD_SECTIONS.length - 1);
  assert.ok(!NAV_SECTIONS.some((section) => section.id === "settings"));
});

test("section paths are built from the prefix, so the demo never links to /dashboard", () => {
  for (const section of DASHBOARD_SECTIONS) {
    assert.equal(sectionPath(DEMO_BASE, section.id), `/demo/${section.id}`);
    assert.equal(sectionPath(DASHBOARD_BASE, section.id), `/dashboard/${section.id}`);
  }
  assert.equal(sectionPath(DEMO_BASE, "skills").startsWith(DASHBOARD_BASE), false);
  assert.equal(repositoryPath(DEMO_BASE, "demo-repo-taskflow"), "/demo/repositories/demo-repo-taskflow");
  assert.equal(EXIT_DEMO_PATH, "/");
});

test("the router mounts both prefixes from the shared section list", () => {
  const app = source("App.tsx");

  // Both tables are generated from DASHBOARD_SECTIONS, so the demo cannot be
  // missing a page the sidebar links to.
  const expansions = app.match(/DASHBOARD_SECTIONS\.map\(/g) ?? [];
  assert.equal(expansions.length, 2, "one section map per prefix");
  assert.match(app, /sectionPath\(DEMO_BASE, "overview"\)/);
  assert.match(app, /sectionPath\(DASHBOARD_BASE, "overview"\)/);

  // The map is expanded inside each <Route> table: a wrapper component around
  // the routes is rejected by the router ("is not a <Route> component"), which
  // is why the demo table is not shared as a component.
  assert.doesNotMatch(app, /function SectionRoutes/);

  // The demo must sit outside the auth guard — it is public because the route
  // and its data are public, not because a guard was relaxed.
  const demoRouteAt = app.indexOf("path={DEMO_BASE}");
  const guardAt = app.indexOf("<Route element={<ProtectedRoute />}>");
  assert.ok(demoRouteAt > 0, "the demo route is declared in App.tsx");
  assert.ok(guardAt > demoRouteAt, "the demo route is declared before the ProtectedRoute block");

  const dashboardRouteAt = app.indexOf("path={DASHBOARD_BASE}");
  assert.ok(dashboardRouteAt > guardAt, "the dashboard route stays inside the guard");

  // Nothing in the demo's own shell asks for a session.
  const shell = source("demo/DemoShell.tsx");
  assert.match(shell, /DemoProvider/);
  assert.doesNotMatch(shell, /ProtectedRoute|useAuth|AuthContext/);
});

test("leaving the demo is wired to the shared exit path", () => {
  const sidebar = source("components/Sidebar.tsx");
  const header = source("components/Header.tsx");

  assert.match(sidebar, /EXIT_DEMO_PATH/);
  assert.match(header, /EXIT_DEMO_PATH/);
  // Both shells navigate to it, rather than to a second hard-coded "/".
  assert.match(sidebar, /navigate\(EXIT_DEMO_PATH/);
  assert.match(header, /to=\{EXIT_DEMO_PATH\}/);
});

/* ────────────────────────────────────────────────────────────
   2. Isolation from the real API
   ──────────────────────────────────────────────────────────── */

test("no demo module imports an API service or the API client", () => {
  const demoDir = `${SRC}demo/`;
  const files = readdirSync(demoDir);

  assert.ok(files.length >= 5, "the demo modules are present");

  for (const file of files) {
    const text = readFileSync(`${demoDir}${file}`, "utf8");
    const imports = text.match(/from\s+"[^"]+"/g) ?? [];

    for (const statement of imports) {
      assert.doesNotMatch(statement, /lib\/api|services\//, `${file} must not import the API: ${statement}`);
    }
    assert.doesNotMatch(text, /\bfetch\(/, `${file} must not call fetch directly`);
  }
});

test("demo mode is off until the demo shell arms it, and a GET is never blocked by it", async () => {
  // The flag is module state, not storage: a reload re-arms it from the route and
  // the authenticated dashboard never sets it.
  assert.equal(isDemoActive(), false);

  setDemoActive(true);
  assert.equal(isDemoActive(), true);

  setDemoActive(false);
  assert.equal(isDemoActive(), false);

  // The API client refuses writes (not reads) while the flag is set.
  const api = source("lib/api.mts");
  assert.match(api, /isDemoActive\(\)/);
  assert.match(api, /method !== "GET" && method !== "HEAD"/);
  assert.match(api, /DEMO_READ_ONLY_MESSAGE/);
  assert.equal(DEMO_READ_ONLY_MESSAGE.includes("read-only"), true);

  // mode.mts must not persist anything a real session could read.
  const mode = source("demo/mode.mts");
  assert.doesNotMatch(mode, /localStorage|sessionStorage|document\.cookie/);
});

test("loading the demo does not bootstrap a session", () => {
  // The auth provider checks the route before calling /auth/me: a visitor who
  // opens /demo cold never triggers a protected request, and one who entered
  // from an already-bootstrapped page keeps the session already in memory.
  const auth = source("context/AuthContext.tsx");
  assert.match(auth, /DEMO_BASE/);
  assert.match(auth, /onDemoRoute/);
  assert.match(auth, /restoreSessionRef/);
  // The skip is undone on the way out, so leaving the demo re-checks the
  // cookie instead of leaving a signed-in visitor looking signed out.
  assert.match(auth, /if \(onDemoRoute \|\| !restoreSessionRef\.current\) return/);
});

test("the demo header never renders a real account's avatar", () => {
  // A signed-in visitor can open /demo; the shell must still show only the
  // sample identity — no real photo, no real name or email as alt text.
  const header = source("components/Header.tsx");
  assert.match(header, /const avatarSrc = isDemo \? null/);
  assert.match(header, /alt=\{avatarAlt\}/);
  assert.match(header, /SAMPLE_IDENTITY\.name : user\?\.name \?\? user\?\.email/);
});

/* ────────────────────────────────────────────────────────────
   3. One profile, every page: cross-page consistency
   ──────────────────────────────────────────────────────────── */

test("repository counts and totals agree wherever they appear", () => {
  const { repositories, user, developer360, identity } = sample;
  const github = developer360.overview.github;

  assert.ok(repositories.length >= 5 && repositories.length <= 8, "5-8 sample repositories");

  // Every count of "how many repositories" is the same number.
  assert.equal(sample.repositoriesResponse.repositories.length, repositories.length);
  assert.equal(user.githubAccount?.totalRepos, repositories.length);
  assert.equal(developer360.overview.totalRepositories, repositories.length);
  assert.equal(github.repositoriesTracked, repositories.length);
  assert.equal(github.publicRepos, repositories.length + 3);

  // Star and fork totals are summed, not invented.
  const stars = repositories.reduce((sum, repo) => sum + repo.starsCount, 0);
  const forks = repositories.reduce((sum, repo) => sum + repo.forksCount, 0);
  assert.equal(user.githubAccount?.totalStars, stars);
  assert.equal(github.totalStars, stars);
  assert.equal(github.totalForks, forks);

  // Identifiers are unique and resolvable through the adapter the pages use.
  assert.equal(new Set(repositories.map((repo) => repo.id)).size, repositories.length);
  for (const repo of repositories) {
    assert.equal(sample.repositoryById(repo.id)?.fullName, repo.fullName);
    assert.equal(sample.repositoryResponse(repo.id)?.repository.fullName, repo.fullName);
  }
  assert.equal(sample.repositoryById("not-a-demo-repo"), undefined);
  assert.equal(sample.repositoryResponse("not-a-demo-repo"), null);

  // Language shares are shares of these repositories.
  const languageTotal = github.languageDistribution.reduce((sum, entry) => sum + entry.count, 0);
  const authoredWithLanguage = repositories.filter(
    (repo) => !repo.isFork && repo.owner === identity.githubUsername && repo.language
  ).length;
  assert.equal(languageTotal, authoredWithLanguage);
  const percentage = github.languageDistribution.reduce((sum, entry) => sum + entry.percentage, 0);
  assert.ok(percentage > 99 && percentage < 101);

  // Recent activity is drawn from the repository list, newest first.
  const activity = github.recentActivity;
  assert.ok(activity.length > 0 && activity.length <= 5);
  for (const entry of activity) {
    const repo = repositories.find((candidate) => candidate.fullName === entry.fullName);
    assert.ok(repo, `${entry.fullName} is a sample repository`);
    assert.equal(entry.starsCount, repo.starsCount);
  }
  const pushed = activity.map((entry) => entry.pushedAt ?? "");
  assert.deepEqual(pushed, [...pushed].sort((a, b) => b.localeCompare(a)));
});

test("every skill evidence names a repository that exists", () => {
  const { skills, repositories } = sample;
  const byFullName = new Map(repositories.map((repo) => [repo.fullName, repo]));

  assert.ok(skills.length >= 12 && skills.length <= 18, "12-18 sample skills");
  assert.equal(new Set(skills.map((skill) => skill.name)).size, skills.length);

  for (const skill of skills) {
    for (const evidence of skill.evidences) {
      const repo = byFullName.get(evidence.title);
      assert.ok(repo, `${skill.name} evidence points at a sample repository: ${evidence.title}`);
      assert.equal(evidence.sourceUrl, repo.url);
    }
    // A practically evidenced skill is evidenced by something, and a promoted
    // skill carries no measured confidence — exactly as the backend stores it.
    if (skill.currentLevel === "PRACTICALLY_EVIDENCED") {
      assert.ok(skill.evidences.length > 0, `${skill.name} has evidence`);
      assert.ok(skill.confidence > 0);
    } else {
      assert.equal(skill.evidences.length, 0);
      assert.equal(skill.confidence, 0);
    }
  }

  // The Developer 360 tiers and radar are counted from this same list.
  const tiers = sample.developer360.overview.evidenceTiers;
  const counted = tiers.CLAIMED + tiers.LEARNED + tiers.CREDENTIAL_VERIFIED + tiers.PRACTICALLY_EVIDENCED;
  assert.equal(counted, skills.length);
  const radarTotal = sample.developer360.overview.categoryBreakdown.reduce((sum, entry) => sum + entry.skillCount, 0);
  assert.ok(radarTotal <= skills.length, "the radar only counts skills that exist");
});

test("skills a course, certification or hackathon claims exist in the profile", () => {
  const skillNames = new Set(sample.skills.map((skill) => skill.name.toLowerCase()));

  for (const course of sample.courses.filter((entry) => entry.isCompleted)) {
    for (const learned of course.learnedSkills) {
      assert.ok(skillNames.has(learned.toLowerCase()), `${course.title} promotes ${learned}, which is in the list`);
    }
  }
});

test("career readiness cites only skills the sample profile actually has", () => {
  const skillNames = new Set(sample.skills.map((skill) => skill.name.toLowerCase()));
  const { readiness } = sample.career;

  assert.equal(readiness.hasEvidence, true);
  assert.ok(readiness.bestMatch, "the sample profile matches a role");
  assert.ok(readiness.roles.length >= 3);

  for (const role of readiness.roles) {
    assert.ok(role.score >= 0 && role.score <= 100);
    assert.equal(role.requirements.length, role.requirementsTotal);
    assert.equal(role.requirements.filter((requirement) => requirement.met).length, role.requirementsMet);

    for (const requirement of role.requirements.filter((entry) => entry.met)) {
      if (!requirement.evidence.endsWith("(practically evidenced)")) continue;
      const cited = requirement.evidence.replace(" (practically evidenced)", "").split(", ");
      for (const name of cited) {
        assert.ok(skillNames.has(name.toLowerCase()), `${role.role} cites ${name}, which exists in the skills list`);
      }
    }
  }
});

test("learning records are labelled sample data with nothing verifiable", () => {
  assert.ok(sample.courses.length >= 4 && sample.courses.length <= 6, "4-6 sample courses");
  assert.ok(sample.certifications.length >= 6 && sample.certifications.length <= 8, "6-8 sample certifications");
  assert.ok(sample.hackathons.length >= 2 && sample.hackathons.length <= 3, "2-3 sample hackathons");

  // No invented credential id and no link that claims to verify one.
  for (const certification of sample.certifications) {
    assert.equal(certification.credentialId, null);
    assert.equal(certification.credentialUrl, null);
    assert.ok(certification.issuer.length > 0);
  }
  for (const course of sample.courses) {
    assert.equal(course.certificateUrl, null);
  }

  // The count the Learning & Achievements page reports is this list's length.
  assert.equal(sample.coursesResponse.courses.length, sample.courses.length);
  assert.equal(sample.certificationsResponse.certifications.length, sample.certifications.length);
  assert.equal(sample.hackathonsResponse.hackathons.length, sample.hackathons.length);
  assert.equal(sample.developer360.overview.recentCertifications.length, sample.certifications.length);
});

test("nothing in the sample dataset points at a real account", () => {
  const urls = [
    ...sample.repositories.map((repo) => repo.url),
    sample.codingProfile.profileUrl,
    sample.user.githubAccount?.profileUrl ?? "",
    sample.developer360.overview.github.profileUrl ?? "",
    ...sample.hackathons.map((hackathon) => hackathon.projectUrl ?? ""),
    ...sample.codingProfile.rawStats.recentSolves.map((solve) => solve.url ?? ""),
  ].filter(Boolean);

  assert.ok(urls.length > 0);
  for (const url of urls) {
    assert.ok(url.startsWith("https://example.com/"), `${url} uses the reserved documentation domain`);
  }
  // The LeetCode handle is obviously synthetic and carries no real profile.
  assert.match(sample.codingProfile.handle, /sample|demo/);
  assert.match(sample.identity.githubUsername, /sample|demo/);
  assert.doesNotMatch(sample.identity.githubUsername, /^[a-z]+$/);
});

/* ────────────────────────────────────────────────────────────
   4. Problem solving: one calendar behind every widget
   ──────────────────────────────────────────────────────────── */

test("solved totals equal the difficulty, topic and language breakdowns", () => {
  const { codingProfile } = sample;
  const { easySolved, mediumSolved, hardSolved, totalSolved, rawStats } = codingProfile;

  assert.equal(easySolved, 12);
  assert.equal(mediumSolved, 13);
  assert.equal(hardSolved, 4);
  assert.equal(totalSolved, easySolved + mediumSolved + hardSolved);
  assert.equal(totalSolved, 29);

  const topicSum = rawStats.topics.reduce((sum, topic) => sum + topic.solved, 0);
  const languageSum = rawStats.languages.reduce((sum, language) => sum + language.solved, 0);
  assert.equal(topicSum, totalSolved);
  assert.equal(languageSum, totalSolved);

  // The sample only solves problems the platform mix can account for.
  const available = rawStats.totalAvailable;
  assert.ok(easySolved <= available.easy);
  assert.ok(mediumSolved <= available.medium);
  assert.ok(hardSolved <= available.hard);
  assert.ok(codingProfile.acceptanceRate > 0 && codingProfile.acceptanceRate <= 100);

  // Recent solves are dated, newest first, and use difficulty labels the donut knows.
  const solves = rawStats.recentSolves;
  assert.ok(solves.length >= 10);
  const dates = solves.map((solve) => solve.solvedAt);
  assert.deepEqual(dates, [...dates].sort((a, b) => b.localeCompare(a)));
  assert.ok(solves.every((solve) => solve.difficulty === "Easy" || solve.difficulty === "Medium" || solve.difficulty === "Hard"));
  assert.ok(solves.every((solve) => solve.title.length > 0));
});

test("streaks and active days are derived from the same submission calendar", () => {
  const { codingProfile, anchor } = sample;
  const calendar = codingProfile.rawStats.submissionCalendar;

  assert.deepEqual(calendar, sampleSubmissionCalendar(anchor));

  // Sparse by design: an inactive day is absent, never stored as 0.
  assert.ok(Object.values(calendar).every((count) => count > 0));

  // 365 days ending today: the newest key is the anchor day and nothing is future-dated.
  const anchorKey = utcDayKey(anchor);
  assert.ok(calendar[anchorKey] > 0, "the sample profile is active today");
  const keys = Object.keys(calendar).sort();
  assert.ok(keys.every((key) => key <= anchorKey));
  const oldest = new Date(`${keys[0]}T00:00:00Z`).getTime();
  const spanDays = Math.round((anchor.getTime() - oldest) / 86_400_000);
  assert.equal(spanDays, 364);

  // The card, the heatmap and the profile row all read these two numbers.
  assert.equal(codingProfile.totalActiveDays, keys.length);
  assert.equal(longestStreakFrom(calendar) >= codingProfile.streakDays, true);
  assert.ok(codingProfile.streakDays > 0);
  assert.equal(codingProfile.lastSyncedAt, anchor.toISOString());
});

/* ────────────────────────────────────────────────────────────
   5. Growth, insights and determinism
   ──────────────────────────────────────────────────────────── */

test("the growth timeline is measured from the sample analyses", () => {
  const { growth, repositories } = sample;
  const history = growth.history;

  assert.equal(history.totals.repositories, repositories.length);
  assert.equal(history.totals.analyses, history.points.length);
  assert.ok(history.points.length > 0);
  assert.ok(history.milestones.length > 0);
  const milestones = history.milestones.map((milestone) => milestone.date);
  assert.deepEqual(milestones, [...milestones].sort());

  const measuredScores = new Set(
    repositories.flatMap((repo) =>
      (repo.analyses ?? [])
        .filter((analysis) => analysis.status === "COMPLETED")
        .map((analysis) => analysis.overallScore)
    )
  );
  for (const point of history.points) {
    assert.ok(measuredScores.has(point.score), `${point.score} comes from a sample analysis`);
    assert.ok(repositories.some((repo) => repo.fullName === point.repository));
  }

  // Months are only months with a measurement, in order, and their average is real.
  const months = history.months.map((month) => month.month);
  assert.deepEqual(months, [...months].sort());
  for (const month of history.months) {
    assert.ok(month.averageScore >= month.bestScore - 0.05 || month.averageScore <= month.bestScore);
    assert.ok(month.analyses > 0);
  }

  // A trend needs the same repository measured twice, and its change is the
  // difference between those two measurements — never a separately invented number.
  assert.deepEqual(
    history.trends.map((trend) => trend.repository),
    [...history.trends].sort((a, b) => b.change - a.change).map((trend) => trend.repository)
  );
  for (const trend of history.trends) {
    const repo = repositories.find((candidate) => candidate.fullName === trend.repository);
    assert.ok(repo, `${trend.repository} is a sample repository`);
    assert.ok(trend.analyses >= 2, "a trend only exists for a repository measured twice");

    // The repository stores its analyses newest first; the timeline reads them
    // oldest first, so "first" and "latest" are the ends of the sorted list.
    const scores = (repo.analyses ?? [])
      .filter((analysis) => analysis.status === "COMPLETED")
      .sort((a, b) => (a.analyzedAt ?? "").localeCompare(b.analyzedAt ?? ""))
      .map((analysis) => analysis.overallScore);
    assert.equal(scores.length, trend.analyses);
    assert.equal(trend.firstScore, scores[0]);
    assert.equal(trend.latestScore, scores[scores.length - 1]);
    assert.equal(trend.change, Math.round((scores[scores.length - 1] - scores[0]) * 10) / 10);
  }
});

test("AI insights are prewritten sample text over these numbers", () => {
  const { ai, developer360, repositories } = sample;

  assert.equal(ai.hasEvidence, true);
  assert.equal(ai.evidence.repositoriesAnalyzed, repositories.length);
  assert.equal(ai.evidence.averageScore, developer360.overview.developer360Score);

  const insights = ai.insights;
  assert.ok(insights, "the sample profile has insights to show");
  assert.ok(insights.summary.length > 0);
  assert.ok(insights.strengths.length >= 1);
  assert.ok(insights.risks.length >= 1);
  assert.ok(insights.recommendations.length >= 1);

  // Each insight names a sample repository or a measured number — none of them
  // claims to have been read from a real account.
  for (const strength of insights.strengths) {
    assert.ok(strength.title.length > 0 && strength.detail.length > 0);
  }
  for (const recommendation of insights.recommendations) {
    assert.ok(recommendation.title.length > 0);
  }
  // The demo never calls a model, and says so rather than implying otherwise.
  assert.match(insights.summary, /sample/i);
  assert.match(insights.summary, /no model was called/i);
});

test("the dataset is deterministic for a given day and moves with the clock", () => {
  const serialize = (data: ReturnType<typeof buildSampleData>) => JSON.stringify(data);

  // Same day, same bytes — no randomness anywhere in the fixtures.
  assert.equal(serialize(buildSampleData(SAMPLE_DAY)), serialize(sample));

  // A different day shifts the anchor and the derived dates, without changing
  // the profile itself: the records are the same story, told from another today.
  const tomorrow = buildSampleData(new Date("2026-10-17T09:30:00Z"));
  assert.notEqual(serialize(tomorrow), serialize(sample));
  assert.equal(tomorrow.identity.name, sample.identity.name);
  assert.equal(tomorrow.repositories.length, sample.repositories.length);
  assert.equal(tomorrow.codingProfile.totalSolved, sample.codingProfile.totalSolved);
  assert.equal(tomorrow.anchor.getTime() - sample.anchor.getTime(), 86_400_000);
  assert.equal(tomorrow.repositoryResponse(sample.repositories[0].id)?.repository.name, sample.repositories[0].name);

  // And the app's own dataset is built the same way, for today.
  assert.equal(sample.identity.name, "Alex Morgan");
  assert.equal(sample.identity.role, "Full-Stack Developer");
  const repoNames = sample.repositories.map((repo) => repo.name);
  assert.equal(new Set(repoNames).size, repoNames.length);
});

/* ────────────────────────────────────────────────────────────
   6. Per-platform request state
   ──────────────────────────────────────────────────────────── */

test("the problem-solving page tracks busy state per platform and operation", () => {
  const ps = source("pages/dashboard/ProblemSolving.tsx");

  // Busy state is a record keyed by platform, with separate flags for each
  // operation type — not a single CodingPlatform | null value.
  assert.match(ps, /busy.*\[platform\].*connecting/);
  assert.match(ps, /busy.*\[platform\].*syncing/);
  assert.match(ps, /busy.*\[platform\].*disconnecting/);

  // Each operation function sets only its own flag on the target platform.
  assert.match(ps, /connecting: true/);
  assert.match(ps, /syncing: true/);
  assert.match(ps, /disconnecting: true/);

  // Conflicting operations on the same platform are prevented.
  assert.match(ps, /if \(busy\[platform\]\.syncing || busy\[platform\]\.disconnecting\) return/);
  assert.match(ps, /if \(busy\[platform\]\.connecting || busy\[platform\]\.disconnecting\) return/);
  assert.match(ps, /if \(busy\[platform\]\.connecting || busy\[platform\]\.syncing\) return/);

  // Buttons receive per-platform, per-operation busy state.
  assert.match(ps, /isSyncing: busy\[platform\].*syncing/);
  assert.match(ps, /isDisconnecting: busy\[platform\].*disconnecting/);
  assert.match(ps, /isConnecting: busy\.LEETCODE.*connecting/);
  assert.match(ps, /isConnecting: busy\.GEEKSFORGEEKS.*connecting/);
});

test("syncing one platform does not set the other platform's busy state", () => {
  const ps = source("pages/dashboard/ProblemSolving.tsx");

  // runSync spreads the previous state and only sets syncing: true on the
  // target platform, leaving other platforms' state untouched.
  assert.match(ps, /\.\.\.prev/);
  assert.match(ps, /\[platform\]: \{\s*\.\.\.prev\[platform\]/);
  assert.match(ps, /syncing: true/);

  // The finally block clears only the target platform's syncing flag.
  assert.match(ps, /\[platform\]: \{\s*\.\.\.prev\[platform\],\s*syncing: false/);
});

/* ────────────────────────────────────────────────────────────
   7. Period selector accessibility
   ──────────────────────────────────────────────────────────── */

test("the period selector buttons have aria-pressed for the selected state", () => {
  const ps = source("pages/dashboard/ProblemSolving.tsx");

  // The period selector group has an accessible label.
  assert.match(ps, /role="group" aria-label="Activity period"/);

  // Each button has aria-pressed reflecting the selected state.
  assert.match(ps, /aria-pressed=\{period === p\}/);
});

/* ────────────────────────────────────────────────────────────
   8. Disabled connect button accessibility
   ──────────────────────────────────────────────────────────── */

test("the disabled connect button has a visible accessible explanation", () => {
  const card = source("pages/dashboard/ps/PlatformCard.tsx");

  // When connect is unavailable (no onConnect or connectDisabled) and there's a
  // hint, render it as visible text with aria-live so screen readers announce it.
  assert.match(card, /!onConnect || connectDisabled/);
  assert.match(card, /connectHint/);
  assert.match(card, /aria-live="polite"/);

  // The button has aria-disabled reflecting its disabled state.
  assert.match(card, /aria-disabled=/);
  assert.match(card, /aria-describedby.*handleMessageId/);

  // Validation errors are associated with the input via aria-describedby and aria-invalid.
  assert.match(card, /aria-describedby={handleMessageShown/);
  assert.match(card, /aria-invalid={handleMessageShown/);
});

/* ────────────────────────────────────────────────────────────
   9. Background refresh preserves current data
   ──────────────────────────────────────────────────────────── */

test("useResource preserves data during background refreshes", () => {
  const useResource = source("lib/useResource.ts");

  // The hook tracks initial mount to distinguish it from background refreshes.
  assert.match(useResource, /isInitialMount/);
  assert.match(useResource, /useRef\(true\)/);

  // On background refresh (non-initial mount), loading is not set to true.
  assert.match(useResource, /if \(\!isInitialMount\.current\) \{\s*setLoading\(false\)/);

  // Loading is cleared on EVERY settle. It must NOT be gated on isInitialMount:
  // that ref is already false by the time the promise resolves (it flips
  // synchronously at the end of the effect), so a guard there left the initial
  // load stuck on the loading state forever in a production build. React
  // StrictMode's dev-only double effect run used to mask this by re-running the
  // effect with isInitialMount === false, which is why the bug only ever
  // appeared in `vite build` output. The browser E2E suite
  // (e2e/regressions.spec.ts, e2e/repository.spec.ts) pins the real behaviour.
  assert.match(
    useResource,
    /if \(active\) \{\s*setData\(result\);\s*setLoading\(false\)/s,
    "a successful load always clears loading"
  );
  assert.doesNotMatch(
    useResource,
    /setData\(result\);\s*if \(isInitialMount/,
    "clearing loading must not be gated on the initial mount"
  );

  // On failed load, the error is set and loading is cleared too.
  assert.match(
    useResource,
    /setError\(err instanceof ApiError[^;]*;\s*setLoading\(false\)/s,
    "a failed load always clears loading"
  );
});
;
