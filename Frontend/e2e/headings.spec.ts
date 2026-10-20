/**
 * Journey D — Dashboard heading hierarchy.
 *
 * Every dashboard screen shows its page title exactly once: in the shared
 * header, as the document's only h1. The pages own subtitles and section
 * headings (h2 and below), never a second copy of the title — the duplication
 * this spec exists to keep gone.
 *
 * Also covers the shell's skip link, which is the first tab stop and moves
 * focus onto the scrollable main region.
 */
import { expect, test } from "@playwright/test";
import { STORAGE_MAIN } from "./helpers";

test.use({ storageState: STORAGE_MAIN });

/** Section id → the title the header must render for it. */
const SECTIONS: Record<string, string> = {
  overview: "Overview",
  repositories: "Repositories",
  "developer-360": "Developer 360",
  skills: "Skills",
  "problem-solving": "Problem Solving",
  learning: "Learning & Achievements",
  growth: "Growth",
  "career-readiness": "Career Readiness",
  "ai-insights": "AI Insights",
  settings: "Settings",
};

test("each dashboard section shows its page title exactly once, in the header", async ({ page }) => {
  for (const [section, title] of Object.entries(SECTIONS)) {
    await page.goto(`/dashboard/${section}`);

    const headings = page.getByRole("heading", { level: 1 });
    await expect(headings).toHaveCount(1);
    await expect(headings).toHaveText(title);

    // The single h1 is the header's, and the page body carries no rival.
    await expect(page.locator("header h1")).toHaveCount(1);
    await expect(page.locator("main h1")).toHaveCount(0);
  }
});

test("the repository detail page titles itself once, above the entity name", async ({ page }) => {
  await page.goto("/dashboard/repositories");

  // With no GitHub account connected in this test account, the list shows its
  // empty state — the page title must still come from the header alone.
  await expect(page.getByRole("heading", { level: 1 })).toHaveCount(1);
  await expect(page.locator("header h1")).toHaveText("Repositories");
  await expect(page.locator("main h1")).toHaveCount(0);
});

test("the skip link is the first tab stop and moves focus to the page content", async ({ page }) => {
  await page.goto("/dashboard/overview");

  const skip = page.getByRole("link", { name: "Skip to content" });
  // The shell is a lazy chunk behind a session restore: press Tab before it
  // mounts and the keypress walks an empty document, so wait for the layout
  // and start from a neutral focus state.
  await expect(page.locator("header h1")).toBeVisible();
  await skip.waitFor({ state: "attached" });
  await page.evaluate(() => (document.activeElement as HTMLElement | null)?.blur());
  await page.keyboard.press("Tab");

  await expect(skip).toBeFocused();
  // Focused, it reveals itself instead of staying clipped off-screen.
  await expect(skip).toBeVisible();
  const box = await skip.boundingBox();
  expect(box).not.toBeNull();
  expect(box!.width).toBeGreaterThan(40);

  await page.keyboard.press("Enter");
  await expect(page.locator("#main-content")).toBeFocused();
});
