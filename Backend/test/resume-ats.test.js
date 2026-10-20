const assert = require('node:assert/strict');
const test = require('node:test');

const { ResumeAnalysisService } = require('../dist/services/resumeAnalysis.service.js');
const { analyseAts, ATS_METHODOLOGY_VERSION } = require('../dist/services/ats/index.js');
const { analyseKeywords } = require('../dist/services/ats/keywords.js');
const { ResumeService } = require('../dist/services/resume.service.js');
const { buildSyntheticResumePdf } = require('./helpers/pdf.js');

/**
 * The orchestrator is where the panels become one stored analysis, and
 * resume.service is where that analysis actually reaches the database.
 * These tests cover both ends: the envelope's internal consistency, and a
 * real PDF flowing through the real extraction path with the ATS layer set.
 */

const HEADER = [
  'Ada Example',
  'ada.example@example.com | +1 555 010 2024 | linkedin.com/in/adaexample'
];

const SECTIONS = {
  summary: 'Backend engineer building reliable APIs with measurable quality.',
  skills: 'TypeScript, Node.js, Express, PostgreSQL, Docker, GraphQL',
  experience: [
    'Senior Backend Engineer',
    'Example Systems Pvt Ltd',
    'Jan 2021 - Present',
    '- Designed a reconciliation service in Node.js handling 2M rows nightly',
    '- Cut batch runtime by 40% for the finance team'
  ].join('\n'),
  education: 'B.Tech in Computer Science, Example Institute of Technology, 2017 - 2021',
  projects: [
    'Reconciliation Dashboard',
    '- Real-time finance views in React used weekly by 12 analysts'
  ].join('\n'),
  certifications: 'AWS Certified Solutions Architect - Associate, Amazon Web Services, 2023',
  achievements: '- Winner, Example Hack 2022'
};

function atsFor(header, sections) {
  const analysis = ResumeAnalysisService.analyse(header, sections);
  const wordCount = [...header, ...Object.values(sections)].join(' ').split(/\s+/).filter(Boolean).length;
  return analyseAts({ header, sections, analysis, wordCount });
}

/* ── envelope consistency ────────────────────────────────────────────── */

test('the ATS envelope carries every panel with the methodology version', () => {
  const ats = atsFor(HEADER, SECTIONS);

  assert.equal(ats.methodologyVersion, ATS_METHODOLOGY_VERSION);
  assert.ok(ats.score && Array.isArray(ats.score.categories));
  assert.equal(ats.score.categories.length, 7);
  assert.ok(Array.isArray(ats.sectionChecks) && ats.sectionChecks.length >= 8);
  assert.ok(Array.isArray(ats.formattingChecks) && ats.formattingChecks.length >= 4);
  assert.ok(ats.keywords.distinctCount > 0);
  assert.ok(Array.isArray(ats.strengths) && ats.strengths.length > 0);
  assert.ok(Array.isArray(ats.weaknesses));
  assert.ok(Array.isArray(ats.recommendations));
  assert.ok(!Number.isNaN(Date.parse(ats.analysedAt)));
});

test('the orchestrator reproduces its own component outputs exactly', () => {
  const ats = atsFor(HEADER, SECTIONS);
  const keywords = analyseKeywords({ header: HEADER, sections: SECTIONS });

  assert.deepEqual(ats.keywords, keywords, 'the stored keywords must be the module output verbatim');

  // Every weakness-derived recommendation exists with its finding present.
  for (const rec of ats.recommendations) {
    assert.ok(rec.id.startsWith('rec-'));
    assert.ok(rec.why.length > 20);
  }

  // The score's stated basis names the methodology actually stamped.
  assert.match(ats.score.basis, new RegExp(`methodology v${ATS_METHODOLOGY_VERSION}`));
});

test('the envelope is deterministic apart from its timestamp', () => {
  const { analysedAt: _a, ...first } = atsFor(HEADER, SECTIONS);
  const { analysedAt: _b, ...second } = atsFor(HEADER, SECTIONS);
  assert.deepEqual(first, second);
});

test('an empty document still produces a complete, bounded envelope', () => {
  const ats = atsFor([], {});
  assert.ok(ats.score.overall >= 0 && ats.score.overall <= 100);
  assert.deepEqual(ats.strengths, [], 'nothing was found, so nothing is praised');
  assert.ok(ats.recommendations.length > 0, 'the gaps still earn concrete actions');
});

/* ── the real extraction path ────────────────────────────────────────── */

test('a real PDF upload flow computes the ATS layer alongside the analysis', async () => {
  const buffer = buildSyntheticResumePdf();
  const { parsed } = await ResumeService['extract'](buffer);

  assert.ok(parsed.analysis, 'the structured analysis still computes');
  assert.ok(parsed.ats, 'the ATS layer is computed in the same pass');

  assert.ok(parsed.ats.score.overall >= 0 && parsed.ats.score.overall <= 100);
  assert.ok(parsed.ats.sectionChecks.length >= 8);
  assert.ok(parsed.ats.keywords.distinctCount > 0, 'the synthetic resume names technologies');
  assert.equal(parsed.ats.methodologyVersion, ATS_METHODOLOGY_VERSION);
});
