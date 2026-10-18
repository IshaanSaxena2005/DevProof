import { skillsNamedIn } from './skill.service';

// ==========================================
// RESUME ANALYSIS SERVICE
// ==========================================
// Deterministic, rule-based structuring of the text the PDF parser already
// extracts. No model, no network, no guessing: every field is copied from a
// line that actually appears in the resume, and each entry carries that line
// as its `evidence` so the UI can always show where a value came from.
//
// Honesty rules, in order of importance:
//  - A field the heuristics cannot confidently locate stays null. Null means
//    "not found in the text", never a default or an invention.
//  - A certification line becomes a candidate for *review*, not a record. It
//    is never written to the database and never marked verified: a resume can
//    say anything.
//  - Contact details are extracted only because the route that serves them is
//    owner-only. They must never reach logs, analytics, or external services.

/** Bumped when the analysis shape changes so old records stay readable. */
export const RESUME_ANALYSIS_VERSION = 1;

export interface ResumeContactLink {
  label: string;
  url: string;
}

export interface ResumeContactInfo {
  email: string | null;
  phone: string | null;
  links: ResumeContactLink[];
}

export interface ResumeEducationEntry {
  /** The resume line this entry was read from. */
  evidence: string;
  qualification: string | null;
  institution: string | null;
  /** Date span exactly as written, e.g. "2017 - 2021". */
  period: string | null;
}

export interface ResumeExperienceEntry {
  evidence: string;
  role: string | null;
  organization: string | null;
  period: string | null;
  /** Deterministic month span from the written period, when computable. */
  durationMonths: number | null;
  /** Bullet points under the entry, markers stripped, as written. */
  highlights: string[];
}

export interface ResumeProjectEntry {
  evidence: string;
  name: string | null;
  description: string | null;
  /** Technologies matched inside this project's own text only. */
  technologies: string[];
  link: string | null;
}

export interface ResumeCertificationCandidate {
  title: string;
  issuer: string | null;
  /** Date text as written on the resume, e.g. "2023" or "Nov 2023". */
  issueDate: string | null;
  credentialId: string | null;
  credentialUrl: string | null;
  evidence: string;
  /** True when no issuer could be located — the entry needs human review. */
  needsReview: boolean;
}

export interface ResumeAnalysis {
  version: number;
  /** ISO timestamp of when this analysis was computed. */
  analysedAt: string;
  contact: ResumeContactInfo;
  summary: string | null;
  education: ResumeEducationEntry[];
  experience: ResumeExperienceEntry[];
  projects: ResumeProjectEntry[];
  certifications: ResumeCertificationCandidate[];
  achievements: string[];
}

/** Issuers the detector knows by name. Matching is case-insensitive word
 * level; an unknown issuer stays null rather than being guessed. */
const ISSUER_PATTERNS: { pattern: RegExp; name: string }[] = [
  { pattern: /\b(amazon\s+web\s+services|aws)\b/i, name: 'Amazon Web Services' },
  { pattern: /\b(microsoft|azure)\b/i, name: 'Microsoft' },
  { pattern: /\bgoogle\b/i, name: 'Google' },
  { pattern: /\bibm\b/i, name: 'IBM' },
  { pattern: /\boracle\b/i, name: 'Oracle' },
  { pattern: /\bcisco\b/i, name: 'Cisco' },
  { pattern: /\b(meta|facebook)\b/i, name: 'Meta' },
  { pattern: /\bsalesforce\b/i, name: 'Salesforce' },
  { pattern: /\badobe\b/i, name: 'Adobe' },
  { pattern: /\bgithub\b/i, name: 'GitHub' },
  { pattern: /\bdocker\b/i, name: 'Docker' },
  { pattern: /\b(cloud\s+native\s+computing\s+foundation|cncf)\b/i, name: 'Cloud Native Computing Foundation' },
  { pattern: /\bkubernetes\b/i, name: 'CNCF' },
  { pattern: /\bcoursera\b/i, name: 'Coursera' },
  { pattern: /\bedx\b/i, name: 'edX' },
  { pattern: /\budemy\b/i, name: 'Udemy' },
  { pattern: /\bnptel\b/i, name: 'NPTEL' },
  { pattern: /\bfreecodecamp\b/i, name: 'freeCodeCamp' },
  { pattern: /\bhackerrank\b/i, name: 'HackerRank' },
  { pattern: /\bmongodb\b/i, name: 'MongoDB' },
  { pattern: /\bred\s?hat\b/i, name: 'Red Hat' },
  { pattern: /\bthe\s+linux\s+foundation\b/i, name: 'The Linux Foundation' },
  { pattern: /\bhashicorp\b/i, name: 'HashiCorp' },
  { pattern: /\bscrum\.?org\b/i, name: 'Scrum.org' },
  { pattern: /\bproject\s+management\s+institute\b|\bpmi\b/i, name: 'Project Management Institute' },
  { pattern: /\bintel\b/i, name: 'Intel' },
  { pattern: /\bnvidia\b/i, name: 'NVIDIA' }
];

