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
   * Synchronize or create user from GitHub OAuth profile
   */
  static async handleGitHubOAuth(githubUser: {
    id: number | string;
    login: string;
    email: string | null;
    name: string | null;
    avatar_url: string;
    html_url: string;
    public_repos: number;
    followers: number;
  }, accessToken: string) {
    const email = githubUser.email || `${githubUser.login.toLowerCase()}@users.noreply.github.com`;
    const githubIdStr = String(githubUser.id);

    // Find existing github account
    let githubAcc = await prisma.gitHubAccount.findUnique({
      where: { githubId: githubIdStr },
      include: { user: true }
    });

    let user: User;

    if (githubAcc) {
      // Update access token & stats
      githubAcc = await prisma.gitHubAccount.update({
        where: { githubId: githubIdStr },
        data: {
          accessToken,
          username: githubUser.login,
          profileUrl: githubUser.html_url,
          avatarUrl: githubUser.avatar_url,
          totalRepos: githubUser.public_repos,
          totalFollowers: githubUser.followers
        },
        include: { user: true }
      });
      user = githubAcc.user;
    } else {
      // Check if user with matching email exists
      let existingUser = await prisma.user.findUnique({
        where: { email: email.toLowerCase() }
      });

      if (!existingUser) {
        existingUser = await prisma.user.create({
          data: {
            email: email.toLowerCase(),
            name: githubUser.name || githubUser.login,
            avatarUrl: githubUser.avatar_url,
            role: UserRole.DEVELOPER
          }
        });
      }

      user = existingUser;

      // Create linked GitHub account
      await prisma.gitHubAccount.create({
        data: {
          userId: user.id,
          githubId: githubIdStr,
          username: githubUser.login,
          accessToken,
          profileUrl: githubUser.html_url,
          avatarUrl: githubUser.avatar_url,
          totalRepos: githubUser.public_repos,
          totalFollowers: githubUser.followers
        }
      });
    }

    const token = this.generateToken(user);
    return { user, token };
  }
}
