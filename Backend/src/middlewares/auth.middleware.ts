import { Request, Response, NextFunction } from 'express';
import { AuthService } from '../services/auth.service';
import { prisma } from '../config/database';
import { AppError } from '../utils/appError';
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

    if (req.cookies && req.cookies.token) {
      token = req.cookies.token;
    } else if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
      return next(AppError.unauthorized('Authentication required. Please log in.'));
    }

    const decoded = AuthService.verifyToken(token);

    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      include: { githubAccount: true }
    });

    if (!user) {
      return next(AppError.unauthorized('User associated with this token no longer exists.'));
    }

    req.user = user;
    next();
  } catch (error) {
    next(error);
  }
};
