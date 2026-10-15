/**
 * Minimal PDF builder for tests.
 *
 * Produces a real, single-page PDF whose only content is a line of text per
 * entry, with correct xref offsets (all bytes are ASCII, so byte offsets
 * equal string lengths). pdfjs reads it exactly like any other text PDF,
 * which is what makes it a faithful fixture for the resume parser.
 *
 * All content is synthetic. Never put real personal data in these fixtures.
 */

function escapePdfText(text) {
  return text.replace(/\\/g, '\\\\').replace(/\(/g, '\\(').replace(/\)/g, '\\)');
}

function buildPdf(lines) {
  const content = [
    'BT',
    '/F1 11 Tf',
    '14 TL',
    '50 742 Td',
    ...lines.map((line) => `(${escapePdfText(line)}) Tj T*`),
    'ET'
  ].join('\n');

  const objects = [
    '<< /Type /Catalog /Pages 2 0 R >>',
    '<< /Type /Pages /Kids [3 0 R] /Count 1 >>',
    '<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Contents 4 0 R /Resources << /Font << /F1 5 0 R >> >> >>',
    `<< /Length ${content.length} >>\nstream\n${content}\nendstream`,
    '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>'
  ];

  let pdf = '%PDF-1.4\n';
  const offsets = [];
  objects.forEach((body, index) => {
    offsets.push(pdf.length);
    pdf += `${index + 1} 0 obj\n${body}\nendobj\n`;
  });

  const xrefOffset = pdf.length;
  pdf += `xref\n0 ${objects.length + 1}\n`;
  pdf += '0000000000 65535 f \n';
  for (const offset of offsets) {
    pdf += `${String(offset).padStart(10, '0')} 00000 n \n`;
  }
  pdf += `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xrefOffset}\n%%EOF`;

  return Buffer.from(pdf, 'latin1');
}

/** A synthetic resume exercising every category the analyser supports. */
const SYNTHETIC_RESUME_LINES = [
  'Ada Example',
  'ada.example@example.com | +1 555 010 2024 | linkedin.com/in/adaexample | github.com/adaexample',
  'Professional Summary',
  'Backend engineer focused on reliable APIs and data systems.',
  'Experience',
  'Senior Backend Engineer',
  'Example Systems Pvt Ltd',
  '2021 - Present',
  '- Designed a payment reconciliation service in Node.js and PostgreSQL',
  '- Led migration of nightly batch jobs to event-driven pipelines',
  'Backend Intern',
  'Acme Analytics Pvt Ltd',
  'Jun 2020 - Aug 2020',
  '- Built reporting dashboards in React',
  'Education',
  'B.Tech in Computer Science, Example Institute of Technology, 2017 - 2021',
  'Skills',
  'Node.js, PostgreSQL, TypeScript, Docker, AWS',
  'Projects',
  'Reconciliation Dashboard',
  '- Real-time reconciliation views for finance teams using React and D3',
  'https://github.com/adaexample/recon-dash',
  'Certifications',
  'AWS Certified Solutions Architect - Associate, Amazon Web Services, 2023, ID: AWS-PCA-98213',
  'Certified Kubernetes Application Developer, Cloud Native Computing Foundation, 2022',
  'MongoDB Associate Developer',
  'Certificate of Completion in Machine Learning',
  'Achievements',
  '- Winner, Example Hack 2022',
  '- Three pull requests merged into open-source tooling'
];

function buildSyntheticResumePdf() {
  return buildPdf(SYNTHETIC_RESUME_LINES);
}

module.exports = { buildPdf, buildSyntheticResumePdf, SYNTHETIC_RESUME_LINES };
