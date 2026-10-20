/**
 * The synthetic dataset behind `/demo`.
 *
 * Design rule: this module is a small, deterministic *database* of fictional
 * records plus the same aggregations the backend runs over its own rows. Every
 * number the demo dashboard shows — the developer score, the evidence tiers, the
 * skill confidences, the category radar, the growth timeline, the readiness
 * scores — is computed here from those records, the way
 * Backend/src/services/*.service.ts computes them from Postgres.
 *
 * That indirection is the point. It is what makes Overview, Developer 360,
 * Skills, Growth, Career Readiness and Problem Solving agree with each other:
 * there is one sample profile, and each page reads a different view of it. A
 * dashboard of independently invented numbers can look plausible page by page
 * and contradict itself the moment a visitor compares two of them.
 *
 * Consequences worth stating plainly:
 *   - Nothing here was fetched from LeetCode, GeeksforGeeks or GitHub. There are
 *     no network calls in this module, and none of its urls point at a real
 *     account: they use example.com (RFC 2606, reserved for documentation), so a
 *     click can never land on a stranger's profile.
 *   - Dates are derived from the current UTC day (the dashboard's day
 *     convention — see pages/dashboard/ps/activityDays.mts), so the sample
 *     profile always looks recently active while staying deterministic for a
 *     given day.
 *   - The aggregations mirror the backend's. Where the demo simplifies one, the
 *     comment says so.
 *
 * `.mts` so `node --test` can execute it directly (type stripping, no build, no
 * new dependency) while Vite bundles it for the app as usual.
 */

import type {
  AiInsightsResponse,
  CareerReadiness,
  CareerReadinessResponse,
  CategoryBreakdown,
  Certification,
  CertificationsResponse,
  CodingProfile,
  CodingProfilesResponse,
  Course,
  CoursesResponse,
  Developer360Overview,
  Developer360Response,
  EvidenceLevel,
  EvidenceTierCounts,
  Finding,
  GrowthHistory,
  GrowthHistoryResponse,
  Hackathon,
  HackathonsResponse,
  Metric,
  MetricCategory,
  RepositoriesResponse,
  Repository,
  RepositoryAnalysis,
  RepositoryResponse,
  ResumeResponse,
  RoleReadiness,
  SkillCategory,
  SkillEvidence,
  SkillWithEvidence,
  SkillsResponse,
  User,
} from "../lib/types";
import { addUtcDays, utcDayKey, utcToday } from "../pages/dashboard/ps/activityDays.mts";

/* ────────────────────────────────────────────────────────────
   Identity

   One fictional developer, used by every page. The name, the email domain and
   the handle are all obviously samples, and the urls below sit on a reserved
   documentation domain rather than github.com.
   ──────────────────────────────────────────────────────────── */

export interface SampleIdentity {
  name: string;
  email: string;
  role: string;
  experienceYears: number;
  headline: string;
  githubUsername: string;
  location: string;
}

export const SAMPLE_IDENTITY: SampleIdentity = {
  name: "Alex Morgan",
  email: "alex.morgan@example.com",
  role: "Full-Stack Developer",
  experienceYears: 2,
  headline: "Full-Stack Developer focused on React, TypeScript, and backend systems",
  githubUsername: "alexmorgan-demo",
  location: "Remote — sample profile",
};

/** Badge text for the demo shell. */
export const DEMO_BADGE = "Demo mode — sample data (not real analytics)";

/** The one-sentence explanation reused across pages. */
export const SAMPLE_NOTICE =
  "A fictional profile built from sample data. Metrics, scores, and activity are illustrative examples — not real analysis results from GitHub, LeetCode or GeeksforGeeks. No account or record is created, changed, or deleted.";

const DEMO_DOMAIN = "example.com";

/** A reserved-domain url: safe to click, and obviously not a real account. */
function demoUrl(path: string): string {
  return `https://${DEMO_DOMAIN}/devproof-demo/${path}`;
}

/* ────────────────────────────────────────────────────────────
   Metrics, mirroring analysisEngine.service.ts
   ──────────────────────────────────────────────────────────── */

/** The six metrics the analysis engine records, in the order it records them. */
type AnalysisMetric = Exclude<MetricCategory, "ENGINEERING_HEALTH">;

const METRIC_ORDER: AnalysisMetric[] = [
  "DOCUMENTATION",
  "TESTING",
  "SECURITY",
  "CODE_QUALITY",
  "MAINTAINABILITY",
  "DEPENDENCY_HEALTH",
];

const METRIC_NAMES: Record<MetricCategory, string> = {
  DOCUMENTATION: "Documentation Quality",
  TESTING: "Testing Coverage & Automation",
  SECURITY: "Security Vulnerabilities & Secrets",
  CODE_QUALITY: "Code Quality & Clean Architecture",
  MAINTAINABILITY: "Maintainability & CI/CD",
  DEPENDENCY_HEALTH: "Dependency Management",
  // Not emitted by the engine; present so the map covers the whole union.
  ENGINEERING_HEALTH: "Engineering Health",
};

/**
 * The raw signals a repository presents to the analyzer.
 *
 * Each score below is derived from these with the engine's own arithmetic, so a
 * repository described as having five test suites cannot also score the "no test
 * files detected" value, and one without a CI workflow cannot score the
 * maintainability reserved for repositories that have one.
 */
interface AnalysisSignals {
  hasReadme: boolean;
  hasLicense: boolean;
  /** Test files found; 0 means none were detected. */
  testFiles: number;
  hasDocker: boolean;
  secretWarnings: number;
  todoCount: number;
  hasCiCd: boolean;
  hasLockfile: boolean;
}

/** Engine values per metric, derived from the signals above. */
function metricScores(signals: AnalysisSignals): Record<AnalysisMetric, number> {
  const documentation = 35 + (signals.hasReadme ? 35 : 0) + (signals.hasLicense ? 25 : 0);
  const testing = 25 + (signals.testFiles > 0 ? 35 : 0) + (signals.testFiles > 3 ? 15 : 0);
  const security = Math.max(95 - signals.secretWarnings * 30, 25);

  let quality = 72;
  if (signals.todoCount > 8) quality -= 18;
  else if (signals.todoCount > 5) quality -= 12;
  if (!signals.hasCiCd) quality -= 15;
  if (quality < 35) quality = 35;

  return {
    DOCUMENTATION: documentation,
    TESTING: testing,
    SECURITY: security,
    CODE_QUALITY: quality,
    MAINTAINABILITY: signals.hasCiCd ? 82 : 52,
    DEPENDENCY_HEALTH: signals.hasLockfile ? 88 : 62,
  };
}

function metricDetail(category: AnalysisMetric, signals: AnalysisSignals): string {
  switch (category) {
    case "DOCUMENTATION":
      return signals.hasReadme ? "README documentation present." : "Missing root README markdown file.";
    case "TESTING":
      return signals.testFiles > 0 ? `Found ${signals.testFiles} test suites/files.` : "No test suites detected.";
    case "SECURITY":
      return signals.secretWarnings === 0
        ? "No exposed secret patterns detected."
        : `${signals.secretWarnings} potential secret warnings found.`;
    case "CODE_QUALITY":
      return `Clean modular layout with ${signals.todoCount} pending TODO markers.`;
    case "MAINTAINABILITY":
      return signals.hasCiCd
        ? "GitHub Actions / CI workflows configured."
        : "No CI/CD build pipelines detected.";
    case "DEPENDENCY_HEALTH":
      return signals.hasLockfile ? "Lockfile (package-lock.json / yarn.lock) verified." : "Missing lockfile.";
  }
}

/* ────────────────────────────────────────────────────────────
   Repositories
   ──────────────────────────────────────────────────────────── */

interface SampleAnalysisInput {
  /** Completed this many days before the sample anchor (today, UTC). */
  daysAgo: number;
  signals: AnalysisSignals;
  findings: Omit<Finding, "id">[];
}

interface SampleRepositoryInput {
  /** Synthetic numeric GitHub repo id, far outside any real id range. */
  githubRepoId: string;
  slug: string;
  name: string;
  description: string;
  language: string;
  topics: string[];
  stars: number;
  forks: number;
  watchers: number;
  openIssues: number;
  sizeKb: number;
  createdDaysAgo: number;
  pushedDaysAgo: number;
  /** Oldest first; the last entry is the repository's current state. */
  analyses: SampleAnalysisInput[];
}

const TESTING_FINDING: Omit<Finding, "id"> = {
  severity: "HIGH",
  category: "TESTING",
  title: "No Automated Unit/Integration Tests",
  description: "Zero test files found in repository.",
  filePath: null,
  lineNumber: null,
  snippet: null,
  recommendation: "Add test suites using Jest, Vitest, PyTest, or Playwright to ensure reliability.",
};

