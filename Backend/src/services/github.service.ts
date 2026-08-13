import { AppError } from '../utils/appError';

export interface GitHubRepoDetails {
  /** GitHub's own numeric repository id, as a string. */
  githubRepoId: string | null;
  owner: string;
  name: string;
  fullName: string;
  url: string;
  description: string | null;
  defaultBranch: string;
  isPrivate: boolean;
  isFork: boolean;
  isArchived: boolean;
  language: string | null;
  starsCount: number;
  forksCount: number;
  watchersCount: number;
  openIssuesCount: number;
  sizeKb: number;
  topics: string[];
  /** GitHub timestamps (ISO strings), null when GitHub omitted them. */
  githubCreatedAt: string | null;
  githubUpdatedAt: string | null;
  pushedAt: string | null;
}

export interface GitHubProfile {
  githubId: string;
  login: string;
  name: string | null;
  email: string | null;
  avatarUrl: string;
  profileUrl: string;
  publicRepos: number;
  followers: number;
  following: number;
}

const GITHUB_API = 'https://api.github.com';

/**
 * Hard ceiling on how many repository pages a single sync will walk. At the
 * per_page=100 used below this covers 1,000 repositories, which is well beyond
 * any realistic personal account, and — crucially — guarantees the pagination
 * loop terminates even if GitHub ever returns a non-decreasing page.
 */
const MAX_REPO_PAGES = 10;
const REPOS_PER_PAGE = 100;

export class GitHubService {
  /** Standard request headers. The token, when present, never appears in any thrown message. */
  private static headers(accessToken?: string, accept = 'application/vnd.github.v3+json'): Record<string, string> {
    const headers: Record<string, string> = {
      'User-Agent': 'DevProof-Analysis-Engine',
      Accept: accept
    };
    if (accessToken) headers['Authorization'] = `Bearer ${accessToken}`;
    return headers;
  }

  /**
   * Perform a GitHub request, translating network-level failures into a clean
   * 503. Callers still decide what a non-OK *status* means via {@link assertOk}.
   */
  private static async request(url: string, headers: Record<string, string>): Promise<Response> {
    try {
      return await fetch(url, { headers });
    } catch (error) {
      // fetch only rejects on DNS/TLS/connection failure or timeout — never a 4xx/5xx.
      throw AppError.serviceUnavailable(
        `Unable to reach GitHub. Check network access and proxy settings. ${(error as Error).message}`
      );
    }
  }

  /**
   * Map a non-OK GitHub response to a clean AppError. Deliberately generic:
   * GitHub's raw error bodies (and never any token) are not forwarded to the
   * client. `context` describes the operation for the message only.
   */
  private static assertOk(response: Response, context: string): void {
    if (response.ok) return;

    const status = response.status;

    if (status === 401) {
      throw AppError.unauthorized(
        'GitHub authorization is invalid or has been revoked. Please reconnect your GitHub account.'
      );
    }

    // GitHub signals rate limiting with 403 + a zeroed remaining counter, or 429.
    const remaining = response.headers.get('x-ratelimit-remaining');
    if (status === 429 || (status === 403 && remaining === '0')) {
      const resetHeader = response.headers.get('x-ratelimit-reset');
      const resetSuffix = resetHeader
        ? ` Try again after ${new Date(Number(resetHeader) * 1000).toISOString()}.`
        : ' Please try again later.';
      throw AppError.serviceUnavailable(`GitHub API rate limit exceeded.${resetSuffix}`);
    }

    if (status === 403) {
      throw AppError.forbidden(
        `GitHub denied access while ${context}. Check the repository permissions or token scopes.`
      );
    }

    if (status === 404) {
      throw AppError.notFound(`GitHub could not find the resource while ${context}.`);
    }

    if (status >= 500) {
      throw AppError.serviceUnavailable(`GitHub API is currently unavailable (status ${status}).`);
    }

    throw AppError.badRequest(`GitHub request failed while ${context} (status ${status}).`);
  }

  /** Parse a GitHub JSON body, converting malformed payloads into a clean error. */
  private static async parseJson<T>(response: Response, context: string): Promise<T> {
    try {
      return (await response.json()) as T;
    } catch {
      throw AppError.serviceUnavailable(`GitHub returned a malformed response while ${context}.`);
    }
  }

  /** Normalize a GitHub repo payload (list or single) into our internal shape. */
  private static mapRepo(repo: any, fallbackOwner = '', fallbackName = ''): GitHubRepoDetails {
    return {
      githubRepoId: repo?.id != null ? String(repo.id) : null,
      owner: repo?.owner?.login ?? fallbackOwner,
      name: repo?.name ?? fallbackName,
      fullName: repo?.full_name ?? `${fallbackOwner}/${fallbackName}`,
      url: repo?.html_url ?? `https://github.com/${fallbackOwner}/${fallbackName}`,
      description: repo?.description ?? null,
      defaultBranch: repo?.default_branch ?? 'main',
      isPrivate: Boolean(repo?.private),
      isFork: Boolean(repo?.fork),
      isArchived: Boolean(repo?.archived),
      language: repo?.language ?? null,
      starsCount: Number(repo?.stargazers_count) || 0,
      forksCount: Number(repo?.forks_count) || 0,
      watchersCount: Number(repo?.watchers_count) || 0,
      openIssuesCount: Number(repo?.open_issues_count) || 0,
      sizeKb: Number(repo?.size) || 0,
      topics: Array.isArray(repo?.topics) ? repo.topics.filter((t: unknown) => typeof t === 'string') : [],
      githubCreatedAt: typeof repo?.created_at === 'string' ? repo.created_at : null,
      githubUpdatedAt: typeof repo?.updated_at === 'string' ? repo.updated_at : null,
      pushedAt: typeof repo?.pushed_at === 'string' ? repo.pushed_at : null
    };
  }

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
   * Fetch the profile of the user the access token authenticates as.
   */
  static async fetchAuthenticatedProfile(accessToken: string): Promise<GitHubProfile> {
    const response = await this.request(`${GITHUB_API}/user`, this.headers(accessToken));
    this.assertOk(response, 'loading your GitHub profile');
    const data = await this.parseJson<any>(response, 'loading your GitHub profile');

    if (!data || data.id == null || !data.login) {
      throw AppError.serviceUnavailable('GitHub returned an incomplete profile response.');
    }

    return {
      githubId: String(data.id),
      login: data.login,
      name: data.name ?? null,
      email: data.email ?? null,
      avatarUrl: data.avatar_url ?? '',
      profileUrl: data.html_url ?? `https://github.com/${data.login}`,
      publicRepos: Number(data.public_repos) || 0,
      followers: Number(data.followers) || 0,
      following: Number(data.following) || 0
    };
  }

