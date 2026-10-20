import type { AtsCheck } from './types';
import type { ResumeAnalysis } from '../resumeAnalysis.service';

// ==========================================
// ATS FORMATTING CHECKS
// ==========================================
// Only what the parsed document can prove. Date formats, bullet discipline
// and heading structure are reliably detectable from extracted lines; font
// choices, columns and visual layout are not, so nothing here pretends to
// grade them.
//
// Every check can answer "unable to determine" ('unknown') when the document
// has no dated entries, no roles or no structure to evaluate — an unavailable
// check is never dressed up as a failure.

export interface FormattingCheckInput {
  sections: Record<string, string>;
  analysis: ResumeAnalysis;
}

function evidenceFrom(lines: string[], cap = 3): string[] {
  const out: string[] = [];
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || out.includes(trimmed)) continue;
    out.push(trimmed.length > 160 ? `${trimmed.slice(0, 157)}…` : trimmed);
    if (out.length >= cap) break;
  }
  return out;
}

export function buildFormattingChecks(input: FormattingCheckInput): AtsCheck[] {
  return [
    checkDateCoverage(input),
    checkDateOrder(input),
    checkBullets(input),
    checkHeadings(input)
  ];
}

/** Do the dated sections carry dates at all? */
function checkDateCoverage({ analysis }: FormattingCheckInput): AtsCheck {
  const entries = [...analysis.experience, ...analysis.education];
  const base = {
    id: 'date-coverage',
    label: 'Dates on roles and education',
    whyItMatters:
      'Undated entries cannot be placed on a timeline. Screeners read gaps and overlaps as questions to resolve, and an ATS cannot apply date filters to text it cannot parse.',
    evidence: evidenceFrom(entries.filter((e) => !e.period).map((e) => e.evidence))
  };

  if (entries.length === 0) {
    return {
      ...base,
      status: 'unknown',
      detected: null,
      improvement: null
    };
  }

  const undated = entries.filter((e) => !e.period);
  if (undated.length === 0) {
    return { ...base, status: 'passed', detected: `All ${entries.length} dated entr${entries.length === 1 ? 'y' : 'ies'} carry a period`, improvement: null };
  }

  return {
    ...base,
    status: 'needs_improvement',
    detected: `${undated.length} of ${entries.length} entries have no readable date`,
    improvement:
      'Write each period unambiguously — "Jun 2023 – Dec 2023" or "2021 – Present". Ambiguous formats ("2023/24", bare years without context) are often dropped by parsers.'
  };
}

/** A written period reads as ordered when its years ascend (single year
 *  reads as a point in time, which is ordered by definition). */
function periodReadsOrdered(period: string): boolean {
  const years = [...period.matchAll(/(19|20)\d{2}/g)].map((m) => parseInt(m[0], 10));
  if (years.length === 0) return false;
  if (years.length === 1) return true;
  return years[years.length - 1] >= years[0];
}

/** Can every stated period be read as an ordered range? */
function checkDateOrder({ analysis }: FormattingCheckInput): AtsCheck {
  // Experience durations are computed by the structured analysis; education
  // periods carry no duration, so their years are checked directly.
  const withDuration = analysis.experience.filter((e) => e.period).map((e) => ({
    evidence: e.evidence,
    ordered: e.durationMonths !== null
  }));
  const educationSpans = analysis.education.filter((e) => e.period).map((e) => ({
    evidence: e.evidence,
    ordered: periodReadsOrdered(e.period!)
  }));
  const entries = [...withDuration, ...educationSpans];
  const base = {
    id: 'date-order',
    label: 'Date range consistency',
    whyItMatters:
      'A range that reads backwards or ambiguously ("Present – 2021", "2022 – 2021") undermines the whole timeline and is a common automatic-filter rejection.',
    evidence: evidenceFrom(entries.filter((e) => !e.ordered).map((e) => e.evidence))
  };

  if (entries.length === 0) {
    return { ...base, status: 'unknown', detected: null, improvement: null };
  }

  const unreadable = entries.filter((e) => !e.ordered);
  if (unreadable.length === 0) {
    return {
      ...base,
      status: 'passed',
      detected: `All ${entries.length} stated period${entries.length === 1 ? '' : 's'} read as ordered ranges`,
      improvement: null
    };
  }

  return {
    ...base,
    status: 'needs_improvement',
    detected: `${unreadable.length} period${unreadable.length === 1 ? '' : 's'} could not be read as an ordered range`,
    improvement:
      'Check each flagged period: the end must follow the start ("Mar 2021 – Present", not "Present – Mar 2021"), and both ends should name a month and year or a four-digit year.'
  };
}

/** Do the roles carry bullet points? */
function checkBullets({ analysis }: FormattingCheckInput): AtsCheck {
  const entries = analysis.experience;
  const base = {
    id: 'bullet-structure',
    label: 'Bullet points on roles',
    whyItMatters:
      'Bullets give a parser discrete, scannable lines — one accomplishment each. A paragraph under a role hides every individual result from both the screen and the screener.',
    evidence: evidenceFrom(entries.filter((e) => e.highlights.length === 0).map((e) => e.evidence))
  };

  if (entries.length === 0) {
    return { ...base, status: 'unknown', detected: null, improvement: null };
  }

  const withoutBullets = entries.filter((e) => e.highlights.length === 0);
  if (withoutBullets.length === 0) {
    return {
      ...base,
      status: 'passed',
      detected: `All ${entries.length} role${entries.length === 1 ? '' : 's'} list bullet points`,
      improvement: null
    };
  }

  return {
    ...base,
    status: 'needs_improvement',
    detected: `${withoutBullets.length} of ${entries.length} roles have no bullet points`,
    improvement:
      'Break each role into bullet lines — one accomplishment per line, starting with an action verb ("Built", "Reduced", "Led").'
  };
}

/** Keys the splitter recognises — an arbitrary map key is not a heading. */
const STANDARD_KEYS = new Set(['summary', 'experience', 'education', 'skills', 'projects', 'certifications', 'achievements']);

/** Did the parser recognise standard section headings? */
function checkHeadings({ sections }: FormattingCheckInput): AtsCheck {
  const recognisedKeys = Object.keys(sections).filter((key) => STANDARD_KEYS.has(key));
  const recognised = recognisedKeys.length;
  const base = {
    id: 'section-headings',
    label: 'Standard section headings',
    whyItMatters:
      'ATS parsers route content by heading ("Experience", "Education", "Skills"). Non-standard or missing headings are the most common reason an otherwise strong resume reads as unstructured.',
    evidence: evidenceFrom(recognisedKeys.map((key) => `${key}: heading recognised`), 5)
  };

  if (recognised >= 4) {
    return {
      ...base,
      status: 'passed',
      detected: `${recognised} standard headings recognised (${recognisedKeys.join(', ')})`,
      improvement: null
    };
  }

  if (recognised === 0) {
    return {
      ...base,
      status: 'needs_improvement',
      detected: 'No standard section heading was recognised in the document',
      improvement:
        'Restructure the resume under plain headings: Summary, Skills, Experience, Projects, Education. Decorative or unusually named headings ("Where I Have Been", icons) are invisible to parsers.'
    };
  }

  return {
    ...base,
    status: 'needs_improvement',
    detected: `Only ${recognised} standard heading${recognised === 1 ? '' : 's'} recognised (${recognisedKeys.join(', ')})`,
    improvement:
      'Add the missing standard headings — Skills, Experience, Projects, Education — each on its own line, in uppercase or title case, above its content.'
  };
}