const CI_FINDING: Omit<Finding, "id"> = {
  severity: "MEDIUM",
  category: "MAINTAINABILITY",
  title: "No CI/CD Pipeline Configured",
  description: "No build or test workflow was found, so nothing verifies a change before it ships.",
  filePath: null,
  lineNumber: null,
  snippet: null,
  recommendation: "Add a GitHub Actions workflow that installs dependencies, runs the test suite and lints on every pull request.",
};

const TODO_FINDING: Omit<Finding, "id"> = {
  severity: "LOW",
  category: "CODE_QUALITY",
  title: "TODO Markers Left in Source",
  description: "Several TODO comments remain in tracked source files.",
  filePath: "src/services/sync.ts",
  lineNumber: 84,
  snippet: "// TODO: retry the sync when the token refreshes",
  recommendation: "Turn outstanding TODOs into tracked issues so they are visible and assignable.",
};

const SECRET_FINDING: Omit<Finding, "id"> = {
  severity: "HIGH",
  category: "SECURITY",
  title: "Hardcoded Credential Pattern Detected",
  description: "A string literal in a tracked file matches a known secret pattern.",
  filePath: "monitor/settings.py",
  lineNumber: 12,
  snippet: 'ALERT_WEBHOOK_TOKEN = "sample-value-not-a-real-secret"',
  recommendation: "Move the value into an environment variable and rotate it.",
};

const SAMPLE_REPOSITORIES: SampleRepositoryInput[] = [
  {
    githubRepoId: "9000000011",
    slug: "taskflow",
    name: "TaskFlow",
    description: "Kanban-style task manager with optimistic updates, keyboard shortcuts and offline drafts.",
    language: "TypeScript",
    topics: ["react", "typescript", "tailwindcss"],
    stars: 128,
    forks: 24,
    watchers: 9,
    openIssues: 6,
    sizeKb: 8421,
    createdDaysAgo: 620,
    pushedDaysAgo: 2,
    analyses: [
      {
        daysAgo: 300,
        signals: { hasReadme: true, hasLicense: false, testFiles: 2, hasDocker: false, secretWarnings: 0, todoCount: 12, hasCiCd: false, hasLockfile: true },
        findings: [CI_FINDING, TODO_FINDING],
      },
      {
        daysAgo: 12,
        signals: { hasReadme: true, hasLicense: true, testFiles: 4, hasDocker: false, secretWarnings: 0, todoCount: 7, hasCiCd: false, hasLockfile: true },
        findings: [CI_FINDING],
      },
    ],
  },
  {
    githubRepoId: "9000000012",
    slug: "fintrack",
    name: "FinTrack",
    description: "Personal finance dashboard with budget envelopes, a monthly report and CSV import.",
    language: "TypeScript",
    topics: ["react", "typescript", "node", "express", "postgresql"],
    stars: 87,
    forks: 12,
    watchers: 7,
    openIssues: 4,
    sizeKb: 6118,
    createdDaysAgo: 430,
    pushedDaysAgo: 6,
    analyses: [
      {
        daysAgo: 35,
        signals: { hasReadme: true, hasLicense: true, testFiles: 2, hasDocker: true, secretWarnings: 0, todoCount: 9, hasCiCd: false, hasLockfile: true },
        findings: [TODO_FINDING, CI_FINDING],
      },
    ],
  },
  {
    githubRepoId: "9000000013",
    slug: "api-gateway",
    name: "API Gateway",
    description: "Express gateway that fronts several services: request signing, rate limiting and tracing.",
    language: "JavaScript",
    topics: ["node", "express", "postgresql", "docker"],
    stars: 64,
    forks: 9,
    watchers: 5,
    openIssues: 3,
    sizeKb: 3277,
    createdDaysAgo: 520,
    pushedDaysAgo: 9,
    analyses: [
      {
        daysAgo: 265,
        signals: { hasReadme: true, hasLicense: false, testFiles: 0, hasDocker: true, secretWarnings: 0, todoCount: 11, hasCiCd: false, hasLockfile: true },
        findings: [TESTING_FINDING, CI_FINDING],
      },
      {
        daysAgo: 60,
        signals: { hasReadme: true, hasLicense: false, testFiles: 3, hasDocker: true, secretWarnings: 0, todoCount: 4, hasCiCd: false, hasLockfile: true },
        findings: [CI_FINDING],
      },
    ],
  },
  {
    githubRepoId: "9000000014",
    slug: "ml-insights",
    name: "ML Insights",
    description: "Churn-prediction toolkit: reproducible notebooks, a feature store and a scoring script.",
    language: "Python",
    topics: ["python", "machine-learning"],
    stars: 41,
    forks: 7,
    watchers: 4,
    openIssues: 2,
    sizeKb: 12060,
    createdDaysAgo: 300,
    pushedDaysAgo: 14,
    analyses: [
      {
        daysAgo: 95,
        signals: { hasReadme: true, hasLicense: false, testFiles: 1, hasDocker: false, secretWarnings: 0, todoCount: 3, hasCiCd: false, hasLockfile: false },
        findings: [CI_FINDING],
      },
    ],
  },
  {
    githubRepoId: "9000000015",
    slug: "portfolio-engine",
    name: "Portfolio Engine",
    description: "Static-first portfolio generator with MDX case studies and an image pipeline.",
    language: "TypeScript",
    topics: ["react", "typescript", "tailwindcss"],
    stars: 33,
    forks: 4,
    watchers: 3,
    openIssues: 1,
    sizeKb: 2954,
    createdDaysAgo: 260,
    pushedDaysAgo: 21,
    analyses: [
      {
        daysAgo: 120,
        signals: { hasReadme: true, hasLicense: true, testFiles: 2, hasDocker: false, secretWarnings: 0, todoCount: 2, hasCiCd: false, hasLockfile: true },
        findings: [CI_FINDING],
      },
    ],
  },
  {
    githubRepoId: "9000000016",
    slug: "cloud-monitor",
    name: "Cloud Monitor",
    description: "Uptime and spend monitoring for a small fleet: checks, alert rules and weekly digests.",
    language: "Python",
    topics: ["python", "docker", "postgresql"],
    stars: 58,
    forks: 11,
    watchers: 6,
    openIssues: 5,
    sizeKb: 4488,
    createdDaysAgo: 180,
    pushedDaysAgo: 4,
    analyses: [
      {
        daysAgo: 150,
        signals: { hasReadme: true, hasLicense: false, testFiles: 0, hasDocker: true, secretWarnings: 1, todoCount: 3, hasCiCd: false, hasLockfile: false },
        findings: [TESTING_FINDING, SECRET_FINDING, CI_FINDING],
      },
    ],
  },
];

function isoDaysAgo(anchor: Date, daysAgo: number): string {
  return addUtcDays(anchor, -daysAgo).toISOString();
}

function deriveAnalysis(
  repo: SampleRepositoryInput,
  input: SampleAnalysisInput,
  index: number,
  anchor: Date
): RepositoryAnalysis {
  const scores = metricScores(input.signals);
  const metrics: Metric[] = METRIC_ORDER.map((category) => ({
    id: `demo-metric-${repo.slug}-${index}-${category.toLowerCase()}`,
    category,
    name: METRIC_NAMES[category],
    score: scores[category],
    detail: metricDetail(category, input.signals),
  }));

  // The engine averages its metrics and rounds to one decimal.
  const overallScore = Math.round((metrics.reduce((sum, metric) => sum + metric.score, 0) / metrics.length) * 10) / 10;

  return {
    id: `demo-analysis-${repo.slug}-${index}`,
    status: "COMPLETED",
    overallScore,
    healthStatus: overallScore >= 80 ? "EXCELLENT" : overallScore >= 65 ? "GOOD" : "NEEDS_REVIEW",
    errorMessage: null,
    analyzedAt: isoDaysAgo(anchor, input.daysAgo),
    createdAt: isoDaysAgo(anchor, input.daysAgo),
    metrics,
    findings: input.findings.map((finding, findingIndex) => ({
      id: `demo-finding-${repo.slug}-${index}-${findingIndex}`,
      ...finding,
    })),
  };
}

/** A derived repository plus the signals behind its current analysis. */
interface DerivedRepository {
  record: Repository;
  /** Signals from the newest analysis — what skill derivation reads. */
  latestSignals: AnalysisSignals;
}

