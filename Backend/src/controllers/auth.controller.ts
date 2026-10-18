import { Request, Response, NextFunction, CookieOptions } from 'express';
import crypto from 'crypto';
import { AuthService } from '../services/auth.service';
import { GitHubSyncService } from '../services/githubSync.service';
import { successResponse } from '../utils/apiResponse';
import { env } from '../config/env';
import { COOKIE_NAME, COOKIE_OPTIONS } from '../config/cookies';
import { AuthenticatedRequest } from '../middlewares/auth.middleware';
import { AppError } from '../utils/appError';
import { prisma } from '../config/database';

/** Fallback cookie lifetime used only if the token carries no `exp` claim. */
const FALLBACK_MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000;
const GITHUB_OAUTH_STATE_COOKIE = 'github_oauth_state';
const GITHUB_OAUTH_STATE_TTL_MS = 10 * 60 * 1000;

const OAUTH_STATE_COOKIE_OPTIONS: CookieOptions = {
  httpOnly: true,
  secure: env.NODE_ENV === 'production',
  sameSite: 'lax',
  path: '/api/v1/auth',
  maxAge: GITHUB_OAUTH_STATE_TTL_MS
};

/**
 * DevProof signs in as a **GitHub App**, whose client ids are prefixed `Iv1.`
 * (legacy) or `Iv23` (current). An OAuth App id is never prefixed this way.
 *
 * Both credential types are accepted by /login/oauth/authorize, so the wrong one
 * does not fail loudly — sign-in succeeds and the mismatch only surfaces later
 * as an account that can somehow see no repositories. The check below therefore
 * runs up front, and its sense is deliberately the opposite of what it was
 * while DevProof used the OAuth App flow: repositories are now enumerated per
 * installation (see github.service#fetchUserRepos), which an OAuth App has none of.
 */
const GITHUB_APP_CLIENT_ID_PREFIXES = ['Iv1.', 'Iv23'];

const GITHUB_TOKEN_URL = 'https://github.com/login/oauth/access_token';
const GITHUB_USER_URL = 'https://api.github.com/user';

type SerializableGitHubAccount = {
  id: string;
  username: string;
  profileUrl: string | null;
  avatarUrl: string | null;
  totalRepos: number;
  totalStars: number;
  totalFollowers: number;
  accessToken?: string;
};

type SerializableUser = {
  id: string;
  email: string;
  name: string | null;
  avatarUrl: string | null;
  role: string;
  createdAt?: Date;
  githubAccount?: SerializableGitHubAccount | null;
};

function sanitizeGitHubAccount(account: SerializableGitHubAccount | null | undefined) {
  if (!account) return null;

  const { accessToken: _accessToken, ...publicAccount } = account;
  return publicAccount;
}

function sanitizeUser(user: SerializableUser, includeCreatedAt = false) {
  return {
    id: user.id,
    email: user.email,
    name: user.name,
    avatarUrl: user.avatarUrl,
    role: user.role,
    githubAccount: sanitizeGitHubAccount(user.githubAccount),
    ...(includeCreatedAt ? { createdAt: user.createdAt } : {})
  };
}

export class AuthController {
  /**
   * Helper to attach httpOnly cookie
   */
  private static setTokenCookie(res: Response, token: string) {
    // Size the cookie from the token's own expiry so the two cannot drift apart
    // when JWT_EXPIRES_IN changes.
    const expiryMs = AuthService.getTokenExpiryMs(token);
    const maxAge = expiryMs ? Math.max(expiryMs - Date.now(), 0) : FALLBACK_MAX_AGE_MS;

    res.cookie(COOKIE_NAME, token, { ...COOKIE_OPTIONS, maxAge });
  }

