import crypto from 'crypto';
import jwt from 'jsonwebtoken';
import { env } from '../config/env';
import { AppError } from '../utils/appError';

export class GitHubAppService {
  static isConfigured(): boolean {
    return Boolean(env.GITHUB_APP_ID && env.GITHUB_PRIVATE_KEY);
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
