import { CookieOptions } from 'express';
import { env } from './env';

/**
 * Single source of truth for the session cookie.
 *
 * `clearCookie` only removes a cookie when path/domain/secure/sameSite match
 * the attributes it was set with, so every place that sets, clears, or rejects
 * the session cookie must read these options from here rather than repeating
 * the literals.
 */
export const COOKIE_NAME = 'token';

export const COOKIE_OPTIONS: CookieOptions = {
  httpOnly: true,
  secure: env.NODE_ENV === 'production',
  sameSite: 'lax',
  path: '/'
};