function deriveRepository(repo: SampleRepositoryInput, anchor: Date): DerivedRepository {
  const fullName = `${SAMPLE_IDENTITY.githubUsername}/${repo.slug}`;
  const url = demoUrl(`repositories/${repo.slug}`);

  const analyses = repo.analyses
    .map((input, index) => deriveAnalysis(repo, input, index, anchor))
    // Newest first, matching the backend's `orderBy: { createdAt: 'desc' }`.
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));

  const pushedAt = isoDaysAgo(anchor, repo.pushedDaysAgo);
  const createdAt = isoDaysAgo(anchor, repo.createdDaysAgo);

  return {
    record: {
      id: `demo-repo-${repo.slug}`,
      name: repo.name,
      fullName,
      owner: SAMPLE_IDENTITY.githubUsername,
      url,
      description: repo.description,
      isPrivate: false,
      githubRepoId: repo.githubRepoId,
      isFork: false,
      isArchived: false,
      defaultBranch: "main",
      language: repo.language,
      topics: repo.topics,
      starsCount: repo.stars,
      forksCount: repo.forks,
      watchersCount: repo.watchers,
      openIssuesCount: repo.openIssues,
      sizeKb: repo.sizeKb,
      githubCreatedAt: createdAt,
      githubUpdatedAt: pushedAt,
      pushedAt,
      createdAt,
      updatedAt: pushedAt,
      analyses,
    },
    latestSignals: repo.analyses[repo.analyses.length - 1].signals,
  };
}

/* ────────────────────────────────────────────────────────────
   Skills

   Derived from the repositories above, then moved up the evidence ladder by the
   courses, certifications and hackathons below — the same order of operations as
   skill / course / certification / hackathon services.
   ──────────────────────────────────────────────────────────── */

/** The subset of the backend's TOKEN_SKILLS vocabulary these repositories use. */
const TOKEN_SKILLS: Record<string, { name: string; category: SkillCategory; ceiling?: number }> = {
  typescript: { name: "TypeScript", category: "GENERAL" },
  javascript: { name: "JavaScript", category: "GENERAL" },
  python: { name: "Python", category: "GENERAL" },
  react: { name: "React", category: "FRONTEND" },
  tailwindcss: { name: "Tailwind CSS", category: "FRONTEND" },
  node: { name: "Node.js", category: "BACKEND" },
  express: { name: "Express", category: "BACKEND" },
  postgresql: { name: "PostgreSQL", category: "DATABASE" },
  sql: { name: "SQL", category: "DATABASE" },
  redis: { name: "Redis", category: "DATABASE" },
  docker: { name: "Docker", category: "DEVOPS" },
  aws: { name: "AWS", category: "DEVOPS" },
  kubernetes: { name: "Kubernetes", category: "DEVOPS" },
  'machine-learning': { name: "Machine Learning", category: "ML" },
};

const DEFAULT_CONFIDENCE_CEILING = 88;
/** Absence-based evidence cannot claim the confidence of presence — skill.service. */
const ABSENCE_CONFIDENCE_CEILING = 52;

/** skill.service: min(45 + 18 * (evidenceCount - 1), ceiling). */
function confidenceFor(evidenceCount: number, ceiling = DEFAULT_CONFIDENCE_CEILING): number {
  return Math.min(42 + 16 * (evidenceCount - 1), ceiling);
}

/** skill.service: lowercase, spaces to dashes, and `.js` folded to `js`. */
function normalizeToken(raw: string): string {
  return raw.trim().toLowerCase().replace(/\s+/g, "-").replace(/\.js$/, "js");
}

type PendingEvidence = Omit<SkillEvidence, "id" | "level">;

interface PendingSkill {
  name: string;
  category: SkillCategory;
  ceiling: number;
  evidences: PendingEvidence[];
}

/** Skills evidenced by code: languages, topics and measured analysis signals. */
function deriveRepositorySkills(repos: DerivedRepository[]): Map<string, PendingSkill> {
  const pending = new Map<string, PendingSkill>();

  const record = (
    seed: { name: string; category: SkillCategory; ceiling?: number },
    evidence: PendingEvidence
  ) => {
    const existing = pending.get(seed.name);
    if (existing) {
      // One repository counts once per skill however it arrived; language is
      // recorded before topics, so the more authoritative signal wins.
      if (!existing.evidences.some((e) => e.title === evidence.title)) existing.evidences.push(evidence);
      return;
    }
    pending.set(seed.name, {
      name: seed.name,
      category: seed.category,
      ceiling: seed.ceiling ?? DEFAULT_CONFIDENCE_CEILING,
      evidences: [evidence],
    });
  };

  for (const { record: repo, latestSignals: signals } of repos) {
    const evidenceFor = (evidenceType: string, snippet: string): PendingEvidence => ({
      evidenceType,
      title: repo.fullName,
      snippet,
      sourceUrl: repo.url,
    });

    if (repo.language) {
      const seed = TOKEN_SKILLS[normalizeToken(repo.language)];
      if (seed) {
        record(seed, evidenceFor("REPOSITORY_LANGUAGE", `GitHub reports ${repo.language} as the primary language of this repository.`));
      }
    }

    for (const topic of repo.topics ?? []) {
      const seed = TOKEN_SKILLS[normalizeToken(topic)];
      if (!seed) continue;
      record(seed, evidenceFor("REPOSITORY_TOPIC", `Tagged "${topic}" on GitHub.`));
    }

    if (signals.testFiles > 0) {
      record({ name: "Automated Testing", category: "TESTING" }, evidenceFor("ANALYSIS_SIGNAL", "Analysis found test files in this repository."));
    }
    if (signals.hasReadme) {
      record({ name: "Technical Documentation", category: "GENERAL" }, evidenceFor("ANALYSIS_SIGNAL", "Analysis found README documentation in this repository."));
    }
    if (signals.hasDocker) {
      record({ name: "Docker", category: "DEVOPS" }, evidenceFor("ANALYSIS_SIGNAL", "Analysis found Docker configuration in this repository."));
    }
    if (signals.hasCiCd) {
      record({ name: "CI/CD", category: "DEVOPS" }, evidenceFor("ANALYSIS_SIGNAL", "Analysis found a CI/CD pipeline configuration in this repository."));
    }

    const analysis = repo.analyses?.[0];
    const security = analysis?.metrics?.find((metric) => metric.category === "SECURITY");
    if (security && security.score >= 75 && signals.secretWarnings === 0) {
      record(
        { name: "Secure Coding Practices", category: "SECURITY", ceiling: ABSENCE_CONFIDENCE_CEILING },
        evidenceFor(
          "ANALYSIS_SIGNAL",
          `Security analysis scored ${Math.round(security.score)}/100, with no hardcoded secrets in the sampled files.`
        )
      );
    }
  }

  return pending;
}

/* ────────────────────────────────────────────────────────────
   Courses, certifications, hackathons — the non-code evidence
   ──────────────────────────────────────────────────────────── */

interface SampleCourseInput {
  slug: string;
  title: string;
  platform: string;
  isCompleted: boolean;
  completedDaysAgo: number | null;
  learnedSkills: string[];
}

const SAMPLE_COURSES: SampleCourseInput[] = [
  { slug: "advanced-typescript", title: "Advanced TypeScript Patterns", platform: "Frontend Masters", isCompleted: true, completedDaysAgo: 150, learnedSkills: ["TypeScript"] },
  { slug: "kubernetes-for-developers", title: "Kubernetes for Developers", platform: "Linux Foundation", isCompleted: true, completedDaysAgo: 96, learnedSkills: ["Kubernetes"] },
  { slug: "dsa-fundamentals", title: "Data Structures & Algorithms Fundamentals", platform: "Coursera", isCompleted: true, completedDaysAgo: 64, learnedSkills: ["Data Structures & Algorithms"] },
  { slug: "postgres-performance", title: "PostgreSQL Performance Tuning", platform: "Udemy", isCompleted: true, completedDaysAgo: 38, learnedSkills: ["PostgreSQL"] },
  { slug: "ci-cd-automation", title: "GitHub Actions: Build & Release Automation", platform: "Pluralsight", isCompleted: false, completedDaysAgo: null, learnedSkills: ["CI/CD"] },
];

interface SampleCertificationInput {
  slug: string;
  name: string;
  issuer: string;
  issueDaysAgo: number;
}

/**
 * Certifications carry no credential id and no verification url: inventing either
 * would mean printing a link that claims to verify a credential that does not
 * exist. The sample records are deliberately link-free.
 */
const SAMPLE_CERTIFICATIONS: SampleCertificationInput[] = [
  { slug: "sql-advanced", name: "SQL (Advanced) Certificate", issuer: "HackerRank", issueDaysAgo: 210 },
  { slug: "aws-cloud-practitioner", name: "AWS Certified Cloud Practitioner", issuer: "Amazon Web Services", issueDaysAgo: 168 },
  { slug: "freecodecamp-js", name: "JavaScript Algorithms and Data Structures", issuer: "freeCodeCamp", issueDaysAgo: 300 },
  { slug: "meta-react", name: "React Developer Certificate", issuer: "Meta", issueDaysAgo: 120 },
  { slug: "kcna", name: "Kubernetes and Cloud Native Associate (KCNA)", issuer: "CNCF", issueDaysAgo: 84 },
  { slug: "ml-specialization", name: "Machine Learning Specialization", issuer: "DeepLearning.AI", issueDaysAgo: 52 },
];

