import { api } from "../lib/api";
import type {
  GitHubReposResponse,
  RepositoriesResponse,
  RepositoryResponse,
  RepositorySyncSummary,
} from "../lib/types";

export const githubService = {
  async getRepositories(): Promise<RepositoriesResponse> {
    return api.get<RepositoriesResponse>("/repositories");
  },

  async listGitHubRepos(): Promise<GitHubReposResponse> {
    return api.get<GitHubReposResponse>("/repositories/github");
  },

  async getRepository(repoId: string): Promise<RepositoryResponse> {
    return api.get<RepositoryResponse>(`/repositories/${repoId}`);
  },

  async connectRepository(repoUrl: string): Promise<void> {
    await api.post("/repositories/connect", { repoUrl });
  },

  async deleteRepository(repoId: string): Promise<void> {
    await api.delete(`/repositories/${repoId}`);
  },

  async triggerAnalysis(repoId: string): Promise<void> {
    await api.post("/analysis/trigger", { repositoryId: repoId });
  },

  /**
   * Sync the linked GitHub profile *and* repositories into DevProof, returning a
   * normalized summary. Prefer this over syncGithub() on repository-centric
   * screens — both hit the same engine, but this route reads as "sync repos".
   */
  async syncRepositories(): Promise<RepositorySyncSummary> {
    return api.post<RepositorySyncSummary>("/repositories/sync");
  },

  /** Sync via the auth route; identical engine and result to syncRepositories(). */
  async syncGithub(): Promise<RepositorySyncSummary> {
    return api.post<RepositorySyncSummary>("/auth/github/sync");
  },

  async disconnectGithub(): Promise<void> {
    await api.post("/auth/github/disconnect");
  },
};
