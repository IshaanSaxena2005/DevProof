const assert = require('node:assert/strict');
const test = require('node:test');

const { ResumeAnalysisService } = require('../dist/services/resumeAnalysis.service.js');
const { buildSectionChecks } = require('../dist/services/ats/sections.js');
const { analyseKeywords } = require('../dist/services/ats/keywords.js');
const { buildFindings } = require('../dist/services/ats/findings.js');

/**
 * Findings are what the user actually reads. These tests pin the two rules
 * that make them trustworthy: strengths must cite the lines that support
 * them, and weaknesses must never tell anyone to fabricate experience.
 */

function findingsFor(header, sections) {
  const analysis = ResumeAnalysisService.analyse(header, sections);
  return buildFindings({
    analysis,
    sectionChecks: buildSectionChecks({ header, sections, analysis }),
    keywords: analyseKeywords({ header, sections })
  });
}

function strength(strengths, id) {
  const found = strengths.find((s) => s.id === id);
  assert.ok(found, `expected strength "${id}"`);
  return found;
}

function weakness(weaknesses, id) {
  const found = weaknesses.find((w) => w.id === id);
  assert.ok(found, `expected weakness "${id}"`);
  return found;
}

const STRONG_HEADER = [
  'Ada Example',
  'ada.example@example.com | +1 555 010 2024 | linkedin.com/in/adaexample'
];

const STRONG_SECTIONS = {
  summary: 'Backend engineer building reliable APIs with measurable quality.',
  skills: 'TypeScript, Node.js, Express, PostgreSQL, React, GraphQL, Docker, Python',
  experience: [
    'Senior Backend Engineer',
    'Example Systems Pvt Ltd',
    'Jan 2021 - Present',
    '- Designed a reconciliation service in Node.js and PostgreSQL handling 2M rows nightly',
    '- Containerised the deploy with Docker, cutting runtime by 40% for the finance team',
    '- Set up CI/CD for six services'
  ].join('\n'),
  education: 'B.Tech in Computer Science, Example Institute of Technology, 2017 - 2021',
  projects: [
    'Reconciliation Dashboard',
    '- Real-time finance views in React used weekly by 12 analysts',
    'https://github.com/adaexample/recon'
  ].join('\n'),
  certifications: 'AWS Certified Solutions Architect - Associate, Amazon Web Services, 2023',
  achievements: '- Winner, Example Hack 2022'
};

/* ── strengths ───────────────────────────────────────────────────────── */

test('a complete resume earns its strengths, each with evidence', () => {
  const { strengths, weaknesses } = findingsFor(STRONG_HEADER, STRONG_SECTIONS);

  for (const id of [
    'complete-contact',
    'summary-present',
    'quantified-impact',
    'structured-roles',
    'skills-breadth',
    'skills-in-context',
    'projects-described',
    'education-clear',
    'certificates-attributable',
    'achievements-dated'
  ]) {
    strength(strengths, id);
  }
  assert.deepEqual(weaknesses, [], 'this fixture has no evidenced gap to report');

  for (const s of strengths) {
    assert.ok(s.evidence.length > 0, `strength ${s.id} must cite evidence`);
    assert.ok(s.explanation.length > 20);
  }
});

test('quantified-impact counts only bullets that state a number', () => {
  const { strengths } = findingsFor(STRONG_HEADER, {
    ...STRONG_SECTIONS,
    experience: [
      'Senior Backend Engineer',
      'Example Systems Pvt Ltd',
      'Jan 2021 - Present',
      '- Designed a reconciliation service',
      '- Documented the runbook'
    ].join('\n')
  });
  assert.equal(strengths.find((s) => s.id === 'quantified-impact'), undefined);
});

/* ── weaknesses ──────────────────────────────────────────────────────── */

test('a missing email is a high-severity weakness, a missing link only medium', () => {
  const { weaknesses: noEmail } = findingsFor(['Ada', '+1 555 010 2024'], STRONG_SECTIONS);
  assert.equal(weakness(noEmail, 'missing-contact').severity, 'high');

  const { weaknesses: noLink } = findingsFor(
    ['Ada', 'ada@example.com | +1 555 010 2024'],
    STRONG_SECTIONS
  );
  assert.equal(weakness(noLink, 'missing-contact').severity, 'medium');
});

test('duty-shaped bullets are called out with placeholder-only examples', () => {
  const { weaknesses } = findingsFor(STRONG_HEADER, {
    ...STRONG_SECTIONS,
    experience: [
      'Senior Backend Engineer',
      'Example Systems Pvt Ltd',
      'Jan 2021 - Present',
      '- Responsible for the billing service',
      '- Worked on dashboard improvements',
      '- Helped the team with deployments'
    ].join('\n')
  });

  const weak = weakness(weaknesses, 'weak-action-verbs');
  assert.equal(weak.severity, 'low');
  assert.match(weak.evidence[0], /Responsible for/);
});

test('an early-career resume with no evidence carrier says so, without inventing one', () => {
  const { weaknesses } = findingsFor(
    ['Ada Example', 'ada@example.com'],
    { education: 'B.Tech in Computer Science, Example Institute, 2023 - 2027', skills: 'Python' }
  );

  const carrier = weakness(weaknesses, 'no-evidence-carrier');
  assert.equal(carrier.severity, 'high');
  assert.match(carrier.recommendation, /Do not pad/);
});

test('an experienced resume with no projects is not shamed for it', () => {
  const { weaknesses } = findingsFor(STRONG_HEADER, {
    ...STRONG_SECTIONS,
    projects: undefined
  });
  assert.equal(weaknesses.find((w) => w.id === 'no-evidence-carrier'), undefined);
  assert.equal(weaknesses.find((w) => w.id === 'thin-projects'), undefined);
});

test('every weakness carries a severity, a fix, and no invented facts', () => {
  const { weaknesses } = findingsFor(['Ada'], { skills: 'TypeScript' });
  assert.ok(weaknesses.length > 0);
  for (const w of weaknesses) {
    assert.ok(['high', 'medium', 'low'].includes(w.severity));
    assert.ok(w.recommendation.length > 20, `${w.id} must say how to fix it`);
    assert.ok(w.explanation.length > 20);
    // Examples may only use placeholders for facts the user must supply.
    if (w.example) {
      assert.ok(
        /\[/.test(w.example),
        `${w.id}'s example must use [placeholders] for the user's facts`
      );
    }
  }
});

test('weaknesses are ordered by severity, strengths alphabetically', () => {
  const { strengths, weaknesses } = findingsFor(['Ada'], {
    experience: 'Backend Engineer\nAcme Corporation\n2021 - Present\n- Responsible for things'
  });
  const order = weaknesses.map((w) => w.severity);
  const rank = { high: 0, medium: 1, low: 2 };
  for (let i = 1; i < order.length; i++) {
    assert.ok(rank[order[i - 1]] <= rank[order[i]], 'severity order must ascend');
  }
  const ids = strengths.map((s) => s.id);
  assert.deepEqual(ids, [...ids].sort());
});
