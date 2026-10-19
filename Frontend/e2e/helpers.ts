/**
 * Shared helpers for the DevProof browser E2E suite (Task 21).
 *
 * Determinism rules encoded here:
 *  - Test accounts are dedicated and registered through the normal API.
 *  - A signed-in session is created ONCE in global setup and reused via
 *    Playwright storage state. This keeps the suite well under the backend's
 *    deliberate login rate limit (10 attempts / 15 min per IP) — the limit is
 *    a security control and is never bypassed or relaxed for tests.
 *  - Console/page errors are collected per page; specs assert the list is empty.
 *    The only exemption is the browser's own "Failed to load resource … 401"
 *    line for the signed-out /auth/me bootstrap probe, which the app handles
 *    correctly by staying signed out.
 */
import type { APIRequestContext, Page } from "@playwright/test";
import { resolveAccountPasswords } from "./credentials";

export { generatedTestPassword } from "./credentials";

// Passwords are never committed: each run resolves them from the environment
// or from the per-run git-ignored store (see e2e/credentials.ts). Global setup
// resolves them first and registers the accounts, so every worker that imports
// this module reads the same values back.
const passwords = resolveAccountPasswords();

export const MAIN_USER = {
  name: "E2E Main",
  email: "e2e-main@devproof.test",
  password: passwords.main
};

export const ISOLATION_USER = {
  name: "E2E Isolation",
  email: "e2e-isolation@devproof.test",
  password: passwords.isolation
};

/** Saved sessions created by e2e/global-setup.ts (git-ignored). */
export const STORAGE_MAIN = "e2e/.auth/main.json";
export const STORAGE_ISOLATION = "e2e/.auth/isolation.json";

/** Direct origin of the isolated e2e backend (no proxy on `vite preview`). */
export const API_ORIGIN = process.env.E2E_API_ORIGIN || "http://127.0.0.1:5399";
export const API_V1 = `${API_ORIGIN}/api/v1`;

/** Register a test user idempotently; an existing account must still log in. */
export async function ensureUser(
  request: APIRequestContext,
  user: { name: string; email: string; password: string }
): Promise<void> {
  const register = await request.post(`${API_V1}/auth/register`, {
    data: { name: user.name, email: user.email, password: user.password }
  });
  if (register.ok()) return;

  const login = await request.post(`${API_V1}/auth/login`, {
    data: { email: user.email, password: user.password }
  });
  if (!login.ok()) {
    throw new Error(
      `[e2e] Could not create or log in test user ${user.email}: ` +
        `register=${register.status()} login=${login.status()} ${await login.text()}\n` +
        `If this stack's accounts were created by an earlier run with different ` +
        `credentials, set E2E_MAIN_PASSWORD / E2E_ISOLATION_PASSWORD to those values.`
    );
  }
}

/**
 * Log a page in through the real login form (never bypasses authorization).
 * Used only by auth.spec.ts, which exists to cover this very flow; every other
 * spec injects the saved session instead to stay under the login rate limit.
 */
export async function uiLogin(
  page: Page,
  user: { email: string; password: string }
): Promise<void> {
  await page.goto("/login");
  await page.locator('input[placeholder*="example.com"]').fill(user.email);
  await page.locator('input[type="password"]').first().fill(user.password);
  await page.getByRole("button", { name: "Sign in", exact: true }).click();
  await page.waitForURL(/\/dashboard\//);
  await page.getByRole("heading", { level: 1 }).first().waitFor({ state: "visible" });
}

/**
 * Collect uncaught page errors and console.error output. Exemptions:
 *  - External Spline CDN noise (not the app's code; may be blocked offline).
 *  - The browser's generic resource-failure line for the signed-out /auth/me
 *    probe (401 is the correct, handled answer when no session exists).
 */
export function collectPageErrors(
  page: Page,
  /** Extra resource URLs whose network-level failure lines are expected
   *  (e.g. a deliberate probe of a nonexistent resource). */
  opts: { ignoreResourceUrls?: RegExp[] } = {}
): string[] {
  const errors: string[] = [];
  page.on("pageerror", (err) => errors.push(`pageerror: ${err.message}`));
  page.on("console", (msg) => {
    if (msg.type() !== "error") return;
    const text = msg.text();
    if (/spline/i.test(text)) return; // external CDN, out of app control
    if (/Failed to load resource/i.test(text)) {
      const url = msg.location().url ?? "";
      if (/\/auth\/me/.test(url)) return; // signed-out bootstrap probe; handled
      if (opts.ignoreResourceUrls?.some((re) => re.test(url))) return; // deliberate probe
    }
    errors.push(`console.error: ${text}`);
  });
  return errors;
}

/** Assert no horizontal document overflow (390px-safe pages). */
export async function expectNoHorizontalOverflow(page: Page): Promise<void> {
  const overflow = await page.evaluate(() => {
    const doc = document.documentElement;
    return { scrollWidth: doc.scrollWidth, clientWidth: doc.clientWidth };
  });
  if (overflow.scrollWidth > overflow.clientWidth + 1) {
    throw new Error(
      `Horizontal overflow: scrollWidth=${overflow.scrollWidth} > clientWidth=${overflow.clientWidth}`
    );
  }
}
