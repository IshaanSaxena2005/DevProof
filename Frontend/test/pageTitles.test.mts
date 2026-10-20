import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync, readdirSync } from "node:fs";
import { fileURLToPath } from "node:url";

/**
 * The dashboard shows one page title per screen, in the shared header.
 *
 * Every page used to repeat it — PageContainer printed an <h1> from a `title`
 * prop while the header rendered the same string from TITLE_MAP, so "REPOSI-
 * TORIES" appeared twice on every screen. The fix moved the title into the
 * header alone (as the document's only page-level heading); these tests pin
 * that shape in place, the same source-reading approach demo.test.mts uses for
 * the route wiring (there is no DOM test runner in this project).
 *
 * Verified in the browser instead: that each rendered page shows exactly one
 * visible h1, its subtitle, and its section headings.
 */

const HERE = fileURLToPath(new URL(".", import.meta.url));
const SRC = `${HERE}../src/`;

function source(relative: string): string {
  return readFileSync(`${SRC}${relative}`, "utf8");
}

/** Top-level dashboard page components (LA/ and ps/ hold sub-sections). */
const DASHBOARD_PAGES = readdirSync(`${SRC}pages/dashboard`).filter(
  (file) => file.endsWith(".tsx")
);

test("the shared page container renders a subtitle, never a second title", () => {
  const container = source("components/PageContainer.tsx");

  assert.ok(!container.includes("<h1"), "PageContainer must not render a page-level heading");

  // The destructured props (`PageContainer({...}: {`) — comments above each
  // prop may mention the word, only the props themselves are pinned.
  const props = container.split("PageContainer({")[1]?.split("}: {")[0] ?? "";
  assert.ok(!/\btitle\b/.test(props), "PageContainer takes no title prop");
  assert.ok(props.includes("description"), "PageContainer keeps rendering the page subtitle");
});

test("the shared header owns the page title as the only page-level heading", () => {
  const header = source("components/Header.tsx");

  assert.ok(header.includes("<h1"), "the header renders the page title as an h1");
  assert.ok(header.includes("TITLE_MAP"), "the header resolves the title per route");
});

test("no dashboard page renders its own page-level heading", () => {
  for (const page of DASHBOARD_PAGES) {
    const content = source(`pages/dashboard/${page}`);
    assert.ok(
      !content.includes("<h1"),
      `${page} must not repeat the header's page title as an <h1>`
    );
  }
});

test("the pages outside the dashboard keep their own headings", () => {
  assert.ok(source("components/HeroSection.tsx").includes("<h1"), "the landing hero keeps its h1");
  assert.ok(source("pages/Login.tsx").includes("<h1"), "the login page keeps its h1");
});
