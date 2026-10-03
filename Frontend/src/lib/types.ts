/**
 * Shapes returned by the DevProof backend.
 *
 * Mirrors Backend/prisma/schema.prisma and the controllers' response payloads.
 * Kept hand-written (rather than generated) so the frontend only declares the
 * fields the controllers actually select.
 */

export type UserRole = "DEVELOPER" | "RECRUITER" | "ADMIN";

export type AnalysisStatus = "PENDING" | "IN_PROGRESS" | "COMPLETED" | "FAILED";

export type SeverityLevel = "CRITICAL" | "HIGH" | "MEDIUM" | "LOW" | "GOOD";

export type MetricCategory =
  | "ENGINEERING_HEALTH"
  | "CODE_QUALITY"
  | "SECURITY"
  | "TESTING"
  | "MAINTAINABILITY"
  | "DOCUMENTATION"
  | "DEPENDENCY_HEALTH";

export type EvidenceLevel = "CLAIMED" | "LEARNED" | "CREDENTIAL_VERIFIED" | "PRACTICALLY_EVIDENCED";

export type SkillCategory =
  | "FRONTEND"
  | "BACKEND"
  | "DATABASE"
  | "TESTING"
  | "DEVOPS"
  | "SECURITY"
  | "ML"
  | "GENERAL";

export interface GitHubAccount {
  id: string;
  username: string;
  profileUrl: string | null;
  avatarUrl: string | null;
  totalRepos: number;
  totalStars: number;
  totalFollowers: number;
}

export interface User {
  id: string;
  email: string;
  name: string | null;
  avatarUrl?: string | null;
  role: UserRole;
  githubAccount?: GitHubAccount | null;
  createdAt?: string;
}

export interface Metric {
  id: string;
  category: MetricCategory;
  name: string;
  score: number;
  detail: string | null;
}

export interface Finding {
  id: string;
  severity: SeverityLevel;
  category: string;
  title: string;
  description: string;
  filePath: string | null;
  lineNumber: number | null;
  snippet: string | null;
  recommendation: string | null;
}

export interface RepositoryAnalysis {
  id: string;
  status: AnalysisStatus;
  overallScore: number;
  healthStatus: string;
  errorMessage: string | null;
  analyzedAt: string | null;
  createdAt: string;
  /** Only present on endpoints that include them. */
  metrics?: Metric[];
  findings?: Finding[];
}

export interface Repository {
  id: string;
  name: string;
  fullName: string;
  owner: string;
  url: string;
  description: string | null;
  isPrivate: boolean;
  /** GitHub's own numeric repo id (as a string); null for URL-connected repos never synced. */
  githubRepoId: string | null;
  isFork: boolean;
  isArchived: boolean;
  defaultBranch: string;
  language: string | null;
  /** GitHub repo topics, when stored. */
  topics: string[] | null;
  starsCount: number;
  forksCount: number;
  watchersCount: number;
  openIssuesCount: number;
  sizeKb: number;
  /** GitHub-reported timestamps; null when GitHub omitted them or the repo predates sync. */
  githubCreatedAt: string | null;
  githubUpdatedAt: string | null;
  pushedAt: string | null;
  createdAt: string;
  updatedAt: string;
  /** List endpoint includes only the latest; detail endpoint includes all. */
  analyses?: RepositoryAnalysis[];
}

export interface EvidenceTierCounts {
  CLAIMED: number;
  LEARNED: number;
  CREDENTIAL_VERIFIED: number;
  PRACTICALLY_EVIDENCED: number;
}

export interface CategoryBreakdown {
  category: SkillCategory;
  /** null when the user has no recorded skills in this category — not a measured 0. */
  score: number | null;
  skillCount: number;
}

export interface Skill {
  id: string;
  name: string;
  category: SkillCategory;
  confidence: number;
  currentLevel: EvidenceLevel;
}

/** A single repository-backed justification for a skill. */
export interface SkillEvidence {
  id: string;
  /** REPOSITORY_LANGUAGE | REPOSITORY_TOPIC | ANALYSIS_SIGNAL */
  evidenceType: string;
  title: string;
  snippet: string | null;
  sourceUrl: string | null;
  level: EvidenceLevel;
}

/** A skill together with everything that justifies it. */
export interface SkillWithEvidence extends Skill {
  evidences: SkillEvidence[];
}

export interface SkillsResponse {
  skills: SkillWithEvidence[];
}

/** Outcome of rebuilding skills from repository evidence. */
export interface DeriveSkillsResponse {
  summary: {
    created: number;
    updated: number;
    total: number;
    repositoriesConsidered: number;
    repositoriesAnalyzed: number;
  };
  skills: SkillWithEvidence[];
}