  /**
   * Local email/password registration
   */
  static register = async (req: Request, res: Response, next: NextFunction) => {
    try {
      // Shape and presence are guaranteed by validateRequest(registerSchema) on
      // the route; email arrives trimmed and lower-cased.
      const { email, password, name } = req.body;

      const { user, token } = await AuthService.register({ email, password, name });
      AuthController.setTokenCookie(res, token);

      // The token is intentionally omitted from the JSON body — it is already
      // in the httpOnly cookie above and must not be accessible to JavaScript.
      return successResponse(res, 201, 'User registered successfully', {
        user: sanitizeUser(user, false)
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * Local email/password login
   */
  static login = async (req: Request, res: Response, next: NextFunction) => {
    try {
      // Guaranteed non-empty by validateRequest(loginSchema) on the route.
      const { email, password } = req.body;

      const { user, token } = await AuthService.login({ email, password });
      AuthController.setTokenCookie(res, token);

      // The token is intentionally omitted from the JSON body — it is already
      // in the httpOnly cookie above and must not be accessible to JavaScript.
      return successResponse(res, 200, 'Login successful', {
        user: sanitizeUser(user, false)
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * Get current logged-in user profile
   */
  static getMe = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const user = req.user;
      if (!user) {
        throw AppError.unauthorized('Not authenticated');
      }

      return successResponse(res, 200, 'Current user retrieved successfully', {
        user: sanitizeUser(user, true)
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * Ends a failed GitHub OAuth attempt on the login page instead of as JSON.
   *
   * Both GitHub endpoints are top-level browser navigations, not XHR: the user
   * physically follows a link to /auth/github and GitHub redirects back to
   * /auth/github/callback. Handing those a JSON error body strands the user on
   * the API origin with no markup and no way back. Login already renders
   * ?error= (see Frontend/src/pages/Login.tsx), so every failure returns there.
   *
   * The message is truncated because it can carry an upstream GitHub response
   * body, which is neither useful nor safe at URL length.
   */
  private static redirectToLoginWithError(res: Response, error: unknown) {
    const raw = error instanceof Error ? error.message : "";
    const message = raw.slice(0, 300) || "GitHub sign-in failed. Please try again.";
    return res.redirect(`${env.FRONTEND_URL}/login?error=${encodeURIComponent(message)}`);
  }

  /**
   * Initiate GitHub OAuth redirect
   */
  static githubOAuth = async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (!env.GITHUB_CLIENT_ID || !env.GITHUB_CLIENT_SECRET) {
        throw AppError.badRequest(
          'GitHub OAuth is not configured on this server. ' +
          'GITHUB_CLIENT_ID and GITHUB_CLIENT_SECRET must be set in the backend environment.'
        );
      }

      if (!GITHUB_APP_CLIENT_ID_PREFIXES.some((p) => env.GITHUB_CLIENT_ID.startsWith(p))) {
        throw AppError.badRequest(
          'GITHUB_CLIENT_ID does not look like a GitHub App client id (those start with "Iv"). ' +
          'DevProof signs in as a GitHub App — open https://github.com/settings/apps, pick your app, ' +
          'and copy its Client ID and a generated client secret.'
        );
      }

      const state = crypto.randomBytes(24).toString('hex');
      res.cookie(GITHUB_OAUTH_STATE_COOKIE, state, OAUTH_STATE_COOKIE_OPTIONS);

      const redirectUri = encodeURIComponent(env.GITHUB_CALLBACK_URL);
      // No `scope` parameter: a GitHub App ignores it outright and derives access
      // from the permissions granted when it was installed. Sending one would
      // imply a level of access this flow does not actually negotiate.
      const githubAuthUrl = `https://github.com/login/oauth/authorize?client_id=${env.GITHUB_CLIENT_ID}&redirect_uri=${redirectUri}&state=${state}`;

      return res.redirect(githubAuthUrl);
    } catch (error) {
      return AuthController.redirectToLoginWithError(res, error);
    }
  };

  /**
   * GitHub OAuth Callback Handler
   */
  static githubCallback = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { code } = req.query;
      const state = req.query.state;
      const stateCookie = req.cookies?.[GITHUB_OAUTH_STATE_COOKIE];

      res.clearCookie(GITHUB_OAUTH_STATE_COOKIE, OAUTH_STATE_COOKIE_OPTIONS);

      if (!code || typeof code !== 'string') {
        throw AppError.badRequest('Missing authorization code from GitHub');
      }

      if (!state || typeof state !== 'string') {
        throw AppError.badRequest('Missing OAuth state from GitHub callback');
      }

      if (!stateCookie || typeof stateCookie !== 'string' || stateCookie.length !== state.length) {
        throw AppError.unauthorized('GitHub OAuth state mismatch. Please try connecting again.');
      }

      if (!crypto.timingSafeEqual(Buffer.from(stateCookie), Buffer.from(state))) {
        throw AppError.unauthorized('GitHub OAuth state mismatch. Please try connecting again.');
      }

      // ── Determine if the user is already signed in ─────────────────────────
      // A credential-registered user clicking "Link GitHub" will have a valid
      // session cookie.  We pass their userId to handleGitHubOAuth so the new
      // GitHub account is linked to them rather than find-or-created by email.
      let existingUserId: string | undefined;
      const existingToken = req.cookies?.token as string | undefined;
      if (existingToken) {
        try {
          const decoded = AuthService.verifyToken(existingToken);
          existingUserId = decoded.userId;
        } catch {
          // Token invalid or expired — treat as unauthenticated.
        }
      }

      // Exchange code for access token using the documented form-encoded body.
      const tokenResponse = await fetch(GITHUB_TOKEN_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          Accept: 'application/json',
          'User-Agent': 'DevProof-Backend'
        },
        body: new URLSearchParams({
          client_id: env.GITHUB_CLIENT_ID,
          client_secret: env.GITHUB_CLIENT_SECRET,
          code,
          redirect_uri: env.GITHUB_CALLBACK_URL
        })
      }).catch((error: unknown) => {
        throw AppError.serviceUnavailable(
          `Unable to reach GitHub while exchanging the OAuth code. Check network access and proxy settings. ${(error as Error).message}`
        );
      });

      if (!tokenResponse.ok) {
        const body = await tokenResponse.text();
        throw AppError.badRequest(`GitHub OAuth token exchange failed with status ${tokenResponse.status}`, body);
      }

      const tokenData = await tokenResponse.json() as any;

      if (!tokenData.access_token) {
        throw AppError.badRequest('Failed to obtain access token from GitHub', tokenData);
      }

      const accessToken = tokenData.access_token;

      // Fetch user profile from GitHub
      const userResponse = await fetch(GITHUB_USER_URL, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'User-Agent': 'DevProof-Backend'
        }
      }).catch((error: unknown) => {
        throw AppError.serviceUnavailable(
          `Unable to reach GitHub while loading the authenticated profile. Check network access and proxy settings. ${(error as Error).message}`
        );
      });

      if (!userResponse.ok) {
        const body = await userResponse.text();
        throw AppError.badRequest(`GitHub user lookup failed with status ${userResponse.status}`, body);
      }

      const githubUser = await userResponse.json() as any;

      const { token } = await AuthService.handleGitHubOAuth(githubUser, accessToken, existingUserId);
      AuthController.setTokenCookie(res, token);

      // Redirect back to frontend.
      // The token is intentionally NOT in the query string — it is already in the
      // httpOnly cookie set above, and sameSite:lax survives a top-level
      // redirect. A token in the URL leaks into history, logs, and Referer.
      return res.redirect(`${env.FRONTEND_URL}/dashboard?auth=success`);
    } catch (error) {
      return AuthController.redirectToLoginWithError(res, error);
    }
  };

  /**
   * Disconnect linked GitHub account
   */
  static disconnectGitHub = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const user = req.user!;
      if (!user.githubAccount) {
        throw AppError.badRequest('No GitHub account linked to disconnect.');
      }

      await prisma.gitHubAccount.delete({
        where: { userId: user.id }
      });

      return successResponse(res, 200, 'GitHub account disconnected successfully');
    } catch (error) {
      next(error);
    }
  };

