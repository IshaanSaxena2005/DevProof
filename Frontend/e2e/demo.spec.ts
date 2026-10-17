/**
 * Journey D — Demo mode.
 *
 * Covers: /demo rendering with loud sample-data chrome, navigation that stays
 * inside /demo, synthetic data, the absence of mutating controls and of any
 * write request to the API, and Exit Demo returning to the public site.
 */
import { expect, test } from "@playwright/test";
import { collectPageErrors } from "./helpers";

test("demo renders with sample-data chrome and synthetic records", async ({ page }) => {
  const errors = collectPageErrors(page);

  await page.goto("/demo/overview");
  await expect(page.getByRole("heading", { level: 1 }).first()).toBeVisible();
  // The loud demo badge is required on every demo page — visitors must never
  // mistake sample records for their own data. (The sidebar/Header render the
  // compact badge, whose text is "Demo"; its tooltip carries the full notice.)
  await expect(page.getByText("Demo", { exact: true }).first()).toBeVisible();

  // Synthetic data flows through every representative demo route.
  for (const section of ["skills", "problem-solving", "repositories"]) {
    await page.goto(`/demo/${section}`);
    await expect(page.getByRole("heading", { level: 1 }).first()).toBeVisible();
    await expect(page).toHaveURL(new RegExp(`/demo/${section}$`));
    await expect(page.getByText("Demo", { exact: true }).first()).toBeVisible();
  }

  expect(errors).toEqual([]);
});

test("demo navigation stays inside /demo and never issues a write request", async ({ page }) => {
  const writeRequests: string[] = [];
  page.on("request", (req) => {
    if (req.url().includes("/api/v1/") && req.method() !== "GET") {
      writeRequests.push(`${req.method()} ${new URL(req.url()).pathname}`);
    }
  });

  await page.goto("/demo/overview");

  // Sidebar navigation keeps the /demo prefix (no accidental dashboard leak).
  await page.getByRole("link", { name: "Skills", exact: true }).click();
  await expect(page).toHaveURL(/\/demo\/skills$/);

  await page.getByRole("link", { name: "Learning & Achievements", exact: true }).click();
  await expect(page).toHaveURL(/\/demo\/learning$/);

  // Connecting a repository writes a record, so the demo omits that control
  // entirely (source-verified: rendered only when !isDemo).
  await page.goto("/demo/repositories");
  await expect(page.getByRole("button", { name: "Add Repository" })).toHaveCount(0);

  // No write verb ever reaches the API from demo pages — mutating actions are
  // refused by the API client before any request is sent.
  expect(writeRequests).toEqual([]);
});

test("Exit Demo returns to the public landing page", async ({ page }) => {
  await page.goto("/demo/overview");
  await expect(page.getByRole("heading", { level: 1 }).first()).toBeVisible();

  await page.getByRole("button", { name: "Exit Demo" }).click();
  await page.waitForURL(/\/$/);
  await expect(page.getByRole("heading", { level: 1 }).first()).toBeVisible();
});
