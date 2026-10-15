import { Request, Response, NextFunction } from 'express';
import { AuthService, JwtPayload } from '../services/auth.service';
import { prisma } from '../config/database';
import { AppError } from '../utils/appError';
import { COOKIE_NAME, COOKIE_OPTIONS } from '../config/cookies';
import { User, GitHubAccount } from '@prisma/client';

export interface AuthenticatedRequest extends Request {
  user?: User & { githubAccount?: GitHubAccount | null };
}

export const protect = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    let token: string | undefined;
    /** True only when the token came from this app's own session cookie —
     * a bearer token in a header is not ours to clear. */
    let fromCookie = false;

    if (req.cookies && req.cookies[COOKIE_NAME]) {
      token = req.cookies[COOKIE_NAME];
      fromCookie = true;
    } else if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
      return next(AppError.unauthorized('Authentication required. Please log in.'));
    }

    // A cookie the server rejects — bad signature, expiry, or an orphaned
    // session — would otherwise sit in the browser for its full lifetime and
    // re-fail on every request. Clearing it here (with the same options it was
    // set with) ends the invalid session cleanly.
    const clearInvalidSession = () => {
      if (fromCookie) res.clearCookie(COOKIE_NAME, COOKIE_OPTIONS);
    };

    let decoded: JwtPayload;
    try {
      decoded = AuthService.verifyToken(token);
    } catch {
      clearInvalidSession();
      return next(AppError.unauthorized('Invalid or expired authentication token'));
    }

    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      include: { githubAccount: true }
    });

    if (!user) {
      clearInvalidSession();
      return next(AppError.unauthorized('User associated with this token no longer exists.'));
    }

    req.user = user;
    next();
  } catch (error) {
    next(error);
  }
};
