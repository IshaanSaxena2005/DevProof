const assert = require('node:assert/strict');
const test = require('node:test');

const { ResumeAnalysisService } = require('../dist/services/resumeAnalysis.service.js');
const { matchJobDescription, JOB_MATCH_VERSION } = require('../dist/services/ats/jobMatch.js');

/**
 * Job matching is the one place a user is most tempted to over-read a
 * number. These tests pin what it may claim: exact canonical matches only,
 * related terms surfaced but never scored, "not evidenced" instead of
 * "you lack it", and an honest null when the posting yields nothing to grade.
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
    '- Designed a reconciliation service in Node.js and PostgreSQL handling 2M rows nightly',
    '- Containerised the deploy with Docker, cutting runtime by 40%',
    '- Set up CI/CD for six services'
  ].join('\n'),
  education: 'B.Tech in Computer Science, Example Institute of Technology, 2017 - 2021',
  projects: [
    'Reconciliation Dashboard',
    '- Real-time finance views in React used weekly by 12 analysts'
  ].join('\n'),
  certifications: 'AWS Certified Solutions Architect - Associate, Amazon Web Services, 2023'
};

const JD = [
  'Senior Backend Engineer',
  'Requirements:',
  '- 3+ years of experience building backend services',
  '- Bachelor degree in Computer Science or equivalent',
  '- Strong skills in TypeScript, Node.js, Express, PostgreSQL',
  '- MySQL',
  '- Experience with Kubernetes',
  'Nice to have:',
  '- Redis',
  '- CI/CD',
  '- Certification is a plus'
].join('\n');

function match(jobDescription = JD) {
  const analysis = ResumeAnalysisService.analyse(HEADER, SECTIONS);
  return matchJobDescription({ jobDescription, header: HEADER, sections: SECTIONS, analysis });
}

function requirement(list, label) {
  const found = list.find((r) => r.label === label);
  assert.ok(found, `expected requirement "${label}"`);
  return found;
}

/* ── exact matches, with evidence ────────────────────────────────────── */

test('terms named in both texts match, each carrying resume evidence', () => {
  const result = match();

  const ts = requirement(result.matched, 'TypeScript');
  assert.equal(ts.status, 'matched');
  assert.ok(ts.sections.includes('skills'));
  assert.ok(ts.evidence.length > 0, 'a match must cite the resume line');

  assert.equal(requirement(result.matched, 'PostgreSQL').status, 'matched');
  assert.equal(requirement(result.matched, 'CI/CD').kind, 'concept');
});

/* ── missing requirements are unverified, never disproven ────────────── */

test('a required term the resume never names is not_evidenced with related context', () => {
  const result = match();

  const mysql = requirement(result.notEvidenced, 'MySQL');
  assert.equal(mysql.status, 'not_evidenced');
  assert.equal(mysql.source, 'required');
  assert.deepEqual(mysql.sections, []);
  // Same category: PostgreSQL is shown as context but never counted as MySQL.
  assert.ok(mysql.related.includes('PostgreSQL'));

  const k8s = requirement(result.notEvidenced, 'Kubernetes');
  assert.ok(k8s.related.includes('Docker'), 'same-category context surfaces here too');
});

test('the global note keeps mention and proficiency apart', () => {
  const result = match();
  assert.match(result.note, /not proof of proficiency/);
  assert.match(result.note, /not that you lack it/);
});

test('preferred gaps are labelled preferred, not demanded', () => {
  const result = match();
  const redis = requirement(result.notEvidenced, 'Redis');
  assert.equal(redis.source, 'preferred');
});

/* ── score ───────────────────────────────────────────────────────────── */

test('the match score is transparent, bounded and separate from the ATS score', () => {
  const result = match();

  assert.equal(result.score.methodologyVersion, JOB_MATCH_VERSION);
  assert.ok(result.score.overall !== null && result.score.overall >= 0 && result.score.overall <= 100);
  assert.match(result.score.basis, /not a prediction of interview selection/);
  assert.equal('overall' in result.score && result.score.overall, result.score.overall);
  // Nothing in the result pretends to be the ATS compatibility score.
  assert.equal(result.score.atsScore, undefined);

  const requiredPart = result.score.parts.find((p) => p.label.startsWith('Required skills'));
  assert.ok(requiredPart);
  assert.equal(requiredPart.weight, 60);
  assert.match(requiredPart.summary, /6 required|of 6 required/, 'counts must be visible');
  // 4 of 6 required terms are named (TypeScript, Node.js, Express, PostgreSQL).
  assert.equal(requiredPart.score, Math.round((4 / 6) * 100));
});

test('an unverifiable experience requirement is excluded, not failed', () => {
  const undated = { ...SECTIONS, experience: 'Senior Backend Engineer\nExample Systems Pvt Ltd\n- Built things' };
  const analysis = ResumeAnalysisService.analyse(HEADER, undated);
  const result = matchJobDescription({ jobDescription: JD, header: HEADER, sections: undated, analysis });

  const expPart = result.score.parts.find((p) => p.label.startsWith('Stated experience'));
  assert.equal(expPart.score, null, 'no readable dates means ungradable');
  assert.match(expPart.summary, /cannot be verified either way/);
});

test('matching is deterministic apart from its timestamp', () => {
  const first = match();
  const second = match();
  const { matchedAt: _a, ...restFirst } = first;
  const { matchedAt: _b, ...restSecond } = second;
  assert.deepEqual(restFirst, restSecond);
});

/* ── empty and requirement-free descriptions ─────────────────────────── */

test('an empty job description produces no score and no demands', () => {
  const result = match('   \n  ');
  assert.equal(result.score.overall, null);
  assert.match(result.score.basis, /No requirements could be read/);
  assert.deepEqual(result.matched, []);
  assert.deepEqual(result.notEvidenced, []);
  assert.deepEqual(result.tailoring, []);
});

test('a description with no readable requirements stays honest instead of scoring zero', () => {
  const result = match('Join our amazing team of builders!');
  assert.equal(result.score.overall, null);
  assert.equal(result.detected.requiredSkills, 0);
});

/* ── detected requirements and tailoring ─────────────────────────────── */

test('experience, education and certification requirements are detected from the posting', () => {
  const result = match();

  assert.equal(result.detected.experienceYears, 3);
  assert.equal(result.detected.educationRequired, true);
  assert.equal(result.detected.certificationMentioned, true);
  assert.ok(result.detected.preferredSkills >= 2);

  assert.equal(requirement(result.matched, '3+ years of experience').status, 'matched');
  assert.equal(requirement(result.matched, 'Education requirement stated in the job description').status, 'matched');
});

test('tailoring only points at real facts or conditions changes on truth', () => {
  const result = match();

  const mysqlTip = result.tailoring.find((t) => t.includes('MySQL'));
  assert.ok(mysqlTip, 'an unevidenced required term earns a tailoring step');
  assert.match(mysqlTip, /If you have genuinely used/, 'the wording must condition on truth');
  assert.match(mysqlTip, /rather than claiming it/);
});