  /**
   * Synchronize the linked GitHub account: refreshes profile stats (repos,
   * stars, followers, following) *and* upserts the user's repositories. Shares
   * the same engine as POST /repositories/sync so both stay consistent.
   */
  static syncGitHub = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const user = req.user!;
      if (!user.githubAccount) {
        throw AppError.badRequest('No GitHub account linked to sync.');
      }

      const summary = await GitHubSyncService.syncUser(user.id);

      return successResponse(res, 200, 'GitHub account synchronized successfully', summary);
    } catch (error) {
      next(error);
    }
  };

  /**
   * User logout
   */
  static logout = async (req: Request, res: Response) => {
    // Options must match those used to set the cookie, otherwise the browser
    // treats it as a different cookie and leaves the original in place.
    res.clearCookie(COOKIE_NAME, COOKIE_OPTIONS);
    return successResponse(res, 200, 'Logged out successfully');
  };

  /**
   * Update the current user's editable profile fields.
   *
   * Only the display name is user-editable. Email is the primary identifier and
   * is used by the GitHub OAuth linking flow, and role is an admin concern, so
   * neither is exposed here.
   *
   * Owner-scoped: the userId comes from the session cookie, never from the
   * request body, so a caller cannot rename another user.
   */
  static patchMe = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const user = req.user!;
      const { name } = req.body as { name?: string };

      // Only rewrite name when the caller actually supplied one. An omitted
      // field leaves the existing value untouched rather than nulling it.
      const data: { name?: string } = name !== undefined ? { name } : {};

      const updated = await prisma.user.update({
        where: { id: user.id },
        data,
        select: {
          id: true,
          email: true,
          name: true,
          avatarUrl: true,
          role: true,
          createdAt: true
        }
      });

      return successResponse(res, 200, 'Profile updated successfully', {
        user: sanitizeUser(updated, true)
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * Export the current user's own data as a JSON document.
   *
   * Contains everything the user could see in the dashboard about themselves —
   * profile, GitHub account summary (never the access token), repositories,
   * analyses, skills, courses, certifications, coding profiles, hackathons,
   * growth history and career readiness — but never another user's records and
   * never secrets (passwords, tokens, keys).
   *
   * The file is generated on demand and returned inline as a JSON response, not
   * stored on disk.
   */
  static exportData = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const user = req.user!;

      const [githubAccount, repositories, analyses, skills, courses, certifications, codingProfiles, hackathons, growthHistory, careerReadiness] =
        await Promise.all([
          prisma.gitHubAccount.findUnique({ where: { userId: user.id } }),
          prisma.repository.findMany({
            where: { userId: user.id },
            orderBy: { createdAt: 'desc' },
            include: {
              analyses: {
                orderBy: { createdAt: 'desc' },
                include: { metrics: true, findings: true }
              }
            }
          }),
          prisma.repositoryAnalysis.findMany({
            where: { userId: user.id },
            orderBy: { createdAt: 'desc' }
          }),
          prisma.skill.findMany({
            where: { userId: user.id },
            orderBy: { name: 'asc' },
            include: { evidences: { orderBy: { createdAt: 'asc' } } }
          }),
          prisma.course.findMany({
            where: { userId: user.id },
            orderBy: [{ completedAt: 'desc' }, { createdAt: 'desc' }]
          }),
          prisma.certification.findMany({
            where: { userId: user.id },
            orderBy: { issueDate: 'desc' }
          }),
          prisma.codingProfile.findMany({
            where: { userId: user.id },
            orderBy: { platform: 'asc' }
          }),
          prisma.hackathon.findMany({
            where: { userId: user.id },
            orderBy: { heldAt: 'desc' }
          }),
          // Reuse the growth service for a normalized history snapshot.
          (async () => {
            try {
              const { GrowthService } = await import('../services/growth.service');
              return await GrowthService.getHistory(user.id);
            } catch {
              return null;
            }
          })(),
          (async () => {
            try {
              const { CareerReadinessService } = await import('../services/careerReadiness.service');
              return await CareerReadinessService.getReadiness(user.id);
            } catch {
              return null;
            }
          })()
        ]);

      const exportData = {
        exportedAt: new Date().toISOString(),
        exportedBy: user.id,
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          avatarUrl: user.avatarUrl,
          role: user.role,
          createdAt: user.createdAt.toISOString()
        },
        githubAccount: githubAccount
          ? {
              id: githubAccount.id,
              githubId: githubAccount.githubId,
              username: githubAccount.username,
              profileUrl: githubAccount.profileUrl,
              avatarUrl: githubAccount.avatarUrl,
              totalRepos: githubAccount.totalRepos,
              totalStars: githubAccount.totalStars,
              totalFollowers: githubAccount.totalFollowers,
              totalFollowing: githubAccount.totalFollowing,
              linkedAt: githubAccount.linkedAt.toISOString(),
              lastSyncedAt: githubAccount.lastSyncedAt?.toISOString() ?? null
            }
          : null,
        repositories: repositories.map((r) => ({
          id: r.id,
          name: r.name,
          fullName: r.fullName,
          owner: r.owner,
          url: r.url,
          description: r.description,
          isPrivate: r.isPrivate,
          isFork: r.isFork,
          isArchived: r.isArchived,
          defaultBranch: r.defaultBranch,
          language: r.language,
          topics: r.topics,
          starsCount: r.starsCount,
          forksCount: r.forksCount,
          watchersCount: r.watchersCount,
          openIssuesCount: r.openIssuesCount,
          sizeKb: r.sizeKb,
          githubCreatedAt: r.githubCreatedAt?.toISOString() ?? null,
          githubUpdatedAt: r.githubUpdatedAt?.toISOString() ?? null,
          pushedAt: r.pushedAt?.toISOString() ?? null,
          createdAt: r.createdAt.toISOString(),
          updatedAt: r.updatedAt.toISOString(),
          analyses: r.analyses.map((a) => ({
            id: a.id,
            status: a.status,
            overallScore: a.overallScore,
            healthStatus: a.healthStatus,
            analyzedAt: a.analyzedAt?.toISOString() ?? null,
            createdAt: a.createdAt.toISOString(),
            metrics: a.metrics?.map((m) => ({
              id: m.id,
              category: m.category,
              name: m.name,
              score: m.score,
              detail: m.detail
            })),
            findings: a.findings?.map((f) => ({
              id: f.id,
              severity: f.severity,
              category: f.category,
              title: f.title,
              description: f.description,
              filePath: f.filePath,
              lineNumber: f.lineNumber,
              snippet: f.snippet,
              recommendation: f.recommendation
            }))
          }))
        })),
        analyses: analyses.map((a) => ({
          id: a.id,
          repositoryId: a.repositoryId,
          status: a.status,
          overallScore: a.overallScore,
          healthStatus: a.healthStatus,
          analyzedAt: a.analyzedAt?.toISOString() ?? null,
          createdAt: a.createdAt.toISOString()
        })),
        skills: skills.map((s) => ({
          id: s.id,
          name: s.name,
          category: s.category,
          confidence: s.confidence,
          currentLevel: s.currentLevel,
          createdAt: s.createdAt.toISOString(),
          evidences: s.evidences.map((e) => ({
            id: e.id,
            evidenceType: e.evidenceType,
            title: e.title,
            snippet: e.snippet,
            sourceUrl: e.sourceUrl,
            level: e.level,
            createdAt: e.createdAt.toISOString()
          }))
        })),
        courses: courses.map((c) => ({
          id: c.id,
          title: c.title,
          platform: c.platform,
          isCompleted: c.isCompleted,
          completedAt: c.completedAt?.toISOString() ?? null,
          certificateUrl: c.certificateUrl,
          learnedSkills: c.learnedSkills,
          createdAt: c.createdAt.toISOString(),
          updatedAt: c.updatedAt.toISOString()
        })),
        certifications: certifications.map((c) => ({
          id: c.id,
          name: c.name,
          issuer: c.issuer,
          credentialId: c.credentialId,
          credentialUrl: c.credentialUrl,
          issueDate: c.issueDate?.toISOString() ?? null,
          createdAt: c.createdAt.toISOString()
        })),
        codingProfiles: codingProfiles.map((p) => ({
          id: p.id,
          platform: p.platform,
          handle: p.handle,
          profileUrl: p.profileUrl,
          totalSolved: p.totalSolved,
          easySolved: p.easySolved,
          mediumSolved: p.mediumSolved,
          hardSolved: p.hardSolved,
          acceptanceRate: p.acceptanceRate,
          ranking: p.ranking,
          rating: p.rating,
          contestsAttended: p.contestsAttended,
          globalRanking: p.globalRanking,
          topPercentage: p.topPercentage,
          streakDays: p.streakDays,
          totalActiveDays: p.totalActiveDays,
          lastSyncedAt: p.lastSyncedAt?.toISOString() ?? null,
          createdAt: p.createdAt.toISOString(),
          updatedAt: p.updatedAt.toISOString()
        })),
        hackathons: hackathons.map((h) => ({
          id: h.id,
          name: h.name,
          organizer: h.organizer,
          role: h.role,
          projectName: h.projectName,
          projectUrl: h.projectUrl,
          result: h.result,
          teamSize: h.teamSize,
          heldAt: h.heldAt?.toISOString() ?? null,
          technologies: h.technologies,
          createdAt: h.createdAt.toISOString(),
          updatedAt: h.updatedAt.toISOString()
        })),
        growthHistory: growthHistory
          ? {
              points: growthHistory.points,
              months: growthHistory.months,
              milestones: growthHistory.milestones,
              trends: growthHistory.trends,
              totals: growthHistory.totals
            }
          : null,
        careerReadiness: careerReadiness
          ? {
              hasEvidence: careerReadiness.hasEvidence,
              bestMatch: careerReadiness.bestMatch,
              roles: careerReadiness.roles
            }
          : null
      };

      return successResponse(res, 200, 'Your data export is ready', { export: exportData });
    } catch (error) {
      next(error);
    }
  };

  /**
   * Permanently delete the current user's account and all of their data.
   *
   * Because the Prisma schema cascades from User to every related model
   * (GitHubAccount, Repository, RepositoryAnalysis, Metric, Finding, Skill,
   * Course, Certification, CodingProfile, Hackathon, Resume, TargetRole,
   * AnalysisHistory), one delete removes the entire tree for this user. No other
   * user's records are touched: every relation is scoped by userId and the
   * delete is performed with the session user's id.
   *
   * This is intentionally separate from disconnecting an integration: removing
   * GitHub does not delete repositories or analyses, but removing the account
   * removes everything.
   *
   * Returns the deleted user's id so the caller can confirm which account was
   * removed, then the session is invalid (the row no longer exists).
   */
  static deleteAccount = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const user = req.user!;
      const userId = user.id;

      // The session is still valid right up until this call. The caller has
      // already confirmed intent (the frontend requires a typed confirmation),
      // so no second factor is enforced here — but the action is idempotent in
      // the sense that a second call for the same user will 404 rather than
      // deleting someone else's account.
      await prisma.user.delete({
        where: { id: userId },
        select: { id: true, email: true, name: true }
      });

      // The user no longer exists, so their session cookie is now orphaned.
      // Clear it so the browser does not keep sending an invalid token.
      res.clearCookie(COOKIE_NAME, COOKIE_OPTIONS);

      return successResponse(res, 200, 'Account deleted successfully', {
        deleted: { id: userId, email: user.email, name: user.name }
      });
    } catch (error) {
      next(error);
    }
  };
}
