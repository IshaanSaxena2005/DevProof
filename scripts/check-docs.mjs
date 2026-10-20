#!/usr/bin/env node
/**
 * Documentation validator — zero dependencies, safe to run anywhere.
 *
 * Guards the promises the README makes:
 *  1. every relative link resolves to a file in the repository;
 *  2. every in-document / cross-document `#anchor` matches a real heading
 *     (GitHub slug rules: lowercase, word chars / hyphens / spaces only);
 *  3. every image reference resolves to a file that exists;
 *  4. docs/screenshots.md carries the full planned screenshot set;
 *  5. the README never references a screenshots/*.png that is not on disk —
 *     the "no broken image links" rule the Product Screenshots section lives by.
 *
 * External (http/https) links are not fetched: CI should not depend on
 * third-party availability. Run with: node scripts/check-docs.mjs
 */
import { readFileSync, existsSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const failures = [];

/** GitHub-style heading slug. */
function slugify(heading) {
  return heading
    .trim()
    .toLowerCase()
    .replace(/[^\w\- ]/g, "")
    .replace(/ /g, "-");
}

/** Every heading slug in a root-relative markdown file. */
function headingSlugs(file) {
  const text = readFileSync(path.join(ROOT, file), "utf8");
  const slugs = new Set();
  for (const line of text.split("\n")) {
    const m = /^#{1,6}\s+(.+?)\s*$/.exec(line);
    if (m) slugs.add(slugify(m[1].replace(/\*\*/g, "").replace(/`/g, "")));
  }
  return slugs;
}

function checkMarkdown(file) {
  const text = readFileSync(path.join(ROOT, file), "utf8");
  const dir = path.dirname(path.join(ROOT, file));
  const ownSlugs = headingSlugs(file);

  // Code spans, fenced blocks, and HTML comments document patterns — `![caption]
  // (screenshots/…)` in a checklist is an example, not a live link — so
  // link and image scanning runs on the code-stripped text.
  const scan = text.replace(/```[\s\S]*?```/g, "").replace(/`[^`\n]*`/g, "").replace(/<!--[\s\S]*?-->/g, "");

  // Links (image links included; images get an existence check below too).
  for (const m of scan.matchAll(/\[[^\]]*\]\(([^)\s]+)\)/g)) {
    const target = m[1];
    if (/^(https?:|mailto:)/.test(target)) continue;

    const [rawPath, anchor] = target.split("#");
    if (rawPath === "") {
      if (anchor && !ownSlugs.has(anchor)) failures.push(`${file}: dead in-file anchor #${anchor}`);
      continue;
    }
    const resolved = path.resolve(dir, rawPath);
    if (!resolved.startsWith(ROOT)) {
      failures.push(`${file}: link escapes the repository: ${target}`);
      continue;
    }
    if (!existsSync(resolved)) {
      failures.push(`${file}: missing linked file ${rawPath}`);
      continue;
    }
    if (anchor && resolved.endsWith(".md")) {
      const targetSlugs = headingSlugs(path.relative(ROOT, resolved));
      if (!targetSlugs.has(anchor)) failures.push(`${file}: dead anchor ${rawPath}#${anchor}`);
    }
  }

  // Images must exist locally (external images are not fetched).
  for (const m of scan.matchAll(/!\[[^\]]*\]\(([^)\s]+)\)/g)) {
    const src = m[1];
    if (/^https?:/.test(src)) continue;
    if (!existsSync(path.resolve(dir, src))) failures.push(`${file}: missing image ${src}`);
  }
}

/** The canonical planned capture set (see the README's screenshot section). */
const PLANNED_SCREENSHOTS = [
  "01-landing-page",
  "02-login-register",
  "03-demo-overview",
  "04-dashboard-overview",
  "05-repositories",
  "06-repository-analysis",
  "07-developer-360",
  "08-skills-intelligence",
  "09-problem-solving",
  "10-learning-achievements",
  "11-growth-analytics",
  "12-career-readiness",
  "13-ai-insights",
  "14-settings",
  "15-mobile-responsive",
];

checkMarkdown("README.md");
if (existsSync(path.join(ROOT, "docs", "screenshots.md"))) {
  checkMarkdown("docs/screenshots.md");
}

if (existsSync(path.join(ROOT, "docs", "screenshots.md"))) {
  const checklist = readFileSync(path.join(ROOT, "docs", "screenshots.md"), "utf8");
  for (const name of PLANNED_SCREENSHOTS) {
    if (!checklist.includes(`screenshots/${name}.png`)) {
      failures.push(`docs/screenshots.md: planned filename absent from the checklist: ${name}.png`);
    }
  }
}

const readme = readFileSync(path.join(ROOT, "README.md"), "utf8");
// Ignore commented-out screenshot references
const readmeWithoutComments = readme.replace(/<!--[\s\S]*?-->/g, "");
for (const m of readmeWithoutComments.matchAll(/screenshots\/([\w-]+\.png)/g)) {
  if (!existsSync(path.join(ROOT, "screenshots", m[1]))) {
    failures.push(`README.md: references a screenshot that does not exist: ${m[1]}`);
  }
}

if (failures.length > 0) {
  console.error("Documentation validation FAILED:");
  for (const f of failures) console.error(`  - ${f}`);
  process.exit(1);
}
console.log("Documentation validation passed: links, anchors, images and the screenshot checklist are consistent.");