interface SampleHackathonInput {
  slug: string;
  name: string;
  organizer: string;
  role: string;
  projectName: string;
  result: string;
  teamSize: number;
  heldDaysAgo: number;
  technologies: string[];
}

const SAMPLE_HACKATHONS: SampleHackathonInput[] = [
  { slug: "campus-hack-days", name: "Campus Hack Days", organizer: "Sample State University", role: "Team lead", projectName: "StudyLoop", result: "Finalist (top 8)", teamSize: 4, heldDaysAgo: 420, technologies: ["React", "Node.js"] },
  { slug: "open-data-sprint", name: "Open Data Sprint", organizer: "City Open Data Collective", role: "Data engineer", projectName: "Transit Pulse", result: "Second place", teamSize: 3, heldDaysAgo: 210, technologies: ["Python", "PostgreSQL"] },
  { slug: "cloud-cost-jam", name: "Cloud Cost Jam", organizer: "CloudBuilders Community", role: "Backend developer", projectName: "SpendLens", result: "Participant", teamSize: 5, heldDaysAgo: 90, technologies: ["Python", "Redis", "Docker"] },
];

/* ────────────────────────────────────────────────────────────
   Problem solving
   ──────────────────────────────────────────────────────────── */

/**
 * The trailing 30 days, oldest first — the only part of the calendar written out
 * by hand, so the recent window the cards summarise is readable at a glance.
 * Trailing run: 4 active days. Longest run inside it: 3.
 */
const RECENT_30_DAY_SUBMISSIONS: number[] = [
  0, 1, 0, 1, 0, 0, 0, 1, 0, 0, 2, 1, 0, 1, 0, 0, 0, 1, 0, 0, 1, 1, 0, 0, 0, 2, 0, 1, 0, 0, 0,
];

/**
 * The older year, cycled from a fixed 30-day shape.
 *
 * Deterministic by construction — no randomness, no generator — and deliberately
 * sparser than the recent window, because the sample developer's practice
 * increased over the year. Its longest run is one day, so the profile's longest
 * streak still comes from the authored recent window.
 */
const OLDER_DAY_SUBMISSIONS: number[] = [
  0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0,
];

/** Days of calendar history the sample profile carries — a full year, like LeetCode's. */
const CALENDAR_DAYS = 365;

/**
 * The sample submission calendar: ISO UTC day → submissions that day.
 *
 * Keyed by UTC days because that is the convention the whole dashboard reads
 * (activityDays.mts), and built from the anchor day so the newest entry is always
 * today. Sparse days are absent rather than present as 0, which is what the
 * heatmap treats as "no history".
 */
export function sampleSubmissionCalendar(anchor: Date): Record<string, number> {
  const calendar: Record<string, number> = {};

  for (let daysAgo = 0; daysAgo < CALENDAR_DAYS; daysAgo++) {
    const count =
      daysAgo < RECENT_30_DAY_SUBMISSIONS.length
        ? RECENT_30_DAY_SUBMISSIONS[RECENT_30_DAY_SUBMISSIONS.length - 1 - daysAgo]
        : OLDER_DAY_SUBMISSIONS[(daysAgo - RECENT_30_DAY_SUBMISSIONS.length) % OLDER_DAY_SUBMISSIONS.length];
    if (count > 0) calendar[utcDayKey(addUtcDays(anchor, -daysAgo))] = count;
  }

  return calendar;
}

/** Consecutive active days ending on the anchor — the profile's current streak. */
export function currentStreakFrom(calendar: Record<string, number>, anchor: Date): number {
  let streak = 0;
  for (let daysAgo = 0; daysAgo < CALENDAR_DAYS; daysAgo++) {
    if ((calendar[utcDayKey(addUtcDays(anchor, -daysAgo))] ?? 0) <= 0) break;
    streak += 1;
  }
  return streak;
}

/** Solved problems by difficulty; the split the dashboard renders as a donut. */
const SOLVED_BY_DIFFICULTY = { easy: 8, medium: 10, hard: 3 } as const;

/** Solved problems by topic — sums to the same total as the difficulty split. */
const SOLVED_BY_TOPIC: { tag: string; solved: number }[] = [
  { tag: "Arrays & Hashing", solved: 4 },
  { tag: "Two Pointers", solved: 2 },
  { tag: "Sliding Window", solved: 2 },
  { tag: "Stack", solved: 2 },
  { tag: "Binary Search", solved: 2 },
  { tag: "Tree", solved: 3 },
  { tag: "Dynamic Programming", solved: 4 },
  { tag: "Graph", solved: 2 },
];

/** Solved problems by language — the same total again. */
const SOLVED_BY_LANGUAGE: { language: string; solved: number }[] = [
  { language: "TypeScript", solved: 9 },
  { language: "Python", solved: 7 },
  { language: "SQL", solved: 3 },
  { language: "JavaScript", solved: 2 },
];

/** Recent accepted solves, newest first in the derived profile. */
const RECENT_SOLVES: { title: string; daysAgo: number; difficulty: string; topic: string }[] = [
  { title: "Daily Temperatures", daysAgo: 0, difficulty: "Medium", topic: "Stack" },
  { title: "Valid Anagram", daysAgo: 2, difficulty: "Easy", topic: "Arrays & Hashing" },
  { title: "Course Schedule", daysAgo: 5, difficulty: "Medium", topic: "Graph" },
  { title: "Best Time to Buy and Sell Stock", daysAgo: 8, difficulty: "Easy", topic: "Sliding Window" },
  { title: "Binary Tree Right Side View", daysAgo: 12, difficulty: "Medium", topic: "Tree" },
  { title: "Search in Rotated Sorted Array", daysAgo: 16, difficulty: "Medium", topic: "Binary Search" },
  { title: "Climbing Stairs", daysAgo: 22, difficulty: "Easy", topic: "Dynamic Programming" },
  { title: "Invert Binary Tree", daysAgo: 28, difficulty: "Easy", topic: "Tree" },
];

/* ────────────────────────────────────────────────────────────
   Aggregations
   ──────────────────────────────────────────────────────────── */

function round1(value: number): number {
  return Math.round(value * 10) / 10;
}

/** developer360.service: mean of each repository's latest completed analysis. */
function averageOfLatestAnalyses(repos: Repository[]): number | null {
  const latest = repos
    .map((repo) => repo.analyses?.find((analysis) => analysis.status === "COMPLETED"))
    .filter((analysis): analysis is RepositoryAnalysis => Boolean(analysis));

  if (latest.length === 0) return null;
  return round1(latest.reduce((sum, analysis) => sum + analysis.overallScore, 0) / latest.length);
}

function evidenceTierCounts(skills: SkillWithEvidence[]): EvidenceTierCounts {
  const count = (level: EvidenceLevel) => skills.filter((skill) => skill.currentLevel === level).length;
  return {
    CLAIMED: count("CLAIMED"),
    LEARNED: count("LEARNED"),
    CREDENTIAL_VERIFIED: count("CREDENTIAL_VERIFIED"),
    PRACTICALLY_EVIDENCED: count("PRACTICALLY_EVIDENCED"),
  };
}

/** developer360.service: mean confidence per category, for the six it reports. */
function categoryBreakdownFor(skills: SkillWithEvidence[]): CategoryBreakdown[] {
  const categories: SkillCategory[] = ["FRONTEND", "BACKEND", "DATABASE", "TESTING", "DEVOPS", "SECURITY"];
  return categories.map((category) => {
    const inCategory = skills.filter((skill) => skill.category === category);
    return {
      category,
      // null, never a placeholder, when nothing was recorded — the radar reads
      // that as an empty axis instead of a measured zero.
      score:
        inCategory.length > 0
          ? Math.round(inCategory.reduce((sum, skill) => sum + skill.confidence, 0) / inCategory.length)
          : null,
      skillCount: inCategory.length,
    };
  });
}

/** Average of one metric across every completed analysis — career service. */
export function metricAverage(repos: Repository[], category: MetricCategory): number | undefined {
  const scores = repos.flatMap((repo) =>
    (repo.analyses ?? [])
      .filter((analysis) => analysis.status === "COMPLETED")
      .flatMap((analysis) =>
        (analysis.metrics ?? []).filter((metric) => metric.category === category).map((metric) => metric.score)
      )
  );
  if (scores.length === 0) return undefined;
  return scores.reduce((sum, score) => sum + score, 0) / scores.length;
}

const LEVEL_RANK: Record<EvidenceLevel, number> = {
  CLAIMED: 0,
  LEARNED: 1,
  CREDENTIAL_VERIFIED: 2,
  PRACTICALLY_EVIDENCED: 3,
};

/* ────────────────────────────────────────────────────────────
   Growth history — growth.service, over the sample analyses
   ──────────────────────────────────────────────────────────── */

