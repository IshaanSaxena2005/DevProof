const assert = require('node:assert/strict');
const test = require('node:test');

const { ResumeAnalysisService } = require('../dist/services/resumeAnalysis.service.js');
const {
  buildSectionChecks,
  isEarlyCareer,
  totalExperienceMonths
} = require('../dist/services/ats/sections.js');

/**
 * Section checks are the first layer of the ATS analysis: what the document
 * contains, stated with four honest outcomes. These tests pin the rules that
 * keep those outcomes fair across career stages — a fresher with no
 * experience section is not failing the same check a ten-year engineer is.
 */

function checksFor(header, sections) {
  const analysis = ResumeAnalysisService.analyse(header, sections);
  return buildSectionChecks({ header, sections, analysis });
}

function byId(checks, id) {
  const check = checks.find((c) => c.id === id);
  assert.ok(check, `expected a "${id}" check`);
  return check;
}

const CONTACT_HEADER = [
  'Ada Example',
  'ada.example@example.com | +1 555 010 2024 | linkedin.com/in/adaexample'
];

const FULL_SECTIONS = {
  summary: 'Backend engineer focused on reliable APIs and data pipelines.',
  skills: 'TypeScript, Node.js, PostgreSQL, Docker',
  experience: [
    'Senior Backend Engineer',
    'Example Systems Pvt Ltd',
    '2021 - Present',
    '- Designed a reconciliation service',
    '- Cut batch runtime by 40% for the finance team'
  ].join('\n'),
  education: 'B.Tech in Computer Science, Example Institute of Technology, 2017 - 2021',
  projects: [
    'Reconciliation Dashboard',
    '- Real-time views using React for the finance team, used weekly by 12 analysts',
    'https://github.com/adaexample/recon'
  ].join('\n'),
  certifications: 'AWS Certified Solutions Architect - Associate, Amazon Web Services, 2023',
  achievements: '- Winner, Example Hack 2022'
};

/* ── contact ─────────────────────────────────────────────────────────── */

test('a complete contact block passes', () => {
  const check = byId(checksFor(CONTACT_HEADER, FULL_SECTIONS), 'contact');
  assert.equal(check.status, 'passed');
  assert.equal(check.improvement, null);
  assert.match(check.detected, /email/);
  assert.match(check.detected, /phone/);
  assert.match(check.detected, /profile link/);
});

test('an email without a phone is needs_improvement, not a total failure', () => {
  const check = byId(checksFor(['Ada Example', 'ada.example@example.com'], FULL_SECTIONS), 'contact');
  assert.equal(check.status, 'needs_improvement');
  assert.match(check.improvement, /phone/);
});

test('no contact details at all is not_detected with named gaps', () => {
  const check = byId(checksFor(['Ada Example'], FULL_SECTIONS), 'contact');
  assert.equal(check.status, 'not_detected');
  assert.match(check.improvement, /email/);
  assert.match(check.improvement, /phone/);
});

/* ── summary ─────────────────────────────────────────────────────────── */

test('a real summary passes and a document-sized one is refused honestly', () => {
  assert.equal(byId(checksFor(CONTACT_HEADER, FULL_SECTIONS), 'summary').status, 'passed');

  const wholeDocument = Array(200).fill('word').join(' ');
  const check = byId(checksFor(CONTACT_HEADER, { summary: wholeDocument }), 'summary');
  assert.equal(check.status, 'needs_improvement');
  assert.match(check.improvement, /heading/i);
});

test('an absent summary is not_detected with actionable wording', () => {
  const { summary, ...withoutSummary } = FULL_SECTIONS;
  const check = byId(checksFor(CONTACT_HEADER, withoutSummary), 'summary');
  assert.equal(check.status, 'not_detected');
  assert.match(check.improvement, /2–3 line summary/);
});

/* ── skills ──────────────────────────────────────────────────────────── */

test('a skills section with named technologies passes', () => {
  assert.equal(byId(checksFor(CONTACT_HEADER, FULL_SECTIONS), 'skills').status, 'passed');
});

test('a missing skills section asks for one by name', () => {
  const { skills, ...withoutSkills } = FULL_SECTIONS;
  const check = byId(checksFor(CONTACT_HEADER, withoutSkills), 'skills');
  assert.equal(check.status, 'not_detected');
  assert.match(check.improvement, /"Skills"/);
});

/* ── experience, with career context ─────────────────────────────────── */

test('structured experience with organisations and dates passes', () => {
  const check = byId(checksFor(CONTACT_HEADER, FULL_SECTIONS), 'experience');
  assert.equal(check.status, 'passed');
  assert.match(check.detected, /2 structured roles|1 structured role|structured role/);
});

test('experience entries missing dates are needs_improvement with a count', () => {
  const check = byId(
    checksFor(CONTACT_HEADER, {
      ...FULL_SECTIONS,
      experience: 'Senior Backend Engineer\nExample Systems Pvt Ltd\n- Designed a reconciliation service'
    }),
    'experience'
  );
  assert.equal(check.status, 'needs_improvement');
  assert.match(check.detected, /without readable dates/);
});

