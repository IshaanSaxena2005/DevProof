/**
 * Journey F — Core regressions.
 *
 * Covers: the remaining dashboard pages render without browser errors, resume
 * upload UI has safe loading/error states, and the 390px viewport stays
 * overflow-free on an authenticated page. (Section rendering for all pages is
 * covered in dashboard.spec.ts; this spec adds the cross-cutting guarantees.)
 */
import { expect, test } from "@playwright/test";
import {
  collectPageErrors,
  expectNoHorizontalOverflow,
  STORAGE_MAIN
} from "./helpers";

// Session injected from global setup (login rate limit is real; only
// auth.spec.ts drives the login form).
test.use({ storageState: STORAGE_MAIN });

test("resume upload UI surfaces safe loading and error states", async ({ page }) => {
  // The mocked 422 is this test's own deliberate fixture; its resource-level
  // console line is expected. What matters is that the inline error renders.
  const errors = collectPageErrors(page, {
    ignoreResourceUrls: [/\/api\/v1\/resume/]
  });

  // Upload rejects the file server-side; the UI must show the error inline.
  await page.route("**/api/v1/resume", (route) => {
    if (route.request().method() !== "POST") return route.fallback();
    return route.fulfill({
      status: 422,
      contentType: "application/json",
      // The API client reads the top-level `message` of the error envelope.
      body: JSON.stringify({
        success: false,
        message: "Uploaded file is not a valid PDF."
      })
    });
  });

  await page.goto("/dashboard/learning");
  // Empty state prompts the first upload.
  await expect(page.getByText(/upload your latest resume/i)).toBeVisible();

  // A rejected upload renders the error message, not a crash or a hang.
  await page.locator('input[type="file"]').first().setInputFiles({
    name: "resume.pdf",
    mimeType: "application/pdf",
    buffer: Buffer.from("%PDF-1.4 fake-but-parsable-bytes")
  });
  await expect(page.getByText(/not a valid pdf/i)).toBeVisible();

  expect(errors).toEqual([]);
});

test("authenticated dashboard at 390px has no horizontal document overflow", async ({ browser }) => {
  const context = await browser.newContext({ viewport: { width: 390, height: 844 } });
  const page = await context.newPage();
  const errors = collectPageErrors(page);

  await page.goto("/dashboard/overview");
  await expect(page.getByRole("heading", { level: 1 }).first()).toBeVisible();

  await expectNoHorizontalOverflow(page);
  expect(errors).toEqual([]);

  await context.close();
});

test("essential navigation controls remain usable and labelled", async ({ page }) => {
  await page.goto("/dashboard/overview");
  await expect(page.getByRole("heading", { level: 1 }).first()).toBeVisible();

  // Landmarks and labelled controls power keyboard/screen-reader use.
  await expect(page.getByRole("navigation").first()).toBeVisible();
  await expect(page.getByRole("button", { name: "Logout" })).toBeVisible();

  const unlabeled = await page.evaluate(() =>
    Array.from(document.querySelectorAll("button")).filter(
      (b) => !b.textContent?.trim() && !b.getAttribute("aria-label") && !b.getAttribute("title")
    ).length
  );
  expect(unlabeled, "buttons without any accessible name").toBe(0);
});