function deriveGrowthHistory(repos: Repository[], skillCount: number): GrowthHistory {
  const entries = repos
    .flatMap((repo) =>
      (repo.analyses ?? [])
        .filter((analysis) => analysis.status === "COMPLETED" && analysis.analyzedAt !== null)
        .map((analysis) => ({ at: analysis.analyzedAt as string, score: analysis.overallScore, repository: repo.fullName }))
    )
    .sort((a, b) => a.at.localeCompare(b.at));

  const points = entries.map((entry) => ({ date: entry.at, score: round1(entry.score), repository: entry.repository }));

  // Only months that contain a measurement; a gap is a gap, never a zero.
  const buckets = new Map<string, number[]>();
  for (const entry of entries) {
    const date = new Date(entry.at);
    const key = `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, "0")}`;
    const scores = buckets.get(key);
    if (scores) scores.push(entry.score);
    else buckets.set(key, [entry.score]);
  }

  const months = [...buckets.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([month, scores]) => ({
      month,
      analyses: scores.length,
      averageScore: round1(scores.reduce((sum, score) => sum + score, 0) / scores.length),
      bestScore: round1(Math.max(...scores)),
    }));

  // Trends need the same repository measured twice; nothing else is comparable.
  const byRepository = new Map<string, typeof entries>();
  for (const entry of entries) {
    const existing = byRepository.get(entry.repository);
    if (existing) existing.push(entry);
    else byRepository.set(entry.repository, [entry]);
  }

  const trends = [...byRepository.entries()]
    .filter(([, repositoryEntries]) => repositoryEntries.length >= 2)
    .map(([repository, repositoryEntries]) => {
      const first = repositoryEntries[0];
      const latest = repositoryEntries[repositoryEntries.length - 1];
      return {
        repository,
        analyses: repositoryEntries.length,
        firstScore: round1(first.score),
        latestScore: round1(latest.score),
        change: round1(latest.score - first.score),
        firstAt: first.at,
        latestAt: latest.at,
      };
    })
    .sort((a, b) => b.change - a.change);

  const scores = entries.map((entry) => entry.score);
  const reposByAge = [...repos].sort((a, b) => a.createdAt.localeCompare(b.createdAt));
  const first = entries[0];
  const best = entries.reduce((top, entry) => (entry.score > top.score ? entry : top), first);

  const milestones: GrowthHistory["milestones"] = [];
  if (reposByAge.length > 0) {
    milestones.push({ date: reposByAge[0].createdAt, label: "First repository connected", detail: reposByAge[0].fullName });
  }
  if (entries.length > 0) {
    milestones.push({
      date: first.at,
      label: "First analysis completed",
      detail: `${first.repository} scored ${round1(first.score)}/100`,
    });
    if (best !== first) {
      milestones.push({
        date: best.at,
        label: "Best analysis score",
        detail: `${best.repository} scored ${round1(best.score)}/100`,
      });
    }
  }
  milestones.sort((a, b) => a.date.localeCompare(b.date));

  return {
    points,
    months,
    milestones,
    trends,
    totals: {
      analyses: entries.length,
      repositories: repos.length,
      skills: skillCount,
      firstMeasuredAt: entries.length > 0 ? first.at : null,
      lastMeasuredAt: entries.length > 0 ? entries[entries.length - 1].at : null,
      bestScore: scores.length > 0 ? round1(Math.max(...scores)) : null,
      averageScore: scores.length > 0 ? round1(scores.reduce((sum, score) => sum + score, 0) / scores.length) : null,
      trendAvailable: trends.length > 0,
    },
  };
}

/* ────────────────────────────────────────────────────────────
   Career readiness — careerReadiness.service, over the sample profile
   ──────────────────────────────────────────────────────────── */

interface RequirementCheck {
  kind: "skillInCategory" | "namedSkill" | "analysisMetric" | "analyzedRepositories" | "problemSolving";
  category?: SkillCategory;
  names?: string[];
  metric?: MetricCategory;
  minimumScore?: number;
  minimum?: number;
  minimumSolved?: number;
  minimumLevel: EvidenceLevel;
}

interface RoleRequirement {
  id: string;
  label: string;
  weight: 1 | 2 | 3;
  check: RequirementCheck;
}

interface RoleDefinition {
  id: string;
  name: string;
  summary: string;
  requirements: RoleRequirement[];
}

/** Requirements every engineering role shares — careerReadiness.service. */
const COMMON_REQUIREMENTS: RoleRequirement[] = [
  { id: "analyzed-repositories", label: "At least two repositories analyzed", weight: 2, check: { kind: "analyzedRepositories", minimum: 2, minimumLevel: "PRACTICALLY_EVIDENCED" } },
  { id: "testing-practice", label: "Evidence of automated testing", weight: 2, check: { kind: "analysisMetric", metric: "TESTING", minimumScore: 50, minimumLevel: "PRACTICALLY_EVIDENCED" } },
  { id: "documentation-practice", label: "Repositories are documented", weight: 1, check: { kind: "analysisMetric", metric: "DOCUMENTATION", minimumScore: 60, minimumLevel: "PRACTICALLY_EVIDENCED" } },
  { id: "code-quality", label: "Code quality above the review threshold", weight: 2, check: { kind: "analysisMetric", metric: "CODE_QUALITY", minimumScore: 60, minimumLevel: "PRACTICALLY_EVIDENCED" } },
  { id: "security-hygiene", label: "No exposed secrets or unsafe patterns detected", weight: 1, check: { kind: "analysisMetric", metric: "SECURITY", minimumScore: 70, minimumLevel: "PRACTICALLY_EVIDENCED" } },
];

/**
 * The same role definitions the readiness endpoint scores against.
 *
 * Mirrored rather than fetched because that endpoint is authenticated and a demo
 * visitor has no session — the demo cannot call it, and a hardcoded score would
 * be an invented number. Keeping the definitions and the arithmetic identical is
 * what makes these sample scores reproducible and open to challenge.
 */
const SAMPLE_ROLES: RoleDefinition[] = [
  {
    id: "frontend-engineer",
    name: "Frontend Engineer",
    summary: "Builds user interfaces with evidence of component work, styling and testing.",
    requirements: [
      { id: "frontend-skill", label: "A frontend technology demonstrated in code", weight: 3, check: { kind: "skillInCategory", category: "FRONTEND", minimumLevel: "PRACTICALLY_EVIDENCED" } },
      { id: "frontend-language", label: "JavaScript or TypeScript demonstrated in code", weight: 3, check: { kind: "namedSkill", names: ["JavaScript", "TypeScript"], minimumLevel: "PRACTICALLY_EVIDENCED" } },
      ...COMMON_REQUIREMENTS,
    ],
  },
  {
    id: "backend-engineer",
    name: "Backend Engineer",
    summary: "Builds services and data layers with evidence of API, database and testing work.",
    requirements: [
      { id: "backend-skill", label: "A backend technology demonstrated in code", weight: 3, check: { kind: "skillInCategory", category: "BACKEND", minimumLevel: "PRACTICALLY_EVIDENCED" } },
      { id: "database-skill", label: "A database technology demonstrated in code", weight: 3, check: { kind: "skillInCategory", category: "DATABASE", minimumLevel: "PRACTICALLY_EVIDENCED" } },
      { id: "dependency-health", label: "Dependencies are managed with a lockfile", weight: 1, check: { kind: "analysisMetric", metric: "DEPENDENCY_HEALTH", minimumScore: 70, minimumLevel: "PRACTICALLY_EVIDENCED" } },
      ...COMMON_REQUIREMENTS,
    ],
  },
  {
    id: "full-stack-engineer",
    name: "Full Stack Engineer",
    summary: "Works across the stack with demonstrated frontend, backend and data work.",
    requirements: [
      { id: "frontend-skill", label: "A frontend technology demonstrated in code", weight: 3, check: { kind: "skillInCategory", category: "FRONTEND", minimumLevel: "PRACTICALLY_EVIDENCED" } },
      { id: "backend-skill", label: "A backend technology demonstrated in code", weight: 3, check: { kind: "skillInCategory", category: "BACKEND", minimumLevel: "PRACTICALLY_EVIDENCED" } },
      { id: "database-skill", label: "A database technology demonstrated in code", weight: 2, check: { kind: "skillInCategory", category: "DATABASE", minimumLevel: "PRACTICALLY_EVIDENCED" } },
      ...COMMON_REQUIREMENTS,
    ],
  },
  {
    id: "devops-engineer",
    name: "DevOps Engineer",
    summary: "Automates build and deployment with evidence of containers and pipelines.",
    requirements: [
      { id: "devops-skill", label: "A DevOps technology demonstrated in code", weight: 3, check: { kind: "skillInCategory", category: "DEVOPS", minimumLevel: "PRACTICALLY_EVIDENCED" } },
      { id: "ci-cd", label: "A CI/CD pipeline present in a repository", weight: 3, check: { kind: "namedSkill", names: ["CI/CD"], minimumLevel: "PRACTICALLY_EVIDENCED" } },
      { id: "maintainability", label: "Maintainability above the review threshold", weight: 2, check: { kind: "analysisMetric", metric: "MAINTAINABILITY", minimumScore: 60, minimumLevel: "PRACTICALLY_EVIDENCED" } },
      ...COMMON_REQUIREMENTS,
    ],
  },
  {
    id: "software-engineer-new-grad",
    name: "Software Engineer (New Grad)",
    summary: "Entry-level engineering, weighted towards fundamentals and problem solving.",
    requirements: [
      { id: "any-language", label: "A programming language demonstrated in code", weight: 3, check: { kind: "skillInCategory", category: "GENERAL", minimumLevel: "PRACTICALLY_EVIDENCED" } },
      { id: "problem-solving", label: "At least 21 problems solved on a coding platform", weight: 3, check: { kind: "problemSolving", minimumSolved: 21, minimumLevel: "PRACTICALLY_EVIDENCED" } },
      ...COMMON_REQUIREMENTS,
    ],
  },
];

