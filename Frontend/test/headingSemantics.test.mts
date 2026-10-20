import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

/**
 * The dashboard's section labels are real headings, not styled paragraphs.
 *
 * The duplicate-title fix went page by page turning each page's block labels
 * (<p>SLabel</p>, <p>SectionLabel</p>, …) into h2/h3 elements: the styling
 * never changed — Tailwind's preflight makes an h2/h3 inherit the surrounding
 * font metrics — but screen readers and keyboard heading navigation now see
 * the page's real structure. These tests pin those tags in place, the same
 * source-reading approach pageTitles.test.mts and demo.test.mts use (there is
 * no DOM test runner in this project).
 *
 * Verified in the browser instead: that each rendered label still looks and
 * positions exactly as before (covered visually per page, and by the e2e
 * heading-hierarchy spec).
 */

const HERE = fileURLToPath(new URL(".", import.meta.url));
const SRC = `${HERE}../src/`;

function source(relative: string): string {
  return readFileSync(`${SRC}${relative}`, "utf8");
}

/** The body of one exported/local component definition, e.g. "function SLabel(" … ")." */
function componentBody(file: string, declaration: string): string {
  const content = source(file);
  const start = content.indexOf(declaration);
  assert.notEqual(start, -1, `${file} must define ${declaration}`);
  // Props destructured across several lines end in "}: {" at column 0 — skip
  // past the whole signature ("}) {") before looking for the closing brace.
  const signatureEnd = content.indexOf(") {", start);
  assert.notEqual(signatureEnd, -1, `${file}: ${declaration} must end its signature`);
  const end = content.indexOf("\n}", signatureEnd);
  assert.notEqual(end, -1, `${file}: ${declaration} body must end with "\\n}"`);
  return content.slice(start, end);
}

/* ────────────────────────────────────────────────────────────
   Page section labels — the page's h2 level
   ──────────────────────────────────────────────────────────── */

test("problem-solving section labels render as h2", () => {
  const body = componentBody("pages/dashboard/ps/shared.tsx", "export function SectionLabel(");
  assert.ok(body.includes("<h2"), "ps SectionLabel must render an <h2>");
  assert.ok(!body.includes("<p"), "ps SectionLabel must not fall back to a <p>");
});

test("learning section labels render as h2", () => {
  const body = componentBody("pages/dashboard/LA/shared.tsx", "export function LALabel(");
  assert.ok(body.includes("<h2"), "LALabel must render an <h2>");
  assert.ok(!body.includes("<p"), "LALabel must not fall back to a <p>");
});

test("developer-360 section labels render as h2", () => {
  const body = componentBody("pages/dashboard/Developer360.tsx", "function SLabel(");
  assert.ok(body.includes("<h2"), "developer-360 SLabel must render an <h2>");
});

test("growth section labels render as h2", () => {
  const body = componentBody("pages/dashboard/Growth.tsx", "function SLabel(");
  assert.ok(body.includes("<h2"), "growth SLabel must render an <h2>");
});

test("career-readiness section labels render as h2", () => {
  const body = componentBody("pages/dashboard/CareerReadiness.tsx", "function SLabel(");
  assert.ok(body.includes("<h2"), "career-readiness SLabel must render an <h2>");
});

test("repository-details section labels render as h2", () => {
  const body = componentBody(
    "pages/dashboard/RepositoryDetails.tsx",
    "function SectionLabel("
  );
  assert.ok(body.includes("<h2"), "repository-details SectionLabel must render an <h2>");
});

/* ────────────────────────────────────────────────────────────
   Inner block labels — a level below the section labels
   ──────────────────────────────────────────────────────────── */

test("growth card block labels render as h3, under the section h2s", () => {
  const body = componentBody("pages/dashboard/Growth.tsx", "function BlockLabel(");
  assert.ok(body.includes("<h3"), "growth BlockLabel must render an <h3>");
});

test("resume section sub-headings render as h3, under the learning h2s", () => {
  const body = componentBody(
    "pages/dashboard/LA/ResumeSection.tsx",
    "function SectionHeading("
  );
  assert.ok(body.includes("<h3"), "resume SectionHeading must render an <h3>");
});

/* ────────────────────────────────────────────────────────────
   Micro-labels stay paragraphs — they caption values, not sections
   ──────────────────────────────────────────────────────────── */

test("stat micro-labels stay paragraphs (captions, not headings)", () => {
  const ps = componentBody("pages/dashboard/ps/shared.tsx", "export function StatLabel(");
  const la = componentBody("pages/dashboard/LA/shared.tsx", "export function LAStatLabel(");
  assert.ok(ps.includes("<p"), "ps StatLabel captions a value and stays a <p>");
  assert.ok(la.includes("<p"), "LAStatLabel captions a value and stays a <p>");
});
