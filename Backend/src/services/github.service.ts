import { AppError } from '../utils/appError';

export interface GitHubRepoDetails {
  owner: string;
  name: string;
  fullName: string;
  url: string;
  description: string | null;
  defaultBranch: string;
  isPrivate: boolean;
  language: string | null;
  starsCount: number;
  forksCount: number;
  sizeKb: number;
  topics: string[];
}

export class GitHubService {
  /**
   * Parse owner and repository name from public GitHub URL
   * Accepts: https://github.com/owner/repo, owner/repo
   */
  static parseRepoUrl(url: string): { owner: string; name: string } {
    const cleanUrl = url.trim().replace(/\/$/, '');
    
    if (cleanUrl.includes('github.com')) {
      const match = cleanUrl.match(/github\.com\/([^\/]+)\/([^\/]+)/);
      if (match && match[1] && match[2]) {
        return { owner: match[1], name: match[2].replace(/\.git$/, '') };
      }
    } else if (cleanUrl.includes('/')) {
      const parts = cleanUrl.split('/');
      if (parts.length === 2 && parts[0] && parts[1]) {
        return { owner: parts[0], name: parts[1].replace(/\.git$/, '') };
      }
    }

    throw AppError.badRequest('Invalid GitHub repository URL format. Example: https://github.com/owner/repo');
  }

  /**
   * Fetch repository metadata from GitHub API
   */
  static async fetchRepoMetadata(owner: string, repo: string, accessToken?: string): Promise<GitHubRepoDetails> {
    const headers: Record<string, string> = {
      'User-Agent': 'DevProof-Analysis-Engine',
      Accept: 'application/vnd.github.v3+json'
    };

    if (accessToken) {
      headers['Authorization'] = `Bearer ${accessToken}`;
    }

    try {
      const response = await fetch(`https://api.github.com/repos/${owner}/${repo}`, { headers });
      
      if (response.status === 404) {
        throw AppError.notFound(`Repository ${owner}/${repo} was not found on GitHub or is private.`);
      }

      if (!response.ok) {
        throw AppError.badRequest(`GitHub API returned status ${response.status}`);
      }

      const data = await response.json() as any;

      return {
        owner: data.owner?.login || owner,
        name: data.name || repo,
        fullName: data.full_name || `${owner}/${repo}`,
        url: data.html_url || `https://github.com/${owner}/${repo}`,
        description: data.description || null,
        defaultBranch: data.default_branch || 'main',
        isPrivate: Boolean(data.private),
        language: data.language || null,
        starsCount: data.stargazers_count || 0,
        forksCount: data.forks_count || 0,
        sizeKb: data.size || 0,
        topics: data.topics || []
      };
    } catch (error) {
      if (error instanceof AppError) throw error;
      throw AppError.internal(`Failed to fetch repository metadata: ${(error as Error).message}`);
    }
  }

  /**
   * Fetch repository file tree
   */
  static async fetchRepoTree(owner: string, repo: string, branch = 'main', accessToken?: string) {
    const headers: Record<string, string> = {
      'User-Agent': 'DevProof-Analysis-Engine',
      Accept: 'application/vnd.github.v3+json'
    };
    if (accessToken) headers['Authorization'] = `Bearer ${accessToken}`;

    try {
      const response = await fetch(
        `https://api.github.com/repos/${owner}/${repo}/git/trees/${branch}?recursive=1`,
        { headers }
      );

      if (!response.ok) {
        return [];
      }

      const data = await response.json() as any;
      return (data.tree || []) as Array<{ path: string; mode: string; type: string; sha: string; size?: number }>;
    } catch (error) {
      return [];
    }
  }

  /**
   * Fetch specific raw file content from repository
   */
  static async fetchRawFileContent(owner: string, repo: string, filePath: string, branch = 'main', accessToken?: string): Promise<string | null> {
    const headers: Record<string, string> = {
      'User-Agent': 'DevProof-Analysis-Engine'
    };
    if (accessToken) headers['Authorization'] = `Bearer ${accessToken}`;

    try {
      const rawUrl = `https://raw.githubusercontent.com/${owner}/${repo}/${branch}/${filePath}`;
      const response = await fetch(rawUrl, { headers });
      if (!response.ok) return null;
      return await response.text();
    } catch (error) {
      return null;
    }
  }
}