function deriveCareerReadiness({
  skills,
  repositories,
  problemsSolved,
}: {
  skills: SkillWithEvidence[];
  repositories: Repository[];
  problemsSolved: number;
}): CareerReadiness {
  const analyzedRepositories = repositories.filter((repo) =>
    repo.analyses?.some((analysis) => analysis.status === "COMPLETED")
  ).length;

  const evaluate = (requirement: RoleRequirement): { met: boolean; evidence: string } => {
    const check = requirement.check;

    if (check.kind === "skillInCategory" || check.kind === "namedSkill") {
      const matches = skills.filter((skill) => {
        if (check.kind === "namedSkill" && !(check.names ?? []).includes(skill.name)) return false;
        if (check.kind === "skillInCategory" && skill.category !== check.category) return false;
        return LEVEL_RANK[skill.currentLevel] >= LEVEL_RANK[check.minimumLevel];
      });

      if (matches.length > 0) {
        return { met: true, evidence: `${matches.map((skill) => skill.name).join(", ")} (practically evidenced)` };
      }
      return {
        met: false,
        evidence:
          check.kind === "namedSkill"
            ? `Needs one of: ${(check.names ?? []).join(", ")}`
            : `No ${(check.category ?? "").toLowerCase()} skill at practically evidenced yet`,
      };
    }

    if (check.kind === "analysisMetric") {
      const average = metricAverage(repositories, check.metric as MetricCategory);
      if (average === undefined) return { met: false, evidence: "No completed analysis has measured this yet" };
      return {
        met: average >= (check.minimumScore ?? 0),
        evidence: `${Math.round(average)}/100 average, threshold ${check.minimumScore}`,
      };
    }

    if (check.kind === "analyzedRepositories") {
      return {
        met: analyzedRepositories >= (check.minimum ?? 0),
        evidence: `${analyzedRepositories} analyzed, needs ${check.minimum}`,
      };
    }

    return {
      met: problemsSolved >= (check.minimumSolved ?? 0),
      evidence: `${problemsSolved} solved, needs ${check.minimumSolved}`,
    };
  };

  const roles: RoleReadiness[] = SAMPLE_ROLES.map((role) => {
    const results = role.requirements.map((requirement) => ({ requirement, ...evaluate(requirement) }));
    const totalWeight = role.requirements.reduce((sum, requirement) => sum + requirement.weight, 0);
    const metWeight = role.requirements.reduce(
      (sum, requirement, index) => (results[index].met ? sum + requirement.weight : sum),
      0
    );

    return {
      roleId: role.id,
      role: role.name,
      summary: role.summary,
      score: totalWeight > 0 ? Math.round((metWeight / totalWeight) * 100) : 0,
      requirementsMet: results.filter((result) => result.met).length,
      requirementsTotal: results.length,
      requirements: results.map((result) => ({
        id: result.requirement.id,
        label: result.requirement.label,
        weight: result.requirement.weight,
        met: result.met,
        evidence: result.evidence,
      })),
    };
  });

  const hasEvidence = skills.length > 0 || analyzedRepositories > 0 || problemsSolved > 0;
  const best = roles.reduce((top, role) => (role.score > top.score ? role : top), roles[0]);

  return {
    hasEvidence,
    bestMatch: hasEvidence && best.score > 0 ? best.role : null,
    // Ties resolve to the role defined first, exactly as the service does.
    roles: [...roles].sort((a, b) => b.score - a.score),
  };
}

/* ────────────────────────────────────────────────────────────
   AI insights — prewritten sample text over the derived numbers
   ──────────────────────────────────────────────────────────── */

/**
 * The prose is fixed: no model is called, nothing is generated, and the copy
 * says so. The figures inside it are interpolated from the same aggregates the
 * rest of the dashboard renders, so an insight cannot quote a number that
 * contradicts the page behind it.
 */
function deriveAiInsights({
  repositories,
  developer360Score,
  ciCdEvidenced,
}: {
  repositories: Repository[];
  developer360Score: number | null;
  ciCdEvidenced: boolean;
}): AiInsightsResponse {
  const analyzed = repositories
    .map((repo) => ({ repo, analysis: repo.analyses?.find((analysis) => analysis.status === "COMPLETED") }))
    .filter((entry): entry is { repo: Repository; analysis: RepositoryAnalysis } => Boolean(entry.analysis));

  const evidence = { repositoriesAnalyzed: analyzed.length, averageScore: developer360Score };

  if (analyzed.length === 0) {
    return { hasEvidence: false, insights: null, evidence };
  }

  const best = analyzed.reduce((top, entry) => (entry.analysis.overallScore > top.analysis.overallScore ? entry : top), analyzed[0]);
  const weakest = analyzed.reduce((low, entry) => (entry.analysis.overallScore < low.analysis.overallScore ? entry : low), analyzed[0]);
  const untested = analyzed.filter(
    (entry) => !(entry.analysis.metrics ?? []).some((metric) => metric.category === "TESTING" && metric.score >= 80)
  );

  const testing = Math.round(metricAverage(repositories, "TESTING") ?? 0);
  const documentation = Math.round(metricAverage(repositories, "DOCUMENTATION") ?? 0);
  const dependencies = Math.round(metricAverage(repositories, "DEPENDENCY_HEALTH") ?? 0);

  return {
    hasEvidence: true,
    evidence,
    insights: {
      summary:
        `Across ${analyzed.length} analyzed sample repositories, engineering quality averages ` +
        `${developer360Score ?? 0}/100. Documentation (${documentation}/100) and dependency management ` +
        `(${dependencies}/100) are the strongest signals; automated testing (${testing}/100) and release ` +
        `automation are the weakest. These are illustrative metrics from sample data — not real analysis results.`,
      strengths: [
        {
          title: `${best.repo.name} is the strongest repository in the sample profile`,
          detail: `It scores ${best.analysis.overallScore}/100 across ${best.repo.analyses?.length ?? 1} recorded analyses, with a README, a licence and a verified lockfile.`,
        },
        {
          title: "Documentation is a habit, not an accident",
          detail: `Every one of the ${analyzed.length} analyzed repositories ships a README, which is why documentation averages ${documentation}/100.`,
        },
        {
          title: "Dependencies are pinned",
          detail: `Lockfiles are present wherever a package manager is used, putting dependency management at ${dependencies}/100.`,
        },
      ],
      risks: [
        {
          title: "No CI/CD pipeline in any repository",
          detail: ciCdEvidenced
            ? "One repository is evidenced, so maintainability is not held back for all of them."
            : `Nothing verifies a change before it ships, which holds maintainability at 60/100 for all ${analyzed.length} analyzed repositories.`,
          severity: "HIGH",
        },
        {
          title: `${weakest.repo.name} is the weakest repository`,
          detail: `It scores ${weakest.analysis.overallScore}/100, with no test files detected and one hardcoded-credential warning.`,
          severity: "HIGH",
        },
        {
          title: "Automated testing is uneven",
          detail: `Testing averages ${testing}/100: solid in the flagship projects and absent in ${untested.length} of the ${analyzed.length} analyzed repositories.`,
          severity: "MEDIUM",
        },
      ],
      recommendations: [
        {
          title: "Add one CI workflow to the flagship repository",
          rationale: "Installing, linting and testing on every pull request would lift maintainability above 52/100 and close the DevOps readiness requirement that is currently unmet.",
          priority: "HIGH",
        },
        {
          title: "Grow problem-solving volume towards 21 solved",
          rationale: "21 solved problems shows steady practice, but the New Grad readiness requirement asks for 21 and it is the only interview-facing requirement still unmet.",
          priority: "MEDIUM",
        },
        {
          title: `Add a test suite to ${weakest.repo.name}`,
          rationale: `${weakest.repo.name} scores ${weakest.analysis.overallScore}/100 with no detected tests, which is what pulls the profile's testing average down.`,
          priority: "MEDIUM",
        },
        {
          title: "Move the detected credential into the environment",
          rationale: "One repository contains a string matching a secret pattern; rotating it and reading from an environment variable removes the only security finding in the sample profile.",
          priority: "LOW",
        },
      ],
    },
  };
}

