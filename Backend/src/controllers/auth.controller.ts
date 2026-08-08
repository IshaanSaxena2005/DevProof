import { Request, Response, NextFunction, CookieOptions } from 'express';
import { AuthService } from '../services/auth.service';
import { successResponse } from '../utils/apiResponse';
import { env } from '../config/env';
import { AuthenticatedRequest } from '../middlewares/auth.middleware';
import { AppError } from '../utils/appError';
import { prisma } from '../config/database';

const COOKIE_NAME = 'token';

/** Fallback cookie lifetime used only if the token carries no `exp` claim. */
const FALLBACK_MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000;

/**
 * Shared between setting and clearing the cookie. `clearCookie` only removes a
 * cookie when these attributes match the ones it was set with, so they must
 * come from a single source.
 */
const COOKIE_OPTIONS: CookieOptions = {
  httpOnly: true,
  secure: env.NODE_ENV === 'production',
  sameSite: 'lax',
  path: '/'
};

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

      return successResponse(res, 201, 'User registered successfully', {
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role
        },
        token
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

      return successResponse(res, 200, 'Login successful', {
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          avatarUrl: user.avatarUrl,
          role: user.role,
          githubAccount: user.githubAccount
        },
        token
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
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          avatarUrl: user.avatarUrl,
          role: user.role,
          githubAccount: user.githubAccount,
          createdAt: user.createdAt
        }
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * Initiate GitHub OAuth redirect
   */
  static githubOAuth = async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (!env.GITHUB_CLIENT_ID) {
        throw AppError.badRequest('GitHub OAuth Client ID is not configured on backend.');
      }

      const redirectUri = encodeURIComponent(env.GITHUB_CALLBACK_URL);
      const githubAuthUrl = `https://github.com/login/oauth/authorize?client_id=${env.GITHUB_CLIENT_ID}&redirect_uri=${redirectUri}&scope=user:email,repo`;

      return res.redirect(githubAuthUrl);
    } catch (error) {
      next(error);
    }
  };

  /**
   * GitHub OAuth Callback Handler
   */
  static githubCallback = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { code } = req.query;

      if (!code || typeof code !== 'string') {
        throw AppError.badRequest('Missing authorization code from GitHub');
      }

      // Exchange code for access token
      const tokenResponse = await fetch('https://github.com/login/oauth/access_token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json'
        },
        body: JSON.stringify({
          client_id: env.GITHUB_CLIENT_ID,
          client_secret: env.GITHUB_CLIENT_SECRET,
          code
        })
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
      const userResponse = await fetch('https://api.github.com/user', {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'User-Agent': 'DevProof-Backend'
        }
      });

      if (!userResponse.ok) {
        const body = await userResponse.text();
        throw AppError.badRequest(`GitHub user lookup failed with status ${userResponse.status}`, body);
      }

      const githubUser = await userResponse.json() as any;

      const { token } = await AuthService.handleGitHubOAuth(githubUser, accessToken);
      AuthController.setTokenCookie(res, token);

      // Redirect back to frontend.
      // The token is intentionally NOT in the query string — it is already in the
      // httpOnly cookie set above, and sameSite:lax survives a top-level
      // redirect. A token in the URL leaks into history, logs, and Referer.
      return res.redirect(`${env.FRONTEND_URL}/dashboard?auth=success`);
    } catch (error) {
      next(error);
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
   * Synchronize linked GitHub account stats (repos, stars, followers)
   */
  static syncGitHub = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const user = req.user!;
      if (!user.githubAccount) {
        throw AppError.badRequest('No GitHub account linked to sync.');
      }

      const accessToken = user.githubAccount.accessToken;

      // Fetch fresh profile details from GitHub
      const userResponse = await fetch('https://api.github.com/user', {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'User-Agent': 'DevProof-Backend'
        }
      });

      if (!userResponse.ok) {
        throw AppError.badRequest('Failed to fetch fresh profile from GitHub API');
      }

      const githubUser = await userResponse.json() as any;

      await prisma.gitHubAccount.update({
        where: { userId: user.id },
        data: {
          username: githubUser.login,
          profileUrl: githubUser.html_url,
          avatarUrl: githubUser.avatar_url,
          totalRepos: githubUser.public_repos,
          totalFollowers: githubUser.followers
        }
      });

      return successResponse(res, 200, 'GitHub account synchronized successfully');
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
}
