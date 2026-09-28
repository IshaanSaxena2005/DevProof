import crypto from 'crypto';
import jwt from 'jsonwebtoken';
import { env } from '../config/env';
import { AppError } from '../utils/appError';

export class GitHubAppService {
  static isConfigured(): boolean {
    return Boolean(env.GITHUB_APP_ID && env.GITHUB_PRIVATE_KEY);
  }

  /**
   * Where to send a user to install DevProof, or to widen an existing install.
   *
   * GitHub serves the same `installations/new` URL for both cases: a first-time
   * visitor gets the install screen, and one who already has an installation is
   * redirected to its configuration page. That matters because "installed but
   * granted zero repositories" is a real state users land in — choosing "only
   * select repositories" and selecting none — and it needs the same link.
   *
   * Without the slug we fall back to the user's installations list, which is
   * one extra click rather than a dead end.
   */
  static installationUrl(): string {
    return env.GITHUB_APP_SLUG
      ? `https://github.com/apps/${env.GITHUB_APP_SLUG}/installations/new`
      : 'https://github.com/settings/installations';
  }

  static createAppJwt(now = Math.floor(Date.now() / 1000)): string {
    if (!env.GITHUB_APP_ID || !env.GITHUB_PRIVATE_KEY) {
      throw AppError.serviceUnavailable('GitHub App credentials are not configured on this server.');
    }

    return jwt.sign(
      {
        iat: now - 60,
        exp: now + 9 * 60,
        iss: env.GITHUB_APP_ID
      },
      env.GITHUB_PRIVATE_KEY,
      { algorithm: 'RS256' }
    );
  }

  static verifyWebhookSignature(rawBody: Buffer | string, signatureHeader?: string | string[]): boolean {
    if (!env.GITHUB_WEBHOOK_SECRET) {
      return true;
    }

    if (!signatureHeader || Array.isArray(signatureHeader)) {
      return false;
    }

    const payload = Buffer.isBuffer(rawBody) ? rawBody : Buffer.from(rawBody);
    const expectedSignature = `sha256=${crypto
      .createHmac('sha256', env.GITHUB_WEBHOOK_SECRET)
      .update(payload)
      .digest('hex')}`;

    const providedSignature = signatureHeader.trim();
    if (expectedSignature.length !== providedSignature.length) {
      return false;
    }

    return crypto.timingSafeEqual(Buffer.from(expectedSignature), Buffer.from(providedSignature));
  }
}
