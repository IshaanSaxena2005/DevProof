const assert = require('node:assert/strict');
const test = require('node:test');

const { ResumeAnalysisService } = require('../dist/services/resumeAnalysis.service.js');
const { buildFormattingChecks } = require('../dist/services/ats/formatting.js');

/**
 * Formatting checks only claim what the parsed text proves. These tests pin
 * both directions: real problems are flagged with evidence, and documents
 * that simply have nothing to evaluate answer "unknown" instead of failing.
 */

function checksFor(sections) {
  const analysis = ResumeAnalysisService.analyse([], sections);
  return buildFormattingChecks({ sections, analysis });
}

function byId(checks, id) {
  const check = checks.find((c) => c.id === id);
  assert.ok(check, `expected a "${id}" check`);
  return check;
}

const DATED_EXPERIENCE = [
  'Senior Backend Engineer',
  'Example Systems Pvt Ltd',
  'Jan 2021 - Present',
  '- Designed a reconciliation service',
  '- Cut batch runtime by 40%'
].join('\n');

const DATED_EDUCATION = 'B.Tech in Computer Science, Example Institute, 2017 - 2021';

/* ── date coverage ───────────────────────────────────────────────────── */

test('dated roles and education pass date coverage', () => {
  const check = byId(checksFor({ experience: DATED_EXPERIENCE, education: DATED_EDUCATION }), 'date-coverage');
  assert.equal(check.status, 'passed');
  assert.equal(check.improvement, null);
});

test('an undated role is flagged with the offending line', () => {
  const check = byId(
    checksFor({ experience: 'Senior Backend Engineer\nExample Systems Pvt Ltd\n- Designed a service' }),
    'date-coverage'
  );
  assert.equal(check.status, 'needs_improvement');
  assert.equal(check.evidence.length, 1);
  assert.match(check.evidence[0], /Senior Backend Engineer/);
  assert.match(check.improvement, /Jun 2023/);
});

test('a document with no dated sections is unknown, not failed', () => {
  const check = byId(checksFor({ skills: 'TypeScript, React' }), 'date-coverage');
  assert.equal(check.status, 'unknown');
  assert.equal(check.improvement, null, 'an unavailable check demands nothing');
});

/* ── date order ──────────────────────────────────────────────────────── */

test('a reversed period is flagged as unreadable', () => {
  const check = byId(
    checksFor({ experience: 'Engineer\nAcme Corp\n2022 - 2021\n- Work' }),
    'date-order'
  );
  assert.equal(check.status, 'needs_improvement');
  assert.match(check.detected, /ordered range/);
});

test('ordered ranges pass and no periods means unknown', () => {
  assert.equal(
    byId(checksFor({ experience: DATED_EXPERIENCE, education: DATED_EDUCATION }), 'date-order').status,
    'passed'
  );
  assert.equal(
    byId(checksFor({ projects: 'TaskFlow\n- A task manager' }), 'date-order').status,
    'unknown'
  );
});

/* ── bullets ─────────────────────────────────────────────────────────── */

test('roles without bullets are flagged; with bullets they pass', () => {
  const noBullets = byId(
    checksFor({
      experience: 'Backend Engineer\nAcme Corporation\n2021 - Present\nDid many things in prose.'
    }),
    'bullet-structure'
  );
  assert.equal(noBullets.status, 'needs_improvement');
  assert.match(checkNoBulletsMessage(noBullets), /bullet/i);

  assert.equal(byId(checksFor({ experience: DATED_EXPERIENCE }), 'bullet-structure').status, 'passed');
  assert.equal(byId(checksFor({ skills: 'TypeScript' }), 'bullet-structure').status, 'unknown');
});

function checkNoBulletsMessage(check) {
  return `${check.detected} ${check.improvement}`;
}

/* ── headings ────────────────────────────────────────────────────────── */

test('recognised headings pass; few or none are flagged', () => {
  const full = byId(
    checksFor({ summary: 'x', skills: 'TypeScript', experience: DATED_EXPERIENCE, education: DATED_EDUCATION }),
    'section-headings'
  );
  assert.equal(full.status, 'passed');
  assert.match(full.detected, /4 standard headings/);

  const none = byId(checksFor({ narrative: 'A continuous story with no recognised heading.' }), 'section-headings');
  assert.equal(none.status, 'needs_improvement');
  assert.match(none.detected, /No standard section heading/);
  assert.match(none.improvement, /Summary, Skills, Experience, Projects, Education/);

  const one = byId(checksFor({ skills: 'TypeScript' }), 'section-headings');
  assert.equal(one.status, 'needs_improvement');
  assert.match(one.detected, /Only 1 standard heading/);
});

test('every formatting check explains itself and uses honest states', () => {
  const checks = checksFor({ experience: DATED_EXPERIENCE });
  for (const check of checks) {
    assert.ok(check.whyItMatters.length > 20, `${check.id} must explain why it matters`);
    assert.ok(['passed', 'needs_improvement', 'not_detected', 'unknown'].includes(check.status));
  }
  assert.equal(checks.length, 4);
});