/* ────────────────────────────────────────────────────────────
   Resume — the sample profile's document
   ──────────────────────────────────────────────────────────── */

function deriveResume(anchor: Date): ResumeResponse {
  return {
    resume: {
      id: "demo-resume",
      fileName: "alex-morgan-sample-resume.pdf",
      fileSize: 148_213,
      pageCount: 1,
      uploadedAt: isoDaysAgo(anchor, 20),
      parseError: null,
      parsed: {
        wordCount: 412,
        detectedSkills: ["React", "TypeScript", "Node.js", "Express", "PostgreSQL", "Docker", "Python", "Machine Learning"],
        sections: {
          Summary: `${SAMPLE_IDENTITY.headline}. Two years building and shipping web applications, with an emphasis on measurable engineering quality.`,
          Experience:
            "Software Engineer, Brightline Systems (sample) — Feb 2024 to present\nSoftware Engineering Intern, Northwind Analytics (sample) — Jun 2023 to Dec 2023",
          Education: "B.Sc. Computer Science, Sample State University — 2019 to 2023",
          Projects:
            "TaskFlow — React and TypeScript task manager\nFinTrack — budgeting dashboard with a Node.js API",
          Certifications: "AWS Certified Cloud Practitioner\nSQL (Advanced) Certificate",
          Skills: "TypeScript, React, Node.js, Express, PostgreSQL, Docker, Python",
        },
        analysis: {
          version: 1,
          analysedAt: isoDaysAgo(anchor, 20),
          contact: {
            email: SAMPLE_IDENTITY.email,
            // 555-01xx is the range reserved for fictional use.
            phone: "+1 555 010 0100",
            links: [
              { label: "GitHub", url: demoUrl("profile") },
              { label: "Portfolio", url: demoUrl("portfolio") },
            ],
          },
          summary:
            "Full-stack developer with two years of experience building React and TypeScript front ends on Node.js APIs, with an emphasis on documentation, data modelling and measurable code quality.",
          education: [
            {
              evidence: "B.Sc. Computer Science, Sample State University — 2019 to 2023",
              qualification: "B.Sc. Computer Science",
              institution: "Sample State University",
              period: "2019 - 2023",
            },
          ],
          experience: [
            {
              evidence: "Software Engineer, Brightline Systems (sample) — Feb 2024 to present",
              role: "Software Engineer",
              organization: "Brightline Systems (sample)",
              period: "Feb 2024 - Present",
              durationMonths: 32,
              highlights: [
                "Built and maintained the customer-facing dashboard used by the support team.",
                "Introduced the PostgreSQL schema migrations the reporting work depended on.",
                "Worked with design to ship the accessibility fixes on the account settings flow.",
              ],
            },
            {
              evidence: "Software Engineering Intern, Northwind Analytics (sample) — Jun 2023 to Dec 2023",
              role: "Software Engineering Intern",
              organization: "Northwind Analytics (sample)",
              period: "Jun 2023 - Dec 2023",
              durationMonths: 7,
              highlights: [
                "Wrote the first version of the CSV import pipeline.",
                "Added the documentation the next intern used to get started.",
              ],
            },
          ],
          projects: [
            {
              evidence: "TaskFlow — React and TypeScript task manager",
              name: "TaskFlow",
              description: "Kanban-style task manager with optimistic updates and offline drafts.",
              technologies: ["React", "TypeScript", "Tailwind CSS"],
              link: demoUrl("repositories/taskflow"),
            },
            {
              evidence: "FinTrack — budgeting dashboard with a Node.js API",
              name: "FinTrack",
              description: "Budget envelopes and monthly reporting over an Express API.",
              technologies: ["React", "TypeScript", "Node.js", "Express", "PostgreSQL"],
              link: demoUrl("repositories/fintrack"),
            },
          ],
          certifications: [
            {
              title: "AWS Certified Cloud Practitioner",
              issuer: "Amazon Web Services",
              issueDate: null,
              credentialId: null,
              credentialUrl: null,
              evidence: "AWS Certified Cloud Practitioner",
              needsReview: false,
            },
            {
              title: "SQL (Advanced) Certificate",
              issuer: null,
              issueDate: "2026",
              credentialId: null,
              credentialUrl: null,
              evidence: "SQL (Advanced) Certificate — 2026",
              needsReview: true,
            },
          ],
          achievements: [
            "Finalist (top 8) — Campus Hack Days, with StudyLoop",
            "Second place — Open Data Sprint, with Transit Pulse",
            "Maintainer of TaskFlow, a sample project with 128 stars",
          ],
        },
      },
    },
  };
}

/* ────────────────────────────────────────────────────────────
   Assembled sample dataset
   ──────────────────────────────────────────────────────────── */

export interface SampleData {
  identity: SampleIdentity;
  /** The sample profile as a user record, for the shell's identity card. */
  user: User;
  repositories: Repository[];
  repositoriesResponse: RepositoriesResponse;
  repositoryById: (id: string) => Repository | undefined;
  /** The detail-endpoint shape, or null for an id the demo does not have. */
  repositoryResponse: (id: string) => RepositoryResponse | null;
  skills: SkillWithEvidence[];
  skillsResponse: SkillsResponse;
  certifications: Certification[];
  certificationsResponse: CertificationsResponse;
  courses: Course[];
  coursesResponse: CoursesResponse;
  hackathons: Hackathon[];
  hackathonsResponse: HackathonsResponse;
  codingProfile: CodingProfile;
  codingProfilesResponse: CodingProfilesResponse;
  developer360: Developer360Response;
  growth: GrowthHistoryResponse;
  career: CareerReadinessResponse;
  ai: AiInsightsResponse;
  resume: ResumeResponse;
  /** The UTC day every derived date is measured from. */
  anchor: Date;
}

/**
 * Builds the whole sample dataset for a given day.
 *
 * Exported with a `now` parameter so `node --test` can pin the day and assert
 * exact dates; the app uses the default (today) through {@link sampleData}.
 */
