const assert = require('node:assert/strict');
const test = require('node:test');

const { ResumeAnalysisService } = require('../dist/services/resumeAnalysis.service.js');
const { buildSectionChecks } = require('../dist/services/ats/sections.js');
const { buildFormattingChecks } = require('../dist/services/ats/formatting.js');
const { analyseKeywords } = require('../dist/services/ats/keywords.js');
const { buildFindings } = require('../dist/services/ats/findings.js');
const { buildRecommendations } = require('../dist/services/ats/recommendations.js');

/**
 * Recommendations are the part of the dashboard a user acts on. These tests
 * pin what they may contain: one recommendation per underlying issue, ordered
 * by defined priority rules, each explaining its own trigger — and no
 * demands for sections a resume legitimately does not need.
 */

function recommendationsFor(header, sections) {
  const analysis = ResumeAnalysisService.analyse(header, sections);
  const sectionChecks = buildSectionChecks({ header, sections, analysis });
  const formattingChecks = buildFormattingChecks({ sections, analysis });
  const { weaknesses } = buildFindings({
    analysis,
    sectionChecks,
    keywords: analyseKeywords({ header, sections })
  });
  return buildRecommendations({ sectionChecks, formattingChecks, weaknesses });
}

const CONTACT = ['Ada Example', 'ada.example@example.com | +1 555 010 2024 | linkedin.com/in/adaexample'];

const STRONG_SECTIONS = {
  summary: 'Backend engineer building reliable APIs with measurable quality.',
  skills: 'TypeScript, Node.js, Express, PostgreSQL, React, GraphQL, Docker, Python',
  experience: [
    'Senior Backend Engineer',
    'Example Systems Pvt Ltd',
    'Jan 2021 - Present',
    '- Designed a reconciliation service in Node.js and PostgreSQL handling 2M rows nightly',
    '- Containerised the deploy with Docker, cutting runtime by 40% for the finance team'
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

/* ── one issue, one recommendation ───────────────────────────────────── */

test('a contact gap produces exactly one recommendation, not one per source', () => {
  const recs = recommendationsFor(['Ada Example'], STRONG_SECTIONS);

  const contactRecs = recs.filter((r) => r.id === 'rec-contact' || r.id === 'rec-missing-contact');
  assert.equal(contactRecs.length, 1, 'the weakness already speaks for the contact check');
  assert.equal(contactRecs[0].id, 'rec-missing-contact');
  assert.equal(contactRecs[0].priority, 'high', 'no email at all is high priority');
});

test('undated roles yield one recommendation even though two checks see them', () => {
  const recs = recommendationsFor(CONTACT, {
    ...STRONG_SECTIONS,
    experience: 'Senior Backend Engineer\nExample Systems Pvt Ltd\n- Designed a service'
  });

  const dateRecs = recs.filter((r) =>
    ['rec-undated-roles', 'rec-date-coverage', 'rec-date-order'].includes(r.id)
  );
  assert.equal(dateRecs.length, 1, 'the weakness suppresses every date check it covers');
  assert.equal(dateRecs[0].id, 'rec-undated-roles');
});

/* ── no generic or contradictory demands ─────────────────────────────── */

test('absent optional sections never generate demands', () => {
  const { certifications, achievements, ...core } = STRONG_SECTIONS;
  const recs = recommendationsFor(CONTACT, core);

  assert.equal(recs.find((r) => r.id === 'rec-certifications'), undefined);
  assert.equal(recs.find((r) => r.id === 'rec-achievements'), undefined);
});

test('a long career without education is not told to add one', () => {
  const { education, ...withoutEducation } = STRONG_SECTIONS;
  const recs = recommendationsFor(CONTACT, withoutEducation);

  assert.equal(
    recs.find((r) => r.id === 'rec-education' || r.id === 'rec-no-education'),
    undefined,
    'the education check is neutral for a veteran, so no recommendation may fire'
  );
});

test('a fully complete resume earns no recommendations at all', () => {
  const recs = recommendationsFor(CONTACT, STRONG_SECTIONS);
  assert.deepEqual(recs, [], 'nothing to fix must mean nothing suggested');
});

/* ── ordering and self-explanation ───────────────────────────────────── */

test('recommendations are ordered high → medium → low with stable ids', () => {
  const recs = recommendationsFor(['Ada Example'], {
    // Missing contact (high), missing summary (medium), undated achievement (low).
    skills: 'TypeScript, React',
    experience: 'Backend Engineer\nAcme Corporation\n2021 - Present\n- Built things with 40% gains',
    education: 'B.Tech Computer Science, Example Institute, 2017 - 2021',
    achievements: '- Winner, Example Hack'
  });

  assert.ok(recs.length >= 3, `expected several findings, got ${recs.length}`);
  const rank = { high: 0, medium: 1, low: 2 };
  for (let i = 1; i < recs.length; i++) {
    assert.ok(rank[recs[i - 1].priority] <= rank[recs[i].priority], 'priority must ascend');
  }

  const ids = recs.map((r) => r.id);
  assert.equal(new Set(ids).size, ids.length, 'ids must be unique');

  const lowRec = recs.find((r) => r.id === 'rec-undated-achievements');
  assert.equal(lowRec.priority, 'low');
});

test('every recommendation says why it fired and what to do', () => {
  const recs = recommendationsFor(['Ada Example'], { skills: 'TypeScript' });
  assert.ok(recs.length > 0);
  for (const rec of recs) {
    assert.ok(rec.why.length > 20, `${rec.id} must explain its trigger`);
    assert.ok(rec.action.length > 20, `${rec.id} must say what to do`);
    assert.ok(['high', 'medium', 'low'].includes(rec.priority));
  }
});

test('recommendations are deterministic', () => {
  const first = recommendationsFor(CONTACT, STRONG_SECTIONS);
  const second = recommendationsFor(CONTACT, STRONG_SECTIONS);
  assert.deepEqual(first, second);
});