const MONTHS = 'jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec';

/**
 * A professional summary is a short paragraph. Past this many words the
 * "summary" section has swallowed structure the splitter did not recognise
 * (unrecognised headings, decorative layouts), and presenting it would label
 * the rest of the resume as the summary. Null is the honest value: the UI
 * shows its "not detected" fallback instead of the document text.
 */
const MAX_SUMMARY_WORDS = 120;

/** A month-year or year range, as people write them: "2018 - 2022",
 * "Jun 2020 – Aug 2020", "2021 to Present". */
const PERIOD_RE = new RegExp(
  `\\b((?:${MONTHS})[a-z]*\\.?\\s+)?(19|20)\\d{2}\\s*(?:[-\u2013\u2014]|to)\\s*((?:${MONTHS})[a-z]*\\.?\\s+)?((?:19|20)\\d{2}|present|current)\\b`,
  'i'
);

const QUALIFICATION_RE =
  /\b(b\.?tech|b\.?e\.?|bachelor(?:'s)?(?:\s+of|\s+in)?|b\.?sc|bca|m\.?tech|m\.?e\.?|master(?:'s)?(?:\s+of|\s+in)?|m\.?sc|mca|mba|ph\.?d|diploma|associate(?:'s)? degree|higher\s+secondary|secondary\s+school|12th|10th)\b/i;

const INSTITUTION_RE =
  /\b(institute|university|college|school|academy|iit|nit|iiit|polytechnic|facult[y|ies])\b/i;

const ORG_RE =
  /\b(pvt|private\s+limited|ltd|limited|inc|llc|corp|corporation|technolog|solutions|labs|systems?|services|software|consulting|studio|university|college|institute|startup|digital|global|networks|analytics|gmbh|co\.|ventures|enterprises|industries|group)\b/i;

const ROLE_RE =
  /\b(software|senior|junior|lead|principal|staff|frontend|front\s?end|back\s?end|backend|full\s?stack|devops|data|machine\s+learning|deep\s+learning|qa|quality|test(ing)?|mobile|android|ios|cloud|systems?|network|security|blockchain|embedded|platform|site\s+reliability|engineer(?:ing)?|developer|architect|analyst|consultant|intern(?:ship)?|manager|director|head|founder|co-?founder|freelance|assistant|associate|designer|researcher|trainer|mentor|officer|specialist|administrator|technician|tutor|lecturer)\b/i;

const BULLET_RE = /^[\s]*[\u2022\u25cf\u25aa\u00b7\*\u2013\u2014\-]\s+/;

const URL_RE = /\bhttps?:\/\/[^\s,;|)]+|\b(?:www\.)?(?:linkedin\.com|github\.com)\/[^\s,;|)]+/gi;

const MONTH_INDEX: Record<string, number> = {
  jan: 0, january: 0, feb: 1, february: 1, mar: 2, march: 2, apr: 3, april: 3,
  may: 4, jun: 5, june: 5, jul: 6, july: 6, aug: 7, august: 7, sep: 8,
  sept: 8, september: 8, oct: 9, october: 9, nov: 10, november: 10, dec: 11,
  december: 11
};

/** Strip bullet markers and collapse whitespace. */
function cleanLine(line: string): string {
  return line.replace(BULLET_RE, '').replace(/\s+/g, ' ').trim();
}

function isBullet(line: string): boolean {
  return BULLET_RE.test(line);
}

/** First issuer this line names, or null — never guessed. */
function detectIssuer(line: string): string | null {
  for (const { pattern, name } of ISSUER_PATTERNS) {
    if (pattern.test(line)) return name;
  }
  return null;
}

/** Date text as written: prefers a month+year, falls back to a bare year
 * that is not part of a range. Returns null when nothing date-like exists. */
