const assert = require('node:assert/strict');
const test = require('node:test');

const { ResumeAnalysisService } = require('../dist/services/resumeAnalysis.service.js');
const { buildSectionChecks } = require('../dist/services/ats/sections.js');
const { buildFormattingChecks } = require('../dist/services/ats/formatting.js');
const { analyseKeywords } = require('../dist/services/ats/keywords.js');
const { scoreResume, CATEGORY_WEIGHTS } = require('../dist/services/ats/scoring.js');
const { ATS_METHODOLOGY_VERSION } = require('../dist/services/ats/types.js');

/**
 * The score is the most quoted number in this feature, so these tests pin
 * what it may and may not mean: deterministic, bounded, traceable to the
 * checks, and honest about what it could not grade.
 */

const STANDARD_KEYS = ['summary', 'experience', 'education', 'skills', 'projects', 'certifications', 'achievements'];

/** The full analysis pipeline, wired exactly as the resume service wires it. */
function scoreFor(header, sections) {
  const analysis = ResumeAnalysisService.analyse(header, sections);
  const fullText = [...header, ...Object.values(sections)].join('\n');
  return scoreResume({
    analysis,
    sectionChecks: buildSectionChecks({ header, sections, analysis }),
    formattingChecks: buildFormattingChecks({ sections, analysis }),
    keywords: analyseKeywords({ header, sections }),
    wordCount: fullText.split(/\s+/).filter(Boolean).length,
    recognisedSections: Object.keys(sections).filter((key) => STANDARD_KEYS.includes(key)).length,
    headerPresent: header.length > 0
  });
}

const STRONG_HEADER = [
  'Ada Example',
  'ada.example@example.com | +1 555 010 2024 | linkedin.com/in/adaexample | github.com/adaexample'
];

const STRONG_SECTIONS = {
  summary:
    'Backend engineer with five years of experience building reliable APIs, data pipelines and developer tooling, with an emphasis on measurable quality.',
  skills: 'TypeScript, Node.js, Express, PostgreSQL, React, GraphQL, Docker, Python',
  experience: [
    'Senior Backend Engineer',
    'Example Systems Pvt Ltd',
    'Jan 2021 - Present',
    '- Designed a reconciliation service handling 2M rows nightly',
    '- Cut batch runtime by 40% for the finance team',
    '- Set up CI/CD with GitHub Actions for six services',
    'Backend Intern',
    'Acme Analytics Pvt Ltd',
    'Jun 2020 - Aug 2020',
    '- Wrote unit tests raising coverage from 40% to 85%'
  ].join('\n'),
  education: 'B.Tech in Computer Science, Example Institute of Technology, 2017 - 2021',
  projects: [
    'Reconciliation Dashboard',
    '- Real-time finance views in React used weekly by 12 analysts across two offices',
    'https://github.com/adaexample/recon'
  ].join('\n'),
  certifications: 'AWS Certified Solutions Architect - Associate, Amazon Web Services, 2023',
  achievements: '- Winner, Example Hack 2022'
};

/* ── the happy path ──────────────────────────────────────────────────── */

test('a complete, quantified resume scores high with every category available', () => {
  const score = scoreFor(STRONG_HEADER, STRONG_SECTIONS);

  assert.ok(score.overall >= 75, `expected a strong resume to score high, got ${score.overall}`);
  assert.ok(score.overall <= 100);
  for (const category of score.categories) {
    assert.ok(category.score !== null, `${category.id} should be gradable here`);
    assert.ok(category.score >= 0 && category.score <= 100);
    assert.ok(category.summary.length > 10, `${category.id} must explain its number`);
  }
  assert.equal(score.methodologyVersion, ATS_METHODOLOGY_VERSION);
  assert.match(score.basis, /not issued by any ATS vendor/);
});

test('a name-only document scores near zero, not a flattering default', () => {
  const score = scoreFor(['Jane Doe'], {});
  assert.ok(score.overall < 25, `expected a near-empty document to score low, got ${score.overall}`);
  assert.ok(score.overall >= 0);
});

/* ── determinism and bounds ──────────────────────────────────────────── */