test('an early-career resume without experience is told projects can carry it', () => {
  const { experience, ...withoutExperience } = FULL_SECTIONS;
  const header = ['Ada Example', 'ada.example@example.com'];
  const check = byId(checksFor(header, withoutExperience), 'experience');
  assert.equal(check.status, 'not_detected');
  assert.match(check.improvement, /projects section can carry/);

  // The same document is early career: recent education, no experience.
  const analysis = ResumeAnalysisService.analyse(header, withoutExperience);
  assert.equal(isEarlyCareer(analysis), true);
});

test('a long career without any experience section is a plain gap', () => {
  const header = ['Ada Example', 'ada.example@example.com'];
  const check = byId(
    checksFor(header, { projects: 'Reconciliation Dashboard\n- Real-time views for analysts' }),
    'experience'
  );
  assert.equal(check.status, 'not_detected');
  assert.doesNotMatch(check.improvement, /projects section can carry/);
});

/* ── projects and education, weighted by career stage ────────────────── */

test('a project without a description is thin; one with a sentence passes', () => {
  const thin = byId(
    checksFor(CONTACT_HEADER, { projects: 'TaskFlow\ngithub.com/ada/taskflow' }),
    'projects'
  );
  assert.equal(thin.status, 'needs_improvement');

  const described = byId(checksFor(CONTACT_HEADER, FULL_SECTIONS), 'projects');
  assert.equal(described.status, 'passed');
});

test('an experienced resume is not pressured to add projects', () => {
  const { projects, ...withoutProjects } = FULL_SECTIONS;
  const check = byId(checksFor(CONTACT_HEADER, withoutProjects), 'projects');
  assert.equal(check.status, 'not_detected');
  assert.match(check.improvement, /Optional at your experience level/);
});

test('education with institution and dates passes; missing dates are flagged', () => {
  assert.equal(byId(checksFor(CONTACT_HEADER, FULL_SECTIONS), 'education').status, 'passed');

  const check = byId(
    checksFor(CONTACT_HEADER, { ...FULL_SECTIONS, education: 'B.Tech in Computer Science, Example Institute' }),
    'education'
  );
  assert.equal(check.status, 'needs_improvement');
  assert.match(check.detected, /missing an institution or dates/);
});

test('education absence is neutral wording for a long career', () => {
  const { education, ...withoutEducation } = FULL_SECTIONS;
  const check = byId(checksFor(CONTACT_HEADER, withoutEducation), 'education');
  assert.equal(check.status, 'not_detected');
  assert.match(check.improvement, /Optional at this stage/);
});

/* ── certifications and achievements: never required ─────────────────── */

test('absent certifications produce no demand to add them', () => {
  const { certifications, ...withoutCerts } = FULL_SECTIONS;
  const check = byId(checksFor(CONTACT_HEADER, withoutCerts), 'certifications');
  assert.equal(check.status, 'not_detected');
  assert.match(check.improvement, /No action needed unless/);
});

test('a certification without an issuer asks for attribution', () => {
  const check = byId(
    checksFor(CONTACT_HEADER, { ...FULL_SECTIONS, certifications: 'Certificate of Completion in Machine Learning' }),
    'certifications'
  );
  assert.equal(check.status, 'needs_improvement');
  assert.match(check.detected, /without a recognisable issuer/);
});

test('undated achievements ask for a year; dated ones pass', () => {
  const undated = byId(checksFor(CONTACT_HEADER, { ...FULL_SECTIONS, achievements: '- Winner, Example Hack' }), 'achievements');
  assert.equal(undated.status, 'needs_improvement');
  assert.match(undated.improvement, /Add the year/);

  assert.equal(byId(checksFor(CONTACT_HEADER, FULL_SECTIONS), 'achievements').status, 'passed');
});

/* ── helpers ─────────────────────────────────────────────────────────── */

test('total experience months sums only readable periods', () => {
  const analysis = ResumeAnalysisService.analyse(CONTACT_HEADER, {
    experience: [
      'Senior Backend Engineer',
      'Example Systems Pvt Ltd',
      'Jan 2021 - Dec 2022',
      '- Work',
      'Backend Intern',
      'Acme Analytics Pvt Ltd',
      'Jun 2020 - Aug 2020',
      '- More work'
    ].join('\n')
  });
  // 23 months + 2 months.
  assert.equal(totalExperienceMonths(analysis), 25);
  assert.equal(isEarlyCareer(analysis), false, '25 stated months is not early career');

  const noExperience = ResumeAnalysisService.analyse([], {});
  assert.equal(totalExperienceMonths(noExperience), null);
});

test('every check carries a why-it-matters explanation and stable id', () => {
  const checks = checksFor(CONTACT_HEADER, FULL_SECTIONS);
  assert.equal(checks.length, 8);
  for (const check of checks) {
    assert.ok(check.whyItMatters.length > 20, `${check.id} must explain why it matters`);
    assert.ok(['passed', 'needs_improvement', 'not_detected', 'unknown'].includes(check.status));
  }
});