export interface SkillResponse {
  skill: SkillWithEvidence;
}

/** A repository's most recent push, as surfaced in the GitHub evidence block. */
export interface GitHubActivityItem {
  name: string;
  fullName: string;
  url: string;
  language: string | null;
  isFork: boolean;
  isArchived: boolean;
  starsCount: number;
  forksCount: number;
  pushedAt: string | null;
}

/** One primary-language bucket: repo count and share of authored repositories. */
export interface LanguageShare {
  language: string;
  count: number;
  /** Share of authored repositories (%), NOT a byte-level breakdown. */
  percentage: number;
}

/**
 * GitHub-sourced engineering evidence, derived entirely from synced data.
 * `connected: false` means no GitHub account is linked — every stat is
 * null/empty and the UI shows the "connect GitHub" empty state.
 */
export interface GitHubEvidence {
  source: "GitHub";
  connected: boolean;
  lastSyncedAt: string | null;
  username: string | null;
  profileUrl: string | null;
  avatarUrl: string | null;
  publicRepos: number | null;
  followers: number | null;
  following: number | null;
  totalStars: number;
  totalForks: number;
  repositoriesTracked: number;
  languageDistribution: LanguageShare[];
  primaryTechnologies: string[];
  recentActivity: GitHubActivityItem[];
}

export interface Developer360Overview {
  user: {
    id: string;
    email: string;
    name: string | null;
    avatarUrl: string | null;
    githubUsername: string | null;
  };
  /** null when no repository analysis has completed yet — not a measured score. */
  developer360Score: number | null;
  totalRepositories: number;
  totalAnalyzed: number;
  evidenceTiers: EvidenceTierCounts;
  categoryBreakdown: CategoryBreakdown[];
  skillsList: Skill[];
  recentCertifications: unknown[];
  codingProfiles: unknown[];
  targetRoles: unknown[];
  /** GitHub-derived evidence; always present (connected flag distinguishes states). */
  github: GitHubEvidence;
}

/* ── Response envelopes (the `data` field of each endpoint) ── */

export interface AuthResponse {
  user: User;
  /** Not present in responses \u2014 the JWT lives only in the httpOnly cookie. */
  token?: never;
}

export interface MeResponse {
  user: User;
}

export interface RepositoriesResponse {
  repositories: Repository[];
}

export interface GitHubRepoOption {
  owner: string;
  name: string;
  fullName: string;
  url: string;
  description: string | null;
  isPrivate: boolean;
  language: string | null;
  starsCount: number;
  forksCount: number;
}

/**
 * Why the repository list looks the way it does.
 *
 * An empty list under the GitHub App flow is ambiguous on its own — it can mean
 * the app was never installed, or that it was installed with no repositories
 * selected. The backend resolves that so the UI can say which, instead of
 * claiming the account has no repositories.
 */
export type GitHubAccessState = "granted" | "not_installed" | "no_repositories_selected";

export interface GitHubReposResponse {
  repositories: GitHubRepoOption[];
  accessState: GitHubAccessState;
  installationCount: number;
  /** Install screen for a new installation, configuration page for an existing one. */
  installationUrl: string;
}

/** Richer GitHub account snapshot returned by the sync endpoints (never the token). */
export interface GitHubAccountSummary {
  id: string;
  username: string;
  profileUrl: string | null;
  avatarUrl: string | null;
  totalRepos: number;
  totalStars: number;
  totalFollowers: number;
  totalFollowing: number;
  lastSyncedAt: string | null;
}

/** Normalized result of a GitHub sync (POST /repositories/sync, /auth/github/sync). */
export interface RepositorySyncSummary {
  user: {
    id: string;
    email: string;
    name: string | null;
    avatarUrl: string | null;
    githubUsername: string;
  };
  githubAccount: GitHubAccountSummary;
  repositoriesSynced: number;
  /** True when GitHub had more pages than the sync walked (very large accounts). */
  truncated: boolean;
  lastSyncedAt: string;
}

export interface RepositoryResponse {
  repository: Repository;
}

export interface AnalysisResponse {
  analysis: RepositoryAnalysis;
}

export interface Developer360Response {
  overview: Developer360Overview;
}

/* ── AI insights (GET /ai/insights) ───────────────────── */

export type InsightPriority = "HIGH" | "MEDIUM" | "LOW";

export interface InsightStrength {
  title: string;
  detail: string;
}

export interface InsightRisk {
  title: string;
  severity: InsightPriority;
  detail: string;
}

export interface InsightRecommendation {
  title: string;
  rationale: string;
  priority: InsightPriority;
}

