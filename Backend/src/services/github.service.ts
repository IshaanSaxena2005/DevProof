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
   * List repositories the authenticated GitHub user owns or collaborates on.
   */
  static async fetchUserRepos(accessToken: string): Promise<GitHubRepoDetails[]> {
    const headers: Record<string, string> = {
      'User-Agent': 'DevProof-Analysis-Engine',
      Accept: 'application/vnd.github.v3+json',
      Authorization: `Bearer ${accessToken}`
    };

    try {
      const response = await fetch(
        'https://api.github.com/user/repos?sort=updated&per_page=100&affiliation=owner,collaborator,organization_member',
        { headers }
      );

      if (!response.ok) {
        throw AppError.badRequest(`GitHub API returned status ${response.status}`);
      }

      const data = await response.json() as any[];

      return data.map((repo) => ({
        owner: repo.owner?.login ?? '',
        name: repo.name,
        fullName: repo.full_name,
        url: repo.html_url,
        description: repo.description || null,
        defaultBranch: repo.default_branch || 'main',
        isPrivate: Boolean(repo.private),
        language: repo.language || null,
        starsCount: repo.stargazers_count || 0,
        forksCount: repo.forks_count || 0,
        sizeKb: repo.size || 0,
        topics: repo.topics || []
      }));
    } catch (error) {
      if (error instanceof AppError) throw error;
      throw AppError.internal(`Failed to fetch GitHub repositories: ${(error as Error).message}`);
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
      // Resolve the branch first. The tree endpoint expects a tree SHA, not a
      // branch name, so using the branch directly would silently break analysis.
      const branchResponse = await fetch(
        `https://api.github.com/repos/${owner}/${repo}/branches/${encodeURIComponent(branch)}`,
        { headers }
      );

      if (!branchResponse.ok) {
        if (branchResponse.status === 404) {
          throw AppError.notFound(`Branch "${branch}" was not found for ${owner}/${repo}.`);
        }

        if (branchResponse.status === 403) {
          throw AppError.forbidden(`GitHub denied access to ${owner}/${repo}. Check repository permissions or token scopes.`);
        }

        throw AppError.badRequest(`GitHub branch lookup failed with status ${branchResponse.status}`);
      }

      const branchData = await branchResponse.json() as any;
      const treeSha = branchData?.commit?.commit?.tree?.sha;
      if (!treeSha) {
        throw AppError.internal(`GitHub branch ${branch} for ${owner}/${repo} did not return a tree SHA.`);
      }

      const response = await fetch(
        `https://api.github.com/repos/${owner}/${repo}/git/trees/${treeSha}?recursive=1`,
        { headers }
      );

      if (!response.ok) {
        if (response.status === 404) {
          throw AppError.notFound(`Repository tree for ${owner}/${repo} on branch "${branch}" was not found.`);
        }

        if (response.status === 403) {
          throw AppError.forbidden(`GitHub denied access to the file tree for ${owner}/${repo}. Check repository permissions or token scopes.`);
        }

        throw AppError.badRequest(`GitHub tree lookup failed with status ${response.status}`);
      }

      const data = await response.json() as any;
      return (data.tree || []) as Array<{ path: string; mode: string; type: string; sha: string; size?: number }>;
    } catch (error) {
      if (error instanceof AppError) throw error;
      throw AppError.internal(`Failed to fetch repository tree for ${owner}/${repo}: ${(error as Error).message}`);
    }
  }

  /**
   * Fetch specific raw file content from repository
   */
  static async fetchRawFileContent(owner: string, repo: string, filePath: string, branch = 'main', accessToken?: string): Promise<string | null> {
    const headers: Record<string, string> = {
      'User-Agent': 'DevProof-Analysis-Engine',
      Accept: 'application/vnd.github+json'
    };
    if (accessToken) headers['Authorization'] = `Bearer ${accessToken}`;

    try {
      const encodedPath = filePath
        .split('/')
        .map((segment) => encodeURIComponent(segment))
        .join('/');

      const response = await fetch(
        `https://api.github.com/repos/${owner}/${repo}/contents/${encodedPath}?ref=${encodeURIComponent(branch)}`,
        { headers }
      );

      if (response.status === 404) {
        return null;
      }

      if (response.status === 403) {
        throw AppError.forbidden(`GitHub denied access to ${owner}/${repo}/${filePath}. Check repository permissions or token scopes.`);
      }

      if (!response.ok) {
        throw AppError.badRequest(`GitHub file content lookup failed for ${owner}/${repo}/${filePath} with status ${response.status}`);
      }

      const data = await response.json() as any;
      if (!data || Array.isArray(data) || data.type !== 'file') {
        return null;
      }

      if (data.encoding === 'base64' && typeof data.content === 'string') {
        return Buffer.from(data.content.replace(/\s/g, ''), 'base64').toString('utf8');
      }

      if (typeof data.content === 'string') {
        return data.content;
      }

      return null;
    } catch (error) {
      if (error instanceof AppError) throw error;
      throw AppError.internal(`Failed to fetch repository content for ${owner}/${repo}/${filePath}: ${(error as Error).message}`);
    }
  }
}