  /**
   * Fetch repository metadata from GitHub API
   */
  static async fetchRepoMetadata(owner: string, repo: string, accessToken?: string): Promise<GitHubRepoDetails> {
    const response = await this.request(`${GITHUB_API}/repos/${owner}/${repo}`, this.headers(accessToken));

    if (response.status === 404) {
      throw AppError.notFound(`Repository ${owner}/${repo} was not found on GitHub or is private.`);
    }
    this.assertOk(response, `loading ${owner}/${repo}`);

    const data = await this.parseJson<any>(response, `loading ${owner}/${repo}`);
    return this.mapRepo(data, owner, repo);
  }

  /**
   * List every repository the authenticated GitHub user owns or collaborates on.
   *
   * Walks GitHub's pagination rather than returning only the first page: keeps
   * requesting successive pages until a short page arrives (the last one) or the
   * {@link MAX_REPO_PAGES} safety cap is hit. Returns whether the cap truncated
   * the result so the caller can report it instead of silently claiming a full sync.
   */
  static async fetchUserRepos(
    accessToken: string
  ): Promise<{ repos: GitHubRepoDetails[]; truncated: boolean }> {
    const repos: GitHubRepoDetails[] = [];
    let page = 1;
    let truncated = false;

    // eslint-disable-next-line no-constant-condition
    while (true) {
      const url =
        `${GITHUB_API}/user/repos?sort=updated&per_page=${REPOS_PER_PAGE}&page=${page}` +
        `&affiliation=owner,collaborator,organization_member`;
      const response = await this.request(url, this.headers(accessToken));
      this.assertOk(response, 'listing your repositories');

      const data = await this.parseJson<any>(response, 'listing your repositories');
      if (!Array.isArray(data)) {
        throw AppError.serviceUnavailable('GitHub returned an unexpected repositories payload.');
      }

      for (const repo of data) {
        repos.push(this.mapRepo(repo));
      }

      // A page shorter than the page size is the last page.
      if (data.length < REPOS_PER_PAGE) break;

      page += 1;
      if (page > MAX_REPO_PAGES) {
        truncated = true;
        break;
      }
    }

    return { repos, truncated };
  }

  /**
   * Fetch repository file tree
   */
  static async fetchRepoTree(owner: string, repo: string, branch = 'main', accessToken?: string) {
    const headers = this.headers(accessToken);

    // Resolve the branch first. The tree endpoint expects a tree SHA, not a
    // branch name, so using the branch directly would silently break analysis.
    const branchResponse = await this.request(
      `${GITHUB_API}/repos/${owner}/${repo}/branches/${encodeURIComponent(branch)}`,
      headers
    );

    if (branchResponse.status === 404) {
      throw AppError.notFound(`Branch "${branch}" was not found for ${owner}/${repo}.`);
    }
    this.assertOk(branchResponse, `resolving branch "${branch}" for ${owner}/${repo}`);

    const branchData = await this.parseJson<any>(branchResponse, `resolving branch "${branch}"`);
    const treeSha = branchData?.commit?.commit?.tree?.sha;
    if (!treeSha) {
      throw AppError.internal(`GitHub branch ${branch} for ${owner}/${repo} did not return a tree SHA.`);
    }

    const response = await this.request(
      `${GITHUB_API}/repos/${owner}/${repo}/git/trees/${treeSha}?recursive=1`,
      headers
    );

    if (response.status === 404) {
      throw AppError.notFound(`Repository tree for ${owner}/${repo} on branch "${branch}" was not found.`);
    }
    this.assertOk(response, `reading the file tree for ${owner}/${repo}`);

    const data = await this.parseJson<any>(response, `reading the file tree for ${owner}/${repo}`);
    return (data.tree || []) as Array<{ path: string; mode: string; type: string; sha: string; size?: number }>;
  }

  /**
   * Fetch specific raw file content from repository
   */
  static async fetchRawFileContent(owner: string, repo: string, filePath: string, branch = 'main', accessToken?: string): Promise<string | null> {
    const headers = this.headers(accessToken, 'application/vnd.github+json');

    const encodedPath = filePath
      .split('/')
      .map((segment) => encodeURIComponent(segment))
      .join('/');

    const response = await this.request(
      `${GITHUB_API}/repos/${owner}/${repo}/contents/${encodedPath}?ref=${encodeURIComponent(branch)}`,
      headers
    );

    if (response.status === 404) {
      return null;
    }
    this.assertOk(response, `reading ${owner}/${repo}/${filePath}`);

    const data = await this.parseJson<any>(response, `reading ${owner}/${repo}/${filePath}`);
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
  }
}