export interface AiInsights {
  summary: string;
  strengths: InsightStrength[];
  risks: InsightRisk[];
  recommendations: InsightRecommendation[];
}

/**
 * Mirrors AiInsightsResult in Backend/src/services/ai.service.ts.
 *
 * `hasEvidence` is false when the user has no COMPLETED analyses; the backend
 * deliberately skips the model call in that case, so `insights` is null and the
 * page must render an empty state rather than anything score-shaped.
 */
export interface AiInsightsResponse {
  hasEvidence: boolean;
  insights: AiInsights | null;
  evidence: {
    repositoriesAnalyzed: number;
    /** null when nothing has been analyzed — never coerce to 0. */
    averageScore: number | null;
  };
}
/* ── Certifications (GET/POST/PATCH/DELETE /certifications) ── */

/**
 * A user-recorded professional certification. Every field except name and
 * issuer is optional — the backend stores null when the user omits them.
 */
export interface Certification {
  id: string;
  name: string;
  issuer: string;
  credentialId: string | null;
  credentialUrl: string | null;
  /** ISO timestamp, or null when the user did not date the credential. */
  issueDate: string | null;
  createdAt: string;
}

/** Payload for POST/PATCH /certifications — only name and issuer are required. */
export interface CertificationInput {
  name: string;
  issuer: string;
  credentialId?: string;
  credentialUrl?: string;
  /** ISO date string; omitted/null becomes null on the backend. */
  issueDate?: string;
}

/**
 * Result of adding/updating a certification. `promotedSkills` reports which
 * skills moved up the evidence ladder as a result, so the UI can explain the
 * change instead of letting the skill list quietly differ.
 */
export interface CertificationMutationResponse {
  certification: Certification;
  promotedSkills: string[];
}

export interface CertificationsResponse {
  certifications: Certification[];
}

/* ── Coding profiles (GET /coding-profiles) ───────────── */

export type CodingPlatform = "LEETCODE" | "GEEKSFORGEEKS";

/** One recent accepted solve. difficulty/topic are null if the lookup failed. */
export interface RecentSolve {
  title: string;
  url: string;
  solvedAt: string;
  difficulty: string | null;
  topic: string | null;
}

/**
 * Platform-specific detail the backend stores as JSON.
 *
 * Present for LeetCode; other platforms may populate only part of it, so every
 * member is treated as possibly absent at the call site.
 */
export interface CodingProfileRawStats {
  /** ISO date -> submissions that day. */
  submissionCalendar?: Record<string, number>;
  totalAvailable?: { easy: number | null; medium: number | null; hard: number | null };
  topics?: { tag: string; solved: number }[];
  languages?: { language: string; solved: number }[];
  recentSolves?: RecentSolve[];
}

/**
 * A linked competitive-programming profile.
 *
 * Solve counts are always numbers because "solved nothing" is measurable.
 * Everything else is nullable: platforms differ in what they expose, and null
 * means "not reported", which must never render as a zero.
 */
export interface CodingProfile {
  id: string;
  platform: CodingPlatform;
  handle: string;
  profileUrl: string | null;
  totalSolved: number;
  easySolved: number;
  mediumSolved: number;
  hardSolved: number;
  acceptanceRate: number | null;
  ranking: number | null;
  rating: number | null;
  contestsAttended: number | null;
  globalRanking: number | null;
  topPercentage: number | null;
  streakDays: number | null;
  totalActiveDays: number | null;
  rawStats: CodingProfileRawStats | null;
  lastSyncedAt: string | null;
}

export interface CodingProfilesResponse {
  profiles: CodingProfile[];
}

export interface CodingProfileResponse {
  profile: CodingProfile;
}

/* ── Resume (GET/POST /resume) ────────────────────────── */

/** Text found under each recognised heading. Absent keys were not found. */
export interface ResumeParsed {
  sections: Record<string, string>;
  /**
   * Technologies mentioned in the resume text.
   *
   * Reported for the user to confirm — never written as skills. A resume
   * mentions tools in passing, often describing a team's stack.
   */
  detectedSkills: string[];
  wordCount: number;
}

export interface ResumeSummary {
  id: string;
  fileName: string;
  fileSize: number;
  pageCount: number | null;
  parsed: ResumeParsed | null;
  /** Set when the PDF could not be read — a scan, usually. File is still kept. */
  parseError: string | null;
  uploadedAt: string;
}

export interface ResumeResponse {
  resume: ResumeSummary | null;
}

export interface ResumeUploadResponse {
  resume: ResumeSummary;
  parsed: ResumeParsed | null;
  parseError: string | null;
}
