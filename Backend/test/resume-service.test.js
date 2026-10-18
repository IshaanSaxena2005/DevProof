const assert = require('node:assert/strict');
const test = require('node:test');

const { ResumeService } = require('../dist/services/resume.service.js');

/**
 * Uploads are rejected on their bytes, not their declared type, so these cover
 * the validation boundary. The parser itself is exercised end to end against a
 * real PDF in the extraction tests below.
 */

const pdfBytes = (body = 'x') => Buffer.from(`%PDF-1.4\n${body}`, 'latin1');

function upload(overrides = {}) {
  const buffer = overrides.buffer ?? pdfBytes();
  return {
    originalName: 'resume.pdf',
    mimeType: 'application/pdf',
    size: buffer.length,
    buffer,
    ...overrides
  };
}

/** assertAcceptable is private; reach it the way upload() does. */
function validate(input) {
  return ResumeService['assertAcceptable'](input);
}

test('a PDF passes validation', () => {
  assert.doesNotThrow(() => validate(upload()));
});

test('a non-PDF mime type is rejected', () => {
  assert.throws(() => validate(upload({ mimeType: 'image/png' })), /only pdf/i);
});

test('a file that merely claims to be a PDF is rejected on its bytes', () => {
  const buffer = Buffer.from('this is plain text pretending to be a pdf');
  assert.throws(
    () => validate(upload({ buffer, size: buffer.length })),
    /not a valid pdf/i,
    'the declared type is a header the client chose; the bytes are what count'
  );
});

test('a file over the size cap is rejected', () => {
  assert.throws(() => validate(upload({ size: 6 * 1024 * 1024 })), /5MB or smaller/i);
});

test('an empty file is rejected rather than stored', () => {
  const buffer = Buffer.alloc(0);
  assert.throws(() => validate(upload({ buffer, size: 0 })), /not a valid pdf/i);
});

/* ── structured analysis (deterministic, no PDF required) ─────────────── */

const { ResumeAnalysisService } = require('../dist/services/resumeAnalysis.service.js');

const HEADER = [
  'Ada Example',
  'ada.example@example.com | +1 555 010 2024 | linkedin.com/in/adaexample | github.com/adaexample'
];

const SECTIONS = {
  summary: 'Backend engineer focused on reliable APIs.',
  experience: [
    'Senior Backend Engineer',
    'Example Systems Pvt Ltd',
    '2021 - Present',
    '- Designed a reconciliation service',
    'Backend Intern',
    'Acme Analytics Pvt Ltd',
    'Jun 2020 - Aug 2020',
    '- Built dashboards'
  ].join('\n'),
  education: 'B.Tech in Computer Science, Example Institute of Technology, 2017 - 2021',
  projects: [
    'Reconciliation Dashboard',
    '- Real-time views using React',
    'https://github.com/adaexample/recon'
  ].join('\n'),
  certifications: [
    'AWS Certified Solutions Architect - Associate, Amazon Web Services, 2023, ID: AWS-PCA-98213',
    'Certified Kubernetes Application Developer, Cloud Native Computing Foundation, 2022',
    'MongoDB Associate Developer',
    'Certificate of Completion in Machine Learning'
  ].join('\n'),
  achievements: '- Winner, Example Hack 2022\n- Merged pull requests into tooling'
};

const analysis = ResumeAnalysisService.analyse(HEADER, SECTIONS);

test('contact details are read from the header block only', () => {
  assert.equal(analysis.contact.email, 'ada.example@example.com');
  assert.equal(analysis.contact.phone, '+1 555 010 2024');
  assert.deepEqual(
    analysis.contact.links.map((l) => l.label),
    ['LinkedIn', 'GitHub']
  );
});

test('an education line yields qualification, institution and period', () => {
  const [entry] = analysis.education;
  assert.equal(entry.qualification, 'B.Tech in Computer Science');
  assert.equal(entry.institution, 'Example Institute of Technology');
  assert.equal(entry.period, '2017 - 2021');
});

test('experience entries carry role, organisation, dates, duration and bullets', () => {
  assert.equal(analysis.experience.length, 2);

  const [senior, intern] = analysis.experience;
  assert.equal(senior.role, 'Senior Backend Engineer');
  assert.equal(senior.organization, 'Example Systems Pvt Ltd');
  assert.equal(senior.period, '2021 - Present');
  // A "Present" end counts to now, so only the shape is pinned here.
  assert.ok(senior.durationMonths !== null && senior.durationMonths >= 60);
  assert.deepEqual(senior.highlights, ['Designed a reconciliation service']);

  assert.equal(intern.role, 'Backend Intern');
  assert.equal(intern.period, 'Jun 2020 - Aug 2020');
  assert.equal(intern.durationMonths, 2, 'Jun 2020 to Aug 2020 is two months');
});

test('a project entry keeps its technologies and link, URL lines join it', () => {
  // The bare URL line belongs to the project above it, not a new entry.
  assert.equal(analysis.projects.length, 1);
  const [project] = analysis.projects;
  assert.equal(project.name, 'Reconciliation Dashboard');
  assert.deepEqual(project.technologies, ['React']);
  assert.equal(project.link, 'https://github.com/adaexample/recon');
});

