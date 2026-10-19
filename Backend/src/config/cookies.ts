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

/**
 * In production the API and the dashboard are separate origins.
 *
 * Render serves each service from its own `*.onrender.com` subdomain, and
 * `onrender.com` is on the Public Suffix List, so those subdomains are not just
 * different origins but different *sites*. A `SameSite=Lax` cookie is withheld
 * from cross-site fetches, which would let a login succeed and then every
 * authenticated request 401 — so the session cookie has to be `None`, which
 * browsers only accept together with `Secure`.
 *
 * Locally both run on localhost, which is same-site, so `Lax` is both correct
 * and safer there — and `None` would be rejected outright over plain HTTP.
 */
const CROSS_SITE = env.NODE_ENV === 'production';

export const COOKIE_OPTIONS: CookieOptions = {
  httpOnly: true,
  secure: CROSS_SITE,
  sameSite: CROSS_SITE ? 'none' : 'lax',
  path: '/'
};
