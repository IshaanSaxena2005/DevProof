/**
 * Journey B — Authentication and protected routes.
 *
 * Covers: signed-out redirect to /login, invalid session rejection, login
 * error states, the full register → dashboard → logout journey with client
 * session cleanup. Uses only the real auth stack of the isolated backend —
 * no authorization bypass exists in these tests.
 */
import { expect, test } from "@playwright/test";
import { API_V1, collectPageErrors, generatedTestPassword, MAIN_USER, uiLogin } from "./helpers";

test("signed-out access to protected dashboard routes redirects to login", async ({ page }) => {
  for (const path of ["/dashboard", "/dashboard/overview", "/dashboard/skills"]) {
    await page.goto(path);
    await expect(page).toHaveURL(/\/login$/);
    // No protected UI leaks while signed out.
    await expect(page.getByRole("navigation")).toHaveCount(0);
  }
});

test("an invalid session token is rejected and exposes no protected data", async ({ page, context }) => {
  await context.addCookies([
    { name: "token", value: "not-a-real-jwt", domain: "127.0.0.1", path: "/", httpOnly: true }
  ]);

  await page.goto("/dashboard/overview");
  await expect(page).toHaveURL(/\/login$/);
  await expect(page.getByRole("heading", { level: 1 })).toBeVisible();

  // The API itself refuses the forged cookie.
  const me = await page.request.get(`${API_V1}/auth/me`);
  expect(me.status()).toBe(401);
});

test("login form renders server error states", async ({ page }) => {
  await page.goto("/login");
  await page.locator('input[placeholder*="example.com"]').fill(MAIN_USER.email);
  await page.locator('input[type="password"]').first().fill("definitely-wrong-password");
  await page.getByRole("button", { name: "Sign in", exact: true }).click();

  await expect(page.getByText(/invalid email or password/i)).toBeVisible();
  // Still on the login page — no session was granted.
  await expect(page).toHaveURL(/\/login$/);
});

test("register → dashboard → logout clears the session and returns to the public site", async ({
  page,
  context
}) => {
  const errors = collectPageErrors(page);
  const stamp = Date.now();
  const newUser = {
    name: `E2E Register ${stamp}`,
    email: `e2e-register-${stamp}@devproof.test`,
    // One-off account, one-off password: generated per run, never committed.
    password: generatedTestPassword()
  };

  await page.goto("/login");
  await page.getByRole("button", { name: "Create one" }).click();
  await page.getByPlaceholder("Ada Lovelace").fill(newUser.name);
  await page.locator('input[placeholder*="example.com"]').fill(newUser.email);
  await page.locator('input[type="password"]').nth(0).fill(newUser.password);
  await page.locator('input[type="password"]').nth(1).fill(newUser.password); // Confirm Password
  await page.getByRole("button", { name: "Create account" }).click();

  // Fresh registration lands in the authenticated dashboard.
  await page.waitForURL(/\/dashboard\//);
  await expect(page.getByRole("heading", { level: 1 }).first()).toBeVisible();
  const cookiesAfterLogin = await context.cookies();
  expect(cookiesAfterLogin.some((c) => c.name === "token")).toBe(true);

  // Logout: back on the public landing page, cookie cleared.
  await page.getByRole("button", { name: "Logout" }).click();
  await page.waitForURL(/\/$/);
  await expect(page.getByRole("heading", { level: 1 }).first()).toBeVisible();
  const cookiesAfterLogout = await context.cookies();
  expect(cookiesAfterLogout.some((c) => c.name === "token")).toBe(false);

  // Client state is gone: protected routes bounce again.
  await page.goto("/dashboard/overview");
  await expect(page).toHaveURL(/\/login$/);

  expect(errors).toEqual([]);
});
