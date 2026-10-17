/**
 * Journey C — Authenticated dashboard.
 *
 * Covers: every dashboard section renders for a signed-in user without browser
 * errors, nested-route direct navigation/refresh (repository details 404 state),
 * and user-scoped data isolation between two dedicated test accounts.
 */
import { expect, test } from "@playwright/test";
import { API_V1, collectPageErrors, ISOLATION_USER, STORAGE_MAIN } from "./helpers";

// The session is created once in global setup and injected here; only
// auth.spec.ts exercises the login form itself (login rate limit is real).
test.use({ storageState: STORAGE_MAIN });

const SECTIONS = [
  "overview",
  "learning",
  "skills",
  "problem-solving",
  "growth",
  "career-readiness",
  "ai-insights",
  "settings"
];

test("every dashboard section loads for a signed-in user without browser errors", async ({ page }) => {
  const errors = collectPageErrors(page);

  for (const section of SECTIONS) {
    await page.goto(`/dashboard/${section}`);
    await expect(page.getByRole("heading", { level: 1 }).first()).toBeVisible();
    await expect(page).toHaveURL(new RegExp(`/dashboard/${section}$`));
  }

  expect(errors).toEqual([]);
});

test("direct navigation and refresh work on nested dashboard routes", async ({ page }) => {
  // The nonexistent-repo probe legitimately produces a 404 resource line;
  // the in-app not-found state it renders is what this test asserts.
  const errors = collectPageErrors(page, {
    ignoreResourceUrls: [/\/api\/v1\/repositories\/e2e-no-such-repo/]
  });

  // Deep link + reload on a nested route: the dashboard shell renders and the
  // page shows an in-app not-found state rather than a blank screen.
  await page.goto("/dashboard/repositories/e2e-no-such-repo");
  await expect(page.getByText(/repository not found/i)).toBeVisible();
  await page.reload();
  await expect(page.getByText(/repository not found/i)).toBeVisible();
  await expect(page.getByRole("button", { name: "Logout" })).toBeVisible();

  expect(errors).toEqual([]);
});

test("user-scoped data stays isolated between accounts", async ({ page, browser }) => {
  const stamp = Date.now();
  const marker = `E2E-ISOLATION-MARKER-${stamp}`;

  await page.goto("/dashboard/overview");

  // Account A creates a real record through the authenticated API.
  const created = await page.request.post(`${API_V1}/certifications`, {
    data: { name: marker, issuer: "E2E Test Issuer" }
  });
  expect(created.status(), await created.text()).toBe(201);

  // Account A sees it.
  await page.goto("/dashboard/learning");
  await expect(page.getByText(marker).first()).toBeVisible();

  // Account B (fresh browser context, real API login) must never see it.
  const contextB = await browser.newContext();
  const loginB = await contextB.request.post(`${API_V1}/auth/login`, {
    data: { email: ISOLATION_USER.email, password: ISOLATION_USER.password }
  });
  expect(loginB.status(), await loginB.text()).toBe(200);
  const pageB = await contextB.newPage();
  const errorsB = collectPageErrors(pageB);
  await pageB.goto("/dashboard/learning");
  await expect(pageB.getByRole("heading", { level: 1 }).first()).toBeVisible();
  await expect(pageB.getByText(marker)).toHaveCount(0);
  expect(errorsB).toEqual([]);
  await contextB.close();
});
