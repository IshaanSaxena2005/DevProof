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
  defaultBranch: string;
  language: string | null;
  starsCount: number;
  forksCount: number;
  sizeKb: number;
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
}

/* ── Response envelopes (the `data` field of each endpoint) ── */

export interface AuthResponse {
  user: User;
  token: string;
}

export interface MeResponse {
  user: User;
}

export interface RepositoriesResponse {
  repositories: Repository[];
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