test('the same document always yields the same score', () => {
  const first = scoreFor(STRONG_HEADER, STRONG_SECTIONS);
  const second = scoreFor(STRONG_HEADER, STRONG_SECTIONS);
  assert.deepEqual(first, second, 'scoring must not depend on clock or randomness');
});

test('every fixture scores within 0–100', () => {
  const fixtures = [
    [STRONG_HEADER, STRONG_SECTIONS],
    [['Jane Doe'], {}],
    [['Jane', 'jane@example.com'], { skills: 'TypeScript' }],
    [['Jane'], { summary: 'Short summary here.' }]
  ];
  for (const [header, sections] of fixtures) {
    const { overall } = scoreFor(header, sections);
    assert.ok(overall >= 0 && overall <= 100, `score ${overall} escaped 0–100`);
  }
});

/* ── unavailable categories are excluded, not failed ─────────────────── */

test('a skills-only resume excludes structure and credentials from the total', () => {
  const score = scoreFor(['Ada', 'ada@example.com | linkedin.com/in/ada'], {
    skills: 'TypeScript, React, Node.js, PostgreSQL, Docker, Express'
  });

  const structure = score.categories.find((c) => c.id === 'structure');
  const credentials = score.categories.find((c) => c.id === 'credentials');
  assert.equal(structure.score, null, 'nothing to structure means ungradable, not zero');
  assert.equal(credentials.score, null);
  assert.match(structure.summary, /excluded/);
  assert.match(score.basis, /Experience & project structure/);
  assert.match(score.basis, /excluded/);

  // The total is renormalised over the remaining weight points: 100 minus
  // the 15 (structure) and 10 (credentials) that had no input.
  const availableWeight = score.categories
    .filter((c) => c.score !== null)
    .reduce((sum, c) => sum + c.weight, 0);
  assert.equal(availableWeight, 75);
});

test('formatting grades only what exists: unknown checks never fail', () => {
  const score = scoreFor(['Ada'], { skills: 'TypeScript' });
  const formatting = score.categories.find((c) => c.id === 'formatting');

  // Three of the four checks have nothing to evaluate and answer unknown;
  // the headings check is always determinable, so the category grades at
  // the value of that one check alone (needs_improvement = 0.5).
  assert.ok(formatting.score !== null);
  assert.equal(formatting.score, 50);
  assert.match(formatting.summary, /0 of 1 gradable/);
});

/* ── weights and traceability ────────────────────────────────────────── */

test('category weights sum to 100 and are published', () => {
  const sum = Object.values(CATEGORY_WEIGHTS).reduce((a, b) => a + b, 0);
  assert.equal(sum, 100);
  assert.deepEqual(CATEGORY_WEIGHTS, {
    parsing: 10,
    sections: 25,
    contact: 15,
    keywords: 20,
    structure: 15,
    credentials: 10,
    formatting: 5
  });
});

test('the overall number equals the weighted mean of available categories', () => {
  const score = scoreFor(STRONG_HEADER, STRONG_SECTIONS);
  const available = score.categories.filter((c) => c.score !== null);
  const totalWeight = available.reduce((sum, c) => sum + c.weight, 0);
  const expected = Math.round(
    available.reduce((sum, c) => sum + c.score * c.weight, 0) / totalWeight
  );
  assert.equal(score.overall, expected);
});

test('a document missing only contact details loses exactly the contact share', () => {
  const withContact = scoreFor(STRONG_HEADER, STRONG_SECTIONS);
  const withoutContact = scoreFor(['Ada Example'], STRONG_SECTIONS);

  // Contact is the only category that changed (its 15 points go to zero);
  // everything else is byte-identical input.
  const contactOnly = withContact.categories.find((c) => c.id === 'contact').score -
    withoutContact.categories.find((c) => c.id === 'contact').score;
  assert.ok(contactOnly > 0, 'removing contact must lower the contact category');

  const othersEqual = withContact.categories
    .filter((c) => c.id !== 'contact')
    .every((c) => {
      const other = withoutContact.categories.find((o) => o.id === c.id);
      return other.score === c.score;
    });
  assert.ok(othersEqual, 'categories must be independent of each other');
  assert.ok(withoutContact.overall < withContact.overall);
});