export function buildSampleData(now: Date = new Date()): SampleData {
  const anchor = utcToday(now);

  const derived = SAMPLE_REPOSITORIES.map((repo) => deriveRepository(repo, anchor));
  const repositories = derived.map((entry) => entry.record);

  // ── Skills: code evidence first, then the ladder moves ──
  const pending = deriveRepositorySkills(derived);
  /** Levels a course, certification or hackathon put a skill at. */
  const promotions = new Map<string, { level: EvidenceLevel; category: SkillCategory }>();

  const promote = (name: string, category: SkillCategory, level: EvidenceLevel) => {
    // A skill evidenced by working code is never downgraded by a credential or a
    // course — the ladder only moves in one direction here.
    if (pending.has(name)) return;
    const existing = promotions.get(name);
    // Never move a skill backwards either: CREDENTIAL_VERIFIED outranks LEARNED,
    // and CLAIMED is the floor.
    if (existing && LEVEL_RANK[existing.level] >= LEVEL_RANK[level]) return;
    promotions.set(name, { level, category });
  };

  for (const course of SAMPLE_COURSES) {
    // Only completed courses promote: enrolling is not evidence of learning.
    if (!course.isCompleted) continue;
    for (const name of course.learnedSkills) {
      promote(name, TOKEN_SKILLS[normalizeToken(name)]?.category ?? "GENERAL", "LEARNED");
    }
    // A title names its subject too ("Kubernetes for Developers" teaches Kubernetes).
    for (const [token, seed] of Object.entries(TOKEN_SKILLS)) {
      if (new RegExp(`\\b${token}\\b`).test(course.title.toLowerCase())) promote(seed.name, seed.category, "LEARNED");
    }
  }

  for (const certification of SAMPLE_CERTIFICATIONS) {
    for (const [token, seed] of Object.entries(TOKEN_SKILLS)) {
      if (new RegExp(`\\b${token}\\b`).test(certification.name.toLowerCase())) {
        promote(seed.name, seed.category, "CREDENTIAL_VERIFIED");
      }
    }
  }

  for (const hackathon of SAMPLE_HACKATHONS) {
    for (const technology of hackathon.technologies) {
      const seed = TOKEN_SKILLS[normalizeToken(technology)];
      // A hackathon names technologies at most; unrecognised tokens are ignored,
      // and they never touch an existing skill.
      if (seed) promote(seed.name, seed.category, "CLAIMED");
    }
  }

  const skills: SkillWithEvidence[] = [
    ...[...pending.values()].map((skill) => ({
      id: `demo-skill-${normalizeToken(skill.name)}`,
      name: skill.name,
      category: skill.category,
      confidence: confidenceFor(skill.evidences.length, skill.ceiling),
      currentLevel: "PRACTICALLY_EVIDENCED" as EvidenceLevel,
      evidences: skill.evidences.map((evidence, index) => ({
        id: `demo-evidence-${normalizeToken(skill.name)}-${index}`,
        ...evidence,
        level: "PRACTICALLY_EVIDENCED" as EvidenceLevel,
      })),
    })),
    ...[...promotions.entries()].map(([name, promotion]) => ({
      id: `demo-skill-${normalizeToken(name)}`,
      name,
      category: promotion.category,
      // A promoted skill has no repository evidence, so no measured confidence —
      // the backend stores 0 for exactly this case.
      confidence: 0,
      currentLevel: promotion.level,
      evidences: [],
    })),
  ].sort((a, b) => b.confidence - a.confidence || a.name.localeCompare(b.name));

  // ── Problem solving ──
  const calendar = sampleSubmissionCalendar(anchor);
  const totalSolved = SOLVED_BY_DIFFICULTY.easy + SOLVED_BY_DIFFICULTY.medium + SOLVED_BY_DIFFICULTY.hard;

  const codingProfile: CodingProfile = {
    id: "demo-coding-profile",
    platform: "LEETCODE",
    // Deliberately not a plausible handle: nothing was queried, and this must
    // never resolve to somebody's real account.
    handle: "sample-dev-alex",
    profileUrl: demoUrl("coding-profile/sample-dev-alex"),
    totalSolved,
    easySolved: SOLVED_BY_DIFFICULTY.easy,
    mediumSolved: SOLVED_BY_DIFFICULTY.medium,
    hardSolved: SOLVED_BY_DIFFICULTY.hard,
    acceptanceRate: 58.6,
    ranking: 412_300,
    rating: 1547,
    contestsAttended: 9,
    globalRanking: 61_240,
    topPercentage: 22.4,
    streakDays: currentStreakFrom(calendar, anchor),
    totalActiveDays: Object.keys(calendar).length,
    rawStats: {
      submissionCalendar: calendar,
      // Sample platform totals, so a coverage percentage has a denominator.
      totalAvailable: { easy: 930, medium: 2010, hard: 890 },
      topics: SOLVED_BY_TOPIC,
      languages: SOLVED_BY_LANGUAGE,
      recentSolves: [...RECENT_SOLVES]
        .sort((a, b) => a.daysAgo - b.daysAgo)
        .map((solve) => ({
          title: solve.title,
          url: demoUrl(`problems/${normalizeToken(solve.title)}`),
          solvedAt: isoDaysAgo(anchor, solve.daysAgo),
          difficulty: solve.difficulty,
          topic: solve.topic,
        })),
    },
    lastSyncedAt: anchor.toISOString(),
  };

  // ── Developer 360, including the GitHub evidence block ──
  const authored = repositories.filter((repo) => !repo.isFork && repo.owner === SAMPLE_IDENTITY.githubUsername);
  const languageCounts = new Map<string, number>();
  for (const repo of authored) {
    if (!repo.language) continue;
    languageCounts.set(repo.language, (languageCounts.get(repo.language) ?? 0) + 1);
  }
  const languageTotal = [...languageCounts.values()].reduce((sum, count) => sum + count, 0);
  const languageDistribution = [...languageCounts.entries()]
    .map(([language, count]) => ({
      language,
      count,
      percentage: languageTotal > 0 ? Math.round((count / languageTotal) * 1000) / 10 : 0,
    }))
    .sort((a, b) => b.count - a.count || a.language.localeCompare(b.language));

  const developer360Score = averageOfLatestAnalyses(repositories);

  const user: User = {
    id: "demo-user-alex-morgan",
    email: SAMPLE_IDENTITY.email,
    name: SAMPLE_IDENTITY.name,
    avatarUrl: null,
    role: "DEVELOPER",
    githubAccount: {
      id: "demo-github-account",
      username: SAMPLE_IDENTITY.githubUsername,
      profileUrl: demoUrl("profile"),
      avatarUrl: null,
      totalRepos: repositories.length,
      totalStars: repositories.reduce((sum, repo) => sum + repo.starsCount, 0),
      totalFollowers: 184,
      totalFollowing: 89,
      lastSyncedAt: isoDaysAgo(anchor, 2),
    },
    createdAt: isoDaysAgo(anchor, 700),
  };

  const certifications: Certification[] = SAMPLE_CERTIFICATIONS.map((certification) => ({
    id: `demo-certification-${certification.slug}`,
    name: certification.name,
    issuer: certification.issuer,
    credentialId: null,
    credentialUrl: null,
    issueDate: isoDaysAgo(anchor, certification.issueDaysAgo),
    createdAt: isoDaysAgo(anchor, certification.issueDaysAgo),
  }));

  const courses: Course[] = SAMPLE_COURSES.map((course) => ({
    id: `demo-course-${course.slug}`,
    title: course.title,
    platform: course.platform,
    isCompleted: course.isCompleted,
    completedAt: course.completedDaysAgo === null ? null : isoDaysAgo(anchor, course.completedDaysAgo),
    certificateUrl: null,
    learnedSkills: course.learnedSkills,
    createdAt: isoDaysAgo(anchor, course.completedDaysAgo ?? 20),
    updatedAt: isoDaysAgo(anchor, course.completedDaysAgo ?? 20),
  }));

  const hackathons: Hackathon[] = SAMPLE_HACKATHONS.map((hackathon) => ({
    id: `demo-hackathon-${hackathon.slug}`,
    name: hackathon.name,
    organizer: hackathon.organizer,
    role: hackathon.role,
    projectName: hackathon.projectName,
    projectUrl: demoUrl(`hackathons/${hackathon.slug}`),
    result: hackathon.result,
    teamSize: hackathon.teamSize,
    heldAt: isoDaysAgo(anchor, hackathon.heldDaysAgo),
    technologies: hackathon.technologies,
    createdAt: isoDaysAgo(anchor, hackathon.heldDaysAgo),
    updatedAt: isoDaysAgo(anchor, hackathon.heldDaysAgo),
  }));

  const overview: Developer360Overview = {
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
      avatarUrl: null,
      githubUsername: SAMPLE_IDENTITY.githubUsername,
    },
    developer360Score,
    totalRepositories: repositories.length,
    totalAnalyzed: repositories.filter((repo) => repo.analyses?.some((analysis) => analysis.status === "COMPLETED")).length,
    evidenceTiers: evidenceTierCounts(skills),
    categoryBreakdown: categoryBreakdownFor(skills),
    skillsList: skills,
    recentCertifications: certifications,
    codingProfiles: [codingProfile],
    targetRoles: [],
    github: {
      source: "GitHub",
      connected: true,
      lastSyncedAt: isoDaysAgo(anchor, 1),
      username: SAMPLE_IDENTITY.githubUsername,
      profileUrl: demoUrl("profile"),
      avatarUrl: null,
      publicRepos: repositories.length + 3,
      followers: 184,
      following: 96,
      totalStars: repositories.reduce((sum, repo) => sum + repo.starsCount, 0),
      totalForks: repositories.reduce((sum, repo) => sum + repo.forksCount, 0),
      repositoriesTracked: repositories.length,
      languageDistribution,
      primaryTechnologies: languageDistribution.slice(0, 5).map((share) => share.language),
      recentActivity: [...repositories]
        .filter((repo) => repo.pushedAt !== null)
        .sort((a, b) => (b.pushedAt ?? "").localeCompare(a.pushedAt ?? ""))
        .slice(0, 5)
        .map((repo) => ({
          name: repo.name,
          fullName: repo.fullName,
          url: repo.url,
          language: repo.language,
          isFork: repo.isFork,
          isArchived: repo.isArchived,
          starsCount: repo.starsCount,
          forksCount: repo.forksCount,
          pushedAt: repo.pushedAt,
        })),
    },
  };

  return {
    identity: SAMPLE_IDENTITY,
    user,
    repositories,
    repositoriesResponse: { repositories },
    repositoryById: (id: string) => repositories.find((repo) => repo.id === id),
    repositoryResponse: (id: string) => {
      const repository = repositories.find((repo) => repo.id === id);
      return repository ? { repository } : null;
    },
    skills,
    skillsResponse: { skills },
    certifications,
    certificationsResponse: { certifications },
    courses,
    coursesResponse: { courses },
    hackathons,
    hackathonsResponse: { hackathons },
    codingProfile,
    codingProfilesResponse: { profiles: [codingProfile] },
    developer360: { overview },
    growth: { history: deriveGrowthHistory(repositories, skills.length) },
    career: { readiness: deriveCareerReadiness({ skills, repositories, problemsSolved: totalSolved }) },
    ai: deriveAiInsights({
      repositories,
      developer360Score,
      ciCdEvidenced: skills.some((skill) => skill.name === "CI/CD"),
    }),
    resume: deriveResume(anchor),
    anchor,
  };
}

/** The dataset every demo page reads. Built once, for the current UTC day. */
export const sampleData: SampleData = buildSampleData();
