import { api } from "../lib/api";
import type { GitHubReposResponse, RepositoriesResponse, RepositoryResponse } from "../lib/types";

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

  async syncGithub(): Promise<void> {
    await api.post("/auth/github/sync");
  },

  async disconnectGithub(): Promise<void> {
    await api.post("/auth/github/disconnect");
  },
};
