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

export interface GitHubReposResponse {
  repositories: GitHubRepoOption[];
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
