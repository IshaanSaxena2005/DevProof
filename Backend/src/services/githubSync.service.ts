import { prisma } from '../config/database';
import { AppError } from '../utils/appError';
import { GitHubService, GitHubRepoDetails } from './github.service';

/** GitHub account fields safe to return to the client (access token excluded). */
export interface SafeGitHubAccountSummary {
  id: string;
  username: string;
  profileUrl: string | null;
  avatarUrl: string | null;
  totalRepos: number;
  totalStars: number;
  totalFollowers: number;
  totalFollowing: number;
  lastSyncedAt: Date | null;
}

export interface RepositorySyncSummary {
  user: {
    id: string;
    email: string;
    name: string | null;
    avatarUrl: string | null;
    githubUsername: string;
  };
  githubAccount: SafeGitHubAccountSummary;
  repositoriesSynced: number;
  /** True when the MAX_REPO_PAGES cap stopped the walk before GitHub ran out of pages. */
  truncated: boolean;
  lastSyncedAt: Date;
}

/** Insert-or-update size for repository upserts, to bound concurrent DB work. */
const UPSERT_BATCH_SIZE = 20;

/** ISO string -> Date, or null. Guards against malformed timestamps. */
function toDate(iso: string | null): Date | null {
  if (!iso) return null;
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? null : d;
}

export class GitHubSyncService {
  /**
   * Full GitHub sync for one DevProof user:
   *   profile → repositories (paginated) → upsert account metadata + repos.
   *
   * Every repository is written with the *authenticated* user's id via the
   * `(userId, fullName)` unique key, so a repo can never be attached to — or
   * surfaced under — a different DevProof account.
   *
   * @throws 400 when the user has no linked GitHub account.
   * @throws 401 when the stored token has been revoked (surfaced cleanly).
   */
  static async syncUser(userId: string): Promise<RepositorySyncSummary> {
    const account = await prisma.gitHubAccount.findUnique({
      where: { userId },
      include: { user: true }
    });

    if (!account) {
      throw AppError.badRequest('No GitHub account is linked. Connect GitHub before syncing.');
    }

    // 1. Fresh profile (also the earliest point a revoked token surfaces).
    const profile = await GitHubService.fetchAuthenticatedProfile(account.accessToken);

    // 2. Every repository, across all pages.
    const { repos, truncated } = await GitHubService.fetchUserRepos(account.accessToken);

    // Total stars is summed over repositories *owned* by this GitHub user, so a
    // collaborator/org repo's stars are not miscounted as the user's own impact.
    const ownedRepos = repos.filter((r) => r.owner.toLowerCase() === profile.login.toLowerCase());
    const totalStars = ownedRepos.reduce((sum, r) => sum + r.starsCount, 0);

    const now = new Date();

    // 3. Refresh account metadata. totalRepos keeps its existing "public repos"
    //    meaning (as shown in Settings); the true synced count is returned separately.
    const updatedAccount = await prisma.gitHubAccount.update({
      where: { userId },
      data: {
        githubId: profile.githubId,
        username: profile.login,
        profileUrl: profile.profileUrl,
        avatarUrl: profile.avatarUrl,
        totalRepos: profile.publicRepos,
        totalStars,
        totalFollowers: profile.followers,
        totalFollowing: profile.following,
        lastSyncedAt: now
      }
    });

    // 4. Upsert repositories, scoped to this user. Batched to bound the number
    //    of concurrent DB round-trips on very large accounts.
    for (let i = 0; i < repos.length; i += UPSERT_BATCH_SIZE) {
      const batch = repos.slice(i, i + UPSERT_BATCH_SIZE);
      await Promise.all(batch.map((repo) => this.upsertRepository(userId, account.id, repo)));
    }

    return {
      user: {
        id: account.user.id,
        email: account.user.email,
        name: account.user.name,
        avatarUrl: account.user.avatarUrl,
        githubUsername: profile.login
      },
      githubAccount: this.toSafeAccount(updatedAccount),
      repositoriesSynced: repos.length,
      truncated,
      lastSyncedAt: now
    };
  }

  /**
   * Upsert a single repository for a user. The composite `(userId, fullName)`
   * key is what keeps repositories partitioned per DevProof user.
   */
  private static upsertRepository(userId: string, githubAccountId: string, repo: GitHubRepoDetails) {
    const shared = {
      githubRepoId: repo.githubRepoId,
      name: repo.name,
      owner: repo.owner,
      url: repo.url,
      description: repo.description,
      isPrivate: repo.isPrivate,
      isFork: repo.isFork,
      isArchived: repo.isArchived,
      defaultBranch: repo.defaultBranch,
      language: repo.language,
      topics: repo.topics,
      starsCount: repo.starsCount,
      forksCount: repo.forksCount,
      watchersCount: repo.watchersCount,
      openIssuesCount: repo.openIssuesCount,
      sizeKb: repo.sizeKb,
      githubCreatedAt: toDate(repo.githubCreatedAt),
      githubUpdatedAt: toDate(repo.githubUpdatedAt),
      pushedAt: toDate(repo.pushedAt)
    };

    return prisma.repository.upsert({
      where: { userId_fullName: { userId, fullName: repo.fullName } },
      create: {
        userId,
        githubAccountId,
        fullName: repo.fullName,
        ...shared
      },
      // Never rewrite userId on update — ownership is fixed by the where clause.
      update: {
        githubAccountId,
        ...shared
      }
    });
  }

  /** Strip the access token before an account ever leaves the service layer. */
  private static toSafeAccount(account: {
    id: string;
    username: string;
    profileUrl: string | null;
    avatarUrl: string | null;
    totalRepos: number;
    totalStars: number;
    totalFollowers: number;
    totalFollowing: number;
    lastSyncedAt: Date | null;
  }): SafeGitHubAccountSummary {
    return {
      id: account.id,
      username: account.username,
      profileUrl: account.profileUrl,
      avatarUrl: account.avatarUrl,
      totalRepos: account.totalRepos,
      totalStars: account.totalStars,
      totalFollowers: account.totalFollowers,
      totalFollowing: account.totalFollowing,
      lastSyncedAt: account.lastSyncedAt
    };
  }
}
