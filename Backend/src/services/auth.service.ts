import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { prisma } from '../config/database';
import { env } from '../config/env';
import { AppError } from '../utils/appError';
import { User, UserRole } from '@prisma/client';

export interface JwtPayload {
  userId: string;
  email: string;
  role: UserRole;
}

export interface RegisterDto {
  email: string;
  password?: string;
  name?: string;
}

export interface LoginDto {
  email: string;
  /**
   * Required. Local login always needs a password — making this optional
   * previously allowed callers to reach token issuance without one.
   */
  password: string;
}

export class AuthService {
  /**
   * Hash plain password
   */
  static async hashPassword(password: string): Promise<string> {
    const salt = await bcrypt.genSalt(10);
    return bcrypt.hash(password, salt);
  }

  /**
   * Compare candidate password with stored hash
   */
  static async comparePassword(candidate: string, hash: string): Promise<boolean> {
    return bcrypt.compare(candidate, hash);
  }

  /**
   * Generate JWT Token
   */
  static generateToken(user: User): string {
    const payload: JwtPayload = {
      userId: user.id,
      email: user.email,
      role: user.role
    };

    return jwt.sign(payload, env.JWT_SECRET, {
      // @types/jsonwebtoken types this as `StringValue | number`, a template-literal
      // union a runtime env string cannot narrow to — hence the cast.
      expiresIn: env.JWT_EXPIRES_IN as jwt.SignOptions['expiresIn']
    });
  }

  /**
   * Absolute expiry of a signed token in ms since epoch, read from its `exp`
   * claim. Returns null if absent. Does NOT verify the signature — callers must
   * only use this for tokens they just issued (e.g. to size a cookie's maxAge).
   */
  static getTokenExpiryMs(token: string): number | null {
    const decoded = jwt.decode(token) as { exp?: number } | null;
    return decoded?.exp ? decoded.exp * 1000 : null;
  }

  /**
   * Verify JWT Token
   */
  static verifyToken(token: string): JwtPayload {
    try {
      return jwt.verify(token, env.JWT_SECRET) as JwtPayload;
    } catch (error) {
      throw AppError.unauthorized('Invalid or expired authentication token');
    }
  }

  /**
   * Register a new user with email and password
   */
  static async register(dto: RegisterDto) {
    const existingUser = await prisma.user.findUnique({
      where: { email: dto.email.toLowerCase() }
    });

    if (existingUser) {
      throw AppError.conflict('User with this email already exists');
    }

    const passwordHash = dto.password ? await this.hashPassword(dto.password) : null;

    const user = await prisma.user.create({
      data: {
        email: dto.email.toLowerCase(),
        passwordHash,
        name: dto.name || dto.email.split('@')[0],
        role: UserRole.DEVELOPER
      }
    });

    const token = this.generateToken(user);
    return { user, token };
  }

  /**
   * Authenticate user with email and password
   */
  static async login(dto: LoginDto) {
    const user = await prisma.user.findUnique({
      where: { email: dto.email.toLowerCase() },
      include: {
        githubAccount: true
      }
    });

    if (!user) {
      throw AppError.unauthorized('Invalid email or password');
    }

    // OAuth-only account — there is no local password to verify against.
    if (!user.passwordHash) {
      throw AppError.badRequest('This account uses GitHub OAuth authentication. Please log in with GitHub.');
    }

    // A missing password is a failed login, not a check to skip. The previous
    // if/else-if left a fall-through: passwordHash present + password absent
    // matched neither branch and reached generateToken below.
    if (!dto.password) {
      throw AppError.unauthorized('Invalid email or password');
    }

    const isValid = await this.comparePassword(dto.password, user.passwordHash);
    if (!isValid) {
      throw AppError.unauthorized('Invalid email or password');
    }

    const token = this.generateToken(user);
    return { user, token };
  }

  /**
   * Synchronize or create user from GitHub OAuth profile.
   *
   * @param existingUserId  When the caller already has a valid session (e.g. a
   *   credential-registered user clicking "Link GitHub"), pass their userId so
   *   we associate the GitHub account with *that* user rather than
   *   find-or-create by GitHub email.  Leave undefined for the unauthenticated
   *   sign-in-with-GitHub flow.
   */
  static async handleGitHubOAuth(
    githubUser: {
      id: number | string;
      login: string;
      email: string | null;
      name: string | null;
      avatar_url: string;
      html_url: string;
      public_repos: number;
      followers: number;
    },
    accessToken: string,
    existingUserId?: string
  ) {
    const email = githubUser.email || `${githubUser.login.toLowerCase()}@users.noreply.github.com`;
    const githubIdStr = String(githubUser.id);

    /** Common field values used in both create and update. */
    const githubFields = {
      accessToken,
      username: githubUser.login,
      profileUrl: githubUser.html_url,
      avatarUrl: githubUser.avatar_url,
      totalRepos: githubUser.public_repos,
      totalFollowers: githubUser.followers
    };

    // ── Case 1: GitHub account already linked to *some* DevProof user ──────
    const existingGithubAcc = await prisma.gitHubAccount.findUnique({
      where: { githubId: githubIdStr },
      include: { user: true }
    });

    if (existingGithubAcc) {
      if (existingUserId && existingGithubAcc.userId !== existingUserId) {
        // This GitHub account belongs to a *different* DevProof user.
        throw AppError.conflict(
          'This GitHub account is already linked to a different DevProof account. ' +
          'Please disconnect it from the other account first.'
        );
      }

      // Refresh the stored stats & token.
      const updated = await prisma.gitHubAccount.update({
        where: { githubId: githubIdStr },
        data: githubFields,
        include: { user: true }
      });

      const token = this.generateToken(updated.user);
      return { user: updated.user, token };
    }

    // ── Case 2: GitHub account is new — decide which DevProof user to use ──
    let user: User;

    if (existingUserId) {
      // The caller is already authenticated: link to their existing account.
      const existing = await prisma.user.findUnique({ where: { id: existingUserId } });
      if (!existing) {
        throw AppError.unauthorized('Your session is no longer valid. Please log in again.');
      }

      // If this user already has a *different* GitHub account linked, replace it
      // (the old githubId is no longer owned by the app user).
      const currentLink = await prisma.gitHubAccount.findUnique({ where: { userId: existingUserId } });
      if (currentLink) {
        await prisma.gitHubAccount.update({
          where: { userId: existingUserId },
          data: { githubId: githubIdStr, ...githubFields }
        });
      } else {
        await prisma.gitHubAccount.create({
          data: { userId: existingUserId, githubId: githubIdStr, ...githubFields }
        });
      }

      user = existing;
    } else {
      // Unauthenticated flow: find-or-create by email.
      let found = await prisma.user.findUnique({ where: { email: email.toLowerCase() } });

      if (!found) {
        found = await prisma.user.create({
          data: {
            email: email.toLowerCase(),
            name: githubUser.name || githubUser.login,
            avatarUrl: githubUser.avatar_url,
            role: UserRole.DEVELOPER
          }
        });
      }

      user = found;

      await prisma.gitHubAccount.create({
        data: { userId: user.id, githubId: githubIdStr, ...githubFields }
      });
    }

    const token = this.generateToken(user);
    return { user, token };
  }
}
