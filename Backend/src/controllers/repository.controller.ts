import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from '../middlewares/auth.middleware';
import { GitHubService } from '../services/github.service';
import { GitHubSyncService } from '../services/githubSync.service';
import { prisma } from '../config/database';
import { successResponse } from '../utils/apiResponse';
import { AppError } from '../utils/appError';

/** ISO string -> Date, or null. Guards against malformed timestamps. */
function toDate(iso: string | null): Date | null {
  if (!iso) return null;
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? null : d;
}

export class RepositoryController {
  /**
   * Sync the authenticated user's GitHub profile and repositories into DevProof.
   * Returns a normalized summary; the GitHub access token is never included.
   */
  static syncRepositories = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const user = req.user!;
      if (!user.githubAccount) {
        throw AppError.badRequest('No GitHub account is linked. Connect GitHub before syncing.');
      }

      const summary = await GitHubSyncService.syncUser(user.id);

      return successResponse(res, 200, 'GitHub repositories synchronized successfully', summary);
    } catch (error) {
      next(error);
    }
  };
  /**
   * Connect and track a new public/authenticated repository
   */
  static connectRepository = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const user = req.user!;
      const { repoUrl } = req.body;

      if (!repoUrl) {
        throw AppError.badRequest('repoUrl is required');
      }

      const { owner, name } = GitHubService.parseRepoUrl(repoUrl);
      const accessToken = user.githubAccount?.accessToken;

      const metadata = await GitHubService.fetchRepoMetadata(owner, name, accessToken);

      // Check if user already linked this repo
      let repo = await prisma.repository.findFirst({
        where: {
          userId: user.id,
          fullName: metadata.fullName
        }
      });

      if (repo) {
        // Update existing repository metadata
        repo = await prisma.repository.update({
          where: { id: repo.id },
          data: {
            githubRepoId: metadata.githubRepoId,
            description: metadata.description,
            defaultBranch: metadata.defaultBranch,
            isPrivate: metadata.isPrivate,
            isFork: metadata.isFork,
            isArchived: metadata.isArchived,
            language: metadata.language,
            topics: metadata.topics,
            starsCount: metadata.starsCount,
            forksCount: metadata.forksCount,
            watchersCount: metadata.watchersCount,
            openIssuesCount: metadata.openIssuesCount,
            sizeKb: metadata.sizeKb,
            githubCreatedAt: toDate(metadata.githubCreatedAt),
            githubUpdatedAt: toDate(metadata.githubUpdatedAt),
            pushedAt: toDate(metadata.pushedAt)
          }
        });
      } else {
        // Create repository entry
        repo = await prisma.repository.create({
          data: {
            userId: user.id,
            githubAccountId: user.githubAccount?.id || null,
            githubRepoId: metadata.githubRepoId,
            name: metadata.name,
            fullName: metadata.fullName,
            owner: metadata.owner,
            url: metadata.url,
            description: metadata.description,
            defaultBranch: metadata.defaultBranch,
            isPrivate: metadata.isPrivate,
            isFork: metadata.isFork,
            isArchived: metadata.isArchived,
            language: metadata.language,
            topics: metadata.topics,
            starsCount: metadata.starsCount,
            forksCount: metadata.forksCount,
            watchersCount: metadata.watchersCount,
            openIssuesCount: metadata.openIssuesCount,
            sizeKb: metadata.sizeKb,
            githubCreatedAt: toDate(metadata.githubCreatedAt),
            githubUpdatedAt: toDate(metadata.githubUpdatedAt),
            pushedAt: toDate(metadata.pushedAt)
          }
        });
      }

      return successResponse(res, 201, 'Repository connected successfully', { repository: repo });
    } catch (error) {
      next(error);
    }
  };

  /**
   * List the authenticated user's GitHub repositories (not yet necessarily connected)
   */
  static listGitHubRepos = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const user = req.user!;
      const accessToken = user.githubAccount?.accessToken;

      if (!accessToken) {
        throw AppError.badRequest('Link a GitHub account before browsing your repositories.');
      }

      const { repos, truncated } = await GitHubService.fetchUserRepos(accessToken);

      return successResponse(
        res,
        200,
        'GitHub repositories retrieved successfully',
        { repositories: repos },
        truncated ? { truncated: true } : undefined
      );
    } catch (error) {
      next(error);
    }
  };

  /**
   * List all connected user repositories
   */
  static getUserRepositories = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const user = req.user!;

      const repositories = await prisma.repository.findMany({
        where: { userId: user.id },
        include: {
          analyses: {
            orderBy: { createdAt: 'desc' },
            take: 1
          }
        },
        orderBy: { updatedAt: 'desc' }
      });

      return successResponse(res, 200, 'Repositories retrieved successfully', { repositories });
    } catch (error) {
      next(error);
    }
  };

  /**
   * Get single repository by ID
   */
  static getRepositoryById = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const user = req.user!;
      const { id } = req.params;

      const repository = await prisma.repository.findFirst({
        where: { id, userId: user.id },
        include: {
          analyses: {
            orderBy: { createdAt: 'desc' },
            include: {
              metrics: true,
              findings: true
            }
          }
        }
      });

      if (!repository) {
        throw AppError.notFound('Repository not found');
      }

      return successResponse(res, 200, 'Repository retrieved successfully', { repository });
    } catch (error) {
      next(error);
    }
  };

  /**
   * Delete repository tracking
   */
  static deleteRepository = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const user = req.user!;
      const { id } = req.params;

      const repo = await prisma.repository.findFirst({
        where: { id, userId: user.id }
      });

      if (!repo) {
        throw AppError.notFound('Repository not found');
      }

      await prisma.repository.delete({
        where: { id }
      });

      return successResponse(res, 200, 'Repository removed successfully');
    } catch (error) {
      next(error);
    }
  };
}
