/**
 * Journey A — Public homepage.
 *
 * Covers: console-clean landing, Spline gating rules (desktop canvas when the
 * CDN is reachable; no canvas under reduced motion or mobile widths), no eager
 * dashboard chunk downloads, and 390px overflow safety.
 */
import { expect, test } from "@playwright/test";
import { collectPageErrors, expectNoHorizontalOverflow } from "./helpers";

test("landing renders console-clean and never downloads dashboard page chunks", async ({ page }) => {
  const errors = collectPageErrors(page);
  const jsRequests: string[] = [];
  page.on("request", (req) => {
    if (req.resourceType() === "script") jsRequests.push(req.url());
  });

  await page.goto("/", { waitUntil: "load" });
  await expect(page.getByRole("heading", { level: 1 }).first()).toBeVisible();

  // Landing may load the entry bundle and shared vendor chunks, but must not
  // eagerly fetch lazily-split dashboard page chunks (Task: route-level code
  // splitting). Page chunk names follow the lazy component identifiers.
  const pageChunk = jsRequests.find((url) =>
    /\/assets\/(ProblemSolving|Skills|Growth|CareerReadiness|AiInsights|Settings|LearningAchievements|Repositories|Developer360|Overview|ProfessionalProfile|Credentials)[-.]/.test(
      url
    )
  );
  expect(pageChunk, "a dashboard page chunk was downloaded by the landing page").toBeUndefined();

  expect(errors).toEqual([]);
});

test("Spline background follows device and reduced-motion gating", async ({ page, context }) => {
  // Track whether the external Spline CDN actually answered; canvas mounting
  // can only be asserted when the scene loaded (offline runs stay deterministic).
  let splineServed = false;
  page.on("response", (res) => {
    if (res.url().includes("spline.design")) splineServed = true;
  });

  await page.goto("/", { waitUntil: "load" });

  if (splineServed) {
    // Supported desktop device: the WebGL canvas mounts.
    await expect(page.locator("canvas")).toHaveCount(1, { timeout: 15_000 });
  } else {
    // CDN unreachable (offline/CI): the app must still render cleanly.
    await expect(page.getByRole("heading", { level: 1 }).first()).toBeVisible();
  }

  // Reduced motion: GlobalBackground disables the animated scene entirely.
  const reduced = await context.newPage();
  await reduced.emulateMedia({ reducedMotion: "reduce" });
  await reduced.goto("/", { waitUntil: "load" });
  expect(await reduced.locator("canvas").count()).toBe(0);
  await expect(reduced.getByRole("heading", { level: 1 }).first()).toBeVisible();
  await reduced.close();
});

test("mobile viewport (390px) is overflow-free with the Spline scene gated off", async ({ browser }) => {
  const context = await browser.newContext({ viewport: { width: 390, height: 844 } });
  const page = await context.newPage();
  const errors = collectPageErrors(page);

  await page.goto("/", { waitUntil: "load" });
  await expect(page.getByRole("heading", { level: 1 }).first()).toBeVisible();

  // Widths below 768px never mount the Spline canvas (device gating).
  expect(await page.locator("canvas").count()).toBe(0);
  await expectNoHorizontalOverflow(page);
  expect(errors).toEqual([]);

  await context.close();
});