function detectIssueDate(line: string): string | null {
  const monthYear = line.match(new RegExp(`\\b(${MONTHS})[a-z]*\\.?\\s+(19|20)\\d{2}\\b`, 'i'));
  if (monthYear) return monthYear[0].trim();
  // A bare year that is not immediately part of a range ("- 2023" / "2023 -").
  const bareYear = line.match(/\b(19|20)\d{2}\b(?!\s*[-\u2013\u2014to])/i);
  if (bareYear) return bareYear[0];
  const rangeTail = line.match(/\b(19|20)\d{2}\s*[-\u2013\u2014]\s*((?:19|20)\d{2}|present)\b/i);
  if (rangeTail) return rangeTail[0].replace(/\s+/g, ' ').trim();
  return null;
}

/** A credential id only when it looks like one: either prefixed by an
 * explicit label (ID / No / #) or a token with letters AND digits. Anything
 * else stays null — mistaking an acronym for an ID would be a fabrication. */
function detectCredentialId(line: string): string | null {
  const labelled = line.match(/\b(?:credential\s*)?(?:id|no\.?|number|#)\s*[:.]?\s*([A-Za-z0-9][A-Za-z0-9-]{3,})\b/i);
  if (labelled) {
    const value = labelled[1];
    if (/\d/.test(value)) return value;
  }
  const token = line.match(/\b([A-Z][A-Z0-9]*[-][A-Z0-9-]{2,})\b|\b([A-Z0-9]+[A-Z0-9]*\d[A-Z0-9-]{2,})\b/);
  if (token) {
    const value = token[1] ?? token[2];
    if (/\d/.test(value) && /[A-Za-z]/.test(value)) return value;
  }
  return null;
}

function detectUrl(line: string): string | null {
  const match = line.match(URL_RE);
  if (!match) return null;
  const url = match[0].replace(/[.,;]+$/, '');
  return /^https?:\/\//i.test(url) ? url : `https://${url}`;
}

/** Month span between two written periods, or null when either end cannot be
 * read. A "Present"/"Current" end counts to now — deterministic per date. */
function durationMonthsOf(period: string | null): number | null {
  if (!period) return null;
  const match = period.match(PERIOD_RE);
  if (!match) return null;

  const monthOf = (text?: string): number =>
    text ? (MONTH_INDEX[text.toLowerCase().replace(/[^a-z]/g, '')] ?? 0) : 0;

  const startYearText = match[0].match(/(19|20)\d{2}/)?.[0];
  if (!startYearText) return null;
  const start = { year: parseInt(startYearText, 10), month: monthOf(match[1]) };

  // match[4] is the end: a year, or Present/Current.
  const endText = match[4];
  const now = new Date();
  const end = /present|current/i.test(endText)
    ? { year: now.getFullYear(), month: now.getMonth() }
    : { year: parseInt(endText, 10), month: match[3] ? monthOf(match[3]) : 11 };

  const months = (end.year - start.year) * 12 + (end.month - start.month);
  return months >= 0 ? months : null;
}

/** Split a section's lines into entry groups: a new entry starts at each
 * line matching `startsEntry`. Consecutive non-matching lines join the
 * current entry. Lines before the first start line are ignored — they are
 * usually repeated headings or column noise. */
function groupEntries(lines: string[], startsEntry: (line: string, index: number) => boolean): string[][] {
  const groups: string[][] = [];
  let current: string[] | null = null;
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (!line.trim()) continue;
    if (startsEntry(line, i)) {
      current = [line];
      groups.push(current);
    } else if (current) {
      current.push(line);
    }
  }
  return groups;
}

export class ResumeAnalysisService {
  /**
   * Structure the parsed resume. `headerLines` are the lines before the first
   * recognised heading — the name/contact block the section splitter skips.
   *
   * The full document text is deliberately not part of the result: the
   * sections above carry every excerpt the UI shows, and the full text
   * already lives in Resume.extractedText under the same owner-only route.
   */
  static analyse(headerLines: string[], sections: Record<string, string>): ResumeAnalysis {
    return {
      version: RESUME_ANALYSIS_VERSION,
      analysedAt: new Date().toISOString(),
      contact: ResumeAnalysisService.analyseContact(headerLines),
      summary: ResumeAnalysisService.analyseSummary(sections.summary),
      education: ResumeAnalysisService.analyseEducation(sections.education),
      experience: ResumeAnalysisService.analyseExperience(sections.experience),
      projects: ResumeAnalysisService.analyseProjects(sections.projects),
      certifications: ResumeAnalysisService.analyseCertifications(sections.certifications),
      achievements: ResumeAnalysisService.analyseAchievements(sections.achievements)
    };
  }

  /** Contact data is read from the header block only: a link inside a
   * project description is not the author's contact detail. */
  private static analyseContact(headerLines: string[]): ResumeContactInfo {
    const header = headerLines.join('\n');

    const email = header.match(/[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}/)?.[0] ?? null;

    let phone: string | null = null;
    for (const line of headerLines) {
      const candidate = line.match(/\+?[\d][\d\s().-]{7,20}\d/)?.[0];
      if (!candidate) continue;
      const digits = candidate.replace(/\D/g, '');
      // Year ranges ("2018 - 2022") and long single numbers are not phone
      // numbers; a plausible phone has 8-15 digits.
      if (digits.length < 8 || digits.length > 15) continue;
      if (/^\s*(19|20)\d{2}\s*[-\u2013\u2014]/.test(candidate)) continue;
      phone = candidate.trim();
      break;
    }

    const links: ResumeContactLink[] = [];
    const seen = new Set<string>();
    for (const raw of header.match(URL_RE) ?? []) {
      const url = raw.replace(/[.,;]+$/, '');
      if (seen.has(url.toLowerCase())) continue;
      seen.add(url.toLowerCase());
      const normalised = /^https?:\/\//i.test(url) ? url : `https://${url}`;
      const label = /linkedin/i.test(url) ? 'LinkedIn' : /github/i.test(url) ? 'GitHub' : 'Link';
      links.push({ label, url: normalised });
    }

    return { email, phone, links };
  }

  private static analyseSummary(text: string | undefined): string | null {
    if (!text) return null;
    const summary = text.replace(/\s+/g, ' ').trim();
    if (!summary) return null;
    // A "summary" this long is the document, not a summary of it.
    if (summary.split(/\s+/).length > MAX_SUMMARY_WORDS) return null;
    return summary;
  }

  private static analyseEducation(text: string | undefined): ResumeEducationEntry[] {
    if (!text) return [];
    const lines = text.split('\n').map(cleanLine).filter(Boolean);

    const groups = groupEntries(
      lines,
      (line) => QUALIFICATION_RE.test(line) || (line.length <= 120 && PERIOD_RE.test(line))
    );

    const entries: ResumeEducationEntry[] = [];
    for (const group of groups) {
      const first = group[0];
      const qualificationLine = group.find((l) => QUALIFICATION_RE.test(l)) ?? first;

      let qualification = qualificationLine.match(QUALIFICATION_RE)?.[0] ?? null;
      // Keep the qualifier that follows ("B.Tech in Computer Science" reads
      // far better than a bare "B.Tech") when the line has one.
      if (qualification) {
        const inMatch = qualificationLine.match(
          new RegExp(`${qualification.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}[^,]*`, 'i')
        );
        const detail = inMatch?.[0].trim();
        if (detail && detail.length > qualification.length) qualification = detail;
      }

      // Prefer the comma-separated part of a single-line entry ("B.Tech in
      // CSE, Example Institute of Technology, 2017 - 2021"), then a dedicated
      // institution line, then the whole line when it stands alone.
      const institutionLine =
        (first.includes(',')
          ? first
              .split(',')
              .map((part) => part.trim())
              .find((part) => INSTITUTION_RE.test(part)) ?? null
          : null) ??
        group.slice(1).find((l) => INSTITUTION_RE.test(l)) ??
        (INSTITUTION_RE.test(first) ? first : null);

      const period = group.map((l) => l.match(PERIOD_RE)?.[0]).find(Boolean) ?? null;

      entries.push({
        evidence: first,
        qualification,
        institution: institutionLine ? institutionLine.replace(/\s*\([^)]*\)\s*$/, '').trim() : null,
        period
      });
    }
    return entries;
  }

  private static analyseExperience(text: string | undefined): ResumeExperienceEntry[] {
    if (!text) return [];
    const lines = text.split('\n').map((l) => l.trim()).filter(Boolean);

    const groups = groupEntries(lines, (line) => {
      const clean = cleanLine(line);
      // Only a short line naming a role starts an entry — and a line that also
      // names an organisation ("Example Systems Pvt Ltd") is the employer
      // line under the previous role, not a new entry. Date lines always
      // belong to the entry above them.
      return !isBullet(line) && clean.length <= 100 && ROLE_RE.test(clean) && !ORG_RE.test(clean);
    });

    const entries: ResumeExperienceEntry[] = [];
    for (const group of groups) {
      const first = cleanLine(group[0]);
      const roleLine = group.find((l) => !isBullet(l) && ROLE_RE.test(cleanLine(l))) ?? first;

      let organization: string | null = null;
      for (const line of group.slice(0, 4)) {
        if (isBullet(line)) continue;
        const clean = cleanLine(line);
        if (clean === roleLine) continue;
        if (ORG_RE.test(clean) && !PERIOD_RE.test(clean)) {
          organization = clean;
          break;
        }
      }

      const period = group.map((l) => cleanLine(l).match(PERIOD_RE)?.[0]).find(Boolean) ?? null;
      const highlights = group.filter(isBullet).map(cleanLine).filter((l) => l.length > 0);

      entries.push({
        evidence: first,
        role: roleLine && ROLE_RE.test(roleLine) ? roleLine : null,
        organization,
        period,
        durationMonths: durationMonthsOf(period),
        highlights
      });
    }
    return entries;
  }

  private static analyseProjects(text: string | undefined): ResumeProjectEntry[] {
    if (!text) return [];
    const lines = text.split('\n').map((l) => l.trim()).filter(Boolean);

    let groups = groupEntries(lines, (line) => {
      const clean = cleanLine(line);
      // A line that is only a URL belongs to the entry above it — resumes
      // routinely put the project link on its own line.
      if (detectUrl(clean) === clean) return false;
      return !isBullet(line) && clean.length <= 100;
    });
    // A projects section written as a pure bullet list has no name lines to
    // group by; each bullet then stands as its own project entry.
    if (groups.length === 0 && lines.length > 0) {
      groups = lines.map((line) => [line]);
    }

    const entries: ResumeProjectEntry[] = [];
    for (const group of groups) {
      const first = cleanLine(group[0]);
      const bodyLines = group.slice(1).map(cleanLine);
      const bodyText = bodyLines.join(' ');
      const groupText = group.map(cleanLine).join(' ');

      entries.push({
        evidence: first,
        name: first,
        description: bodyText ? bodyText.replace(URL_RE, '').replace(/\s+/g, ' ').trim() || null : null,
        technologies: [...new Set(skillsNamedIn(groupText).map((skill) => skill.name))],
        link: group.map((l) => detectUrl(cleanLine(l))).find(Boolean) ?? null
      });
    }
    return entries;
  }

  private static analyseCertifications(text: string | undefined): ResumeCertificationCandidate[] {
    if (!text) return [];
    const lines = text.split('\n').map(cleanLine).filter(Boolean);

    const candidates: ResumeCertificationCandidate[] = [];
    for (const line of lines) {
      // Repeated headings and bare URLs are not certification entries.
      if (/^(certifications?|licenses?|credentials?)$/i.test(line)) continue;
      if (URL_RE.test(line) && line.replace(URL_RE, '').trim().length < 4) continue;

      const credentialUrl = detectUrl(line);
      const credentialId = detectCredentialId(line);
      const issueDate = detectIssueDate(line);
      const issuer = detectIssuer(line);

      // Title = the line with its structured parts removed, so the record the
      // user confirms reads like a certification name, not a raw sentence.
      let title = line;
      if (credentialUrl) title = title.replace(credentialUrl, '');
      if (credentialId) title = title.replace(credentialId, '');
      if (issueDate) title = title.replace(issueDate, '');
      if (issuer) title = title.replace(new RegExp(issuer.replace(/\s+/g, '\\s+'), 'i'), '');
      title = title
        .replace(/(?:credential\s*)?(?:id|no\.?|number|#)\s*[:.]/gi, '')
        .replace(/\bissued\s+on\b|\bissued\b|\bby\b/gi, ' ')
        .replace(/[,;|()]+/g, ' ')
        .replace(/\s+/g, ' ')
        .trim();

      if (title.length < 4 || title.length > 160) continue;

      candidates.push({
        title,
        issuer,
        issueDate,
        credentialId,
        credentialUrl,
        evidence: line,
        needsReview: issuer === null
      });
    }
    return candidates;
  }

  private static analyseAchievements(text: string | undefined): string[] {
    if (!text) return [];
    return text
      .split('\n')
      .map(cleanLine)
      .map((line) => line.replace(/^(achievement|award|honou?rs?)\s*[:\-–]\s*/i, '').trim())
      .filter((line) => line.length > 0 && !/^(achievements?|awards?|honou?rs?)$/i.test(line));
  }
}