test('certification candidates carry only what the line actually contains', () => {
  const [aws, k8s, mongo, unknown] = analysis.certifications;

  assert.equal(aws.title, 'AWS Certified Solutions Architect - Associate');
  assert.equal(aws.issuer, 'Amazon Web Services');
  assert.equal(aws.issueDate, '2023');
  assert.equal(aws.credentialId, 'AWS-PCA-98213');
  assert.equal(aws.needsReview, false);

  assert.equal(k8s.issuer, 'Cloud Native Computing Foundation');
  assert.equal(k8s.credentialId, null, 'nothing ID-like must stay null');

  assert.equal(mongo.issuer, 'MongoDB');
  assert.equal(mongo.needsReview, false);

  // No known issuer anywhere on the line: the parser says so rather than guessing.
  assert.equal(unknown.title, 'Certificate of Completion in Machine Learning');
  assert.equal(unknown.issuer, null);
  assert.equal(unknown.needsReview, true);
});

test('a repeated heading line is not a certification candidate', () => {
  const withHeading = ResumeAnalysisService.analyse([], {
    certifications: 'Certifications\nAWS Solutions Architect, AWS, 2022'
  });
  assert.equal(withHeading.certifications.length, 1);
  // "AWS" is the issuer's acronym, not its full name, so the title keeps it
  // — the parser removes only text it actually matched elsewhere on the line.
  assert.equal(withHeading.certifications[0].title, 'AWS Solutions Architect AWS');
  assert.equal(withHeading.certifications[0].issuer, 'Amazon Web Services');
});

test('achievements are de-bulleted and the heading is dropped', () => {
  assert.deepEqual(analysis.achievements, [
    'Winner, Example Hack 2022',
    'Merged pull requests into tooling'
  ]);
});

test('an empty resume fabricates nothing', () => {
  const empty = ResumeAnalysisService.analyse([], {});
  assert.deepEqual(empty.contact, { email: null, phone: null, links: [] });
  assert.equal(empty.summary, null);
  assert.deepEqual(empty.education, []);
  assert.deepEqual(empty.experience, []);
  assert.deepEqual(empty.projects, []);
  assert.deepEqual(empty.certifications, []);
  assert.deepEqual(empty.achievements, []);
});

/* ── section splitting: the summary must never swallow the document ────── */

/** Private, reached the same way the extraction path uses it. */
function split(lines) {
  return ResumeService['splitSections'](lines);
}

test('standard headings split cleanly and the summary holds only summary text', () => {
  const { header, sections } = split([
    'Jane Doe',
    'jane@example.com | +1 555 010 0100',
    'Professional Summary',
    'Backend engineer with five years of experience building APIs.',
    'Education',
    'B.Tech in Computer Science, Example Institute, 2015 - 2019',
    'Technical Skills',
    'TypeScript, React, Node.js, PostgreSQL',
    'Experience',
    'Senior Engineer, Acme Corp, 2021 - Present',
    '- Built the billing service'
  ]);

  assert.deepEqual(header, ['Jane Doe', 'jane@example.com | +1 555 010 0100']);
  assert.equal(sections.summary, 'Backend engineer with five years of experience building APIs.');
  assert.match(sections.education, /B\.Tech/);
  assert.match(sections.skills, /TypeScript/);
  assert.match(sections.experience, /Senior Engineer/);
});

test('headings split by PDF letter-spacing still bound their sections', () => {
  // The shape pdfjs produced for a real upload: each heading's first letter
  // arrives as its own text fragment, so the joined line reads "E DUCATION".
  // None of those headings matched, so the whole resume collapsed into the
  // summary section and the UI rendered the document as one paragraph.
  const { sections } = split([
    'ISHAAN SAXENA',
    '+91-7300000000 • saxena@example.com',
    'PROFESSIONAL SUMMARY',
    'Student building full-stack and ML systems.',
    'E DUCATION',
    'SRM INSTITUTE OF SCIENCE AND TECHNOLOGY 2024-2028',
    'S KILLS',
    'Python, React',
    'E XPERIENCE',
    'Research Intern - UROP, SRMIST 2025-Present',
    'P ROJECTS',
    'SpendWise - finance platform',
    'C ERTIFICATIONS',
    'AWS Certified Cloud Practitioner'
  ]);

  assert.equal(sections.summary, 'Student building full-stack and ML systems.');
  assert.match(sections.education, /SRM INSTITUTE/);
  assert.match(sections.skills, /Python/);
  assert.match(sections.experience, /Research Intern/);
  assert.match(sections.projects, /SpendWise/);
  assert.match(sections.certifications, /AWS/);
});

test('a fully letter-spaced heading is still recognised', () => {
  const { sections } = split([
    'Summary',
    'Full-stack developer.',
    'P R O J E C T S',
    'TaskFlow - task manager',
    'W ORK H ISTORY',
    'Engineer, Acme Corp, 2021 - Present'
  ]);

  assert.equal(sections.summary, 'Full-stack developer.');
  assert.equal(sections.projects, 'TaskFlow - task manager');
  assert.equal(sections.experience, 'Engineer, Acme Corp, 2021 - Present');
});

test('a resume without a summary section has no summary', () => {
  const { sections } = split([
    'Jane Doe',
    'Education',
    'B.Sc., Example University, 2018 - 2022',
    'Skills',
    'TypeScript, React'
  ]);

  assert.equal(sections.summary, undefined);
  assert.match(sections.education, /Example University/);
  assert.match(sections.skills, /TypeScript/);
});

test('a resume with no recognised headings keeps everything out of sections', () => {
  const lines = [
    'Jane Doe',
    'jane@example.com',
    'A narrative resume without any recognised section heading,',
    'told as one continuous story about the work.'
  ];
  const { header, sections } = split(lines);

  assert.deepEqual(sections, {}, 'nothing was recognised, so nothing is claimed');
  assert.deepEqual(header, lines);
});


