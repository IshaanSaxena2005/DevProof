import { analyseKeywords, conceptTermsIn, taxonomySkillsIn } from './keywords';
import type { AtsKeywordAnalysis, KeywordSection } from './types';
import type { ResumeAnalysis } from '../resumeAnalysis.service';

// ==========================================
// JOB DESCRIPTION MATCHING
// ==========================================
// A transparent comparison between a pasted job description and the uploaded
// resume. Deterministic on both sides — the same two texts always produce
// the same result.
//
// The rules that keep this honest:
//  - A match is a MENTION. Named in both texts means "evidenced in the
//    resume", never "the candidate is proficient" — and a requirement absent
//    from the resume is "not evidenced here", never "you lack this skill".
//  - Same-category technologies surface as related context but earn no
//    score; only the exact canonical term counts toward coverage.
//  - This score is its own thing: it never merges into, or alters, the ATS
//    compatibility score.
//  - Tailoring suggestions only ever point at facts the resume already has,
//    or tell the user to add a fact solely if it is true of them.

/** Bumped when the matching calculation changes. */
export const JOB_MATCH_VERSION = 1;

export type RequirementKind = 'skill' | 'concept' | 'experience' | 'education' | 'certification';

export type MatchStatus =
  /** The exact canonical term appears in the resume. */
  | 'matched'
  /** Not found in the resume — unverified here, not disproven anywhere. */
  | 'not_evidenced';

export interface JobRequirement {
  kind: RequirementKind;
  /** Canonical term, or the requirement's own words for non-skill kinds. */
  label: string;
  status: MatchStatus;
  /** Where in the resume the term appears (empty when not evidenced). */
  sections: KeywordSection[];
  /** Resume lines supporting the match, or the JD line stating the requirement. */
  evidence: string[];
  /** Same-category resume technologies, offered as context for a gap. */
  related: string[];
  /** Which side of the JD the requirement came from. */
  source: 'required' | 'preferred';
}

export interface JobMatchPart {
  label: string;
  /** 0–100, or null when this part had no input (excluded, not failed). */
  score: number | null;
  weight: number;
  summary: string;
}

export interface JobMatchScore {
  overall: number | null;
  parts: JobMatchPart[];
  methodologyVersion: number;
  basis: string;
}

export interface SectionToImprove {
  section: string;
  reason: string;
}

export interface JobMatchResult {
  methodologyVersion: number;
  matchedAt: string;
  score: JobMatchScore;
  /** B + D: requirements evidenced in the resume, with where and on what line. */
  matched: JobRequirement[];
  /** C: requirements the resume does not evidence — never phrased as a lack. */
  notEvidenced: JobRequirement[];
  /** E: sections that would gain the most from tailoring. */
  sectionsToImprove: SectionToImprove[];
  /** F: actionable tailoring steps, honest about what the user must supply. */
  tailoring: string[];
  /** What the JD actually asked for — the parsing stats behind the result. */
  detected: {
    requiredSkills: number;
    preferredSkills: number;
    concepts: number;
    experienceYears: number | null;
    educationRequired: boolean;
    certificationMentioned: boolean;
  };
  /** The global honesty note rendered with every match. */
  note: string;
}

const PREFERRED_SIGNAL = /\b(nice to have|nice-to-have|preferred|bonus|plus points?|desirable|good to have|optional but)\b/i;
const REQUIRED_HEADING = /\b(requirements?|must have|must-have|required|qualifications?|what you.?ll need|about you)\b/i;
const EXPERIENCE_YEARS = /\b(\d{1,2})\s*\+?\s*(?:-\s*\d{1,2}\s*)?years?\s*(?:of\s*)?(?:experience|exp\.?)?\b/i;
const DEGREE = /\b(bachelor(?:'?s)?|master(?:'?s)?|b\.?tech|m\.?tech|b\.?sc|m\.?sc|bca|mca|mba|ph\.?d|diploma|degree)\b/i;
const CERTIFICATION = /\b(certifications?|certified|credential)\b/i;

/** Lines short enough to be structural headings of a JD. */
function isHeading(line: string): boolean {
  return line.length <= 60;
}

export interface JobMatchInput {
  jobDescription: string;
  header: string[];
  sections: Record<string, string>;
  analysis: ResumeAnalysis;
}

/** First resume lines that actually name a term, for evidence. */
function evidenceLinesFor(term: string, labelled: [KeywordSection, string][], cap = 2): string[] {
  const out: string[] = [];
  for (const [, text] of labelled) {
    for (const line of text.split('\n')) {
      if (!line.trim()) continue;
      const inLine =
        taxonomySkillsIn(line).some((s) => s.name === term) || conceptTermsIn(line).includes(term);
      if (inLine) {
        const trimmed = line.trim();
        if (!out.includes(trimmed)) out.push(trimmed.length > 160 ? `${trimmed.slice(0, 157)}…` : trimmed);
        if (out.length >= cap) return out;
      }
    }
  }
  return out;
}

/**
 * Match a job description against the stored resume.
 * Pure and deterministic: no clock inside the score (the timestamp lives on
 * the envelope), no randomness, no network.
 */
export function matchJobDescription(input: JobMatchInput): JobMatchResult {
  const labelled: [KeywordSection, string][] = [
    ...(input.header.length > 0 ? ([['header', input.header.join('\n')]] as [KeywordSection, string][]) : []),
    ...Object.entries(input.sections)
      .filter(([, text]) => text && text.trim())
      .map(([key, text]): [KeywordSection, string] => [key as KeywordSection, text])
  ];

  const resumeKeywords: AtsKeywordAnalysis = analyseKeywords({
    header: input.header,
    sections: input.sections
  });
  const resumeTaxonomy = resumeKeywords.keywords.filter((k) => k.source === 'taxonomy');
  const resumeTermNames = new Set(resumeKeywords.keywords.map((k) => k.term));

  /* ── parse the job description ─────────────────────────────────────── */

  const jdLines = input.jobDescription
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean);

  let bucket: 'required' | 'preferred' = 'required';
  const requiredTerms = new Map<string, { category: string }>();
  const preferredTerms = new Map<string, { category: string }>();
  let experienceYears: number | null = null;
  let experienceLine = '';
  let educationRequired = false;
  let educationLine = '';
  let certificationMentioned = false;
  let certificationLine = '';

  for (const line of jdLines) {
    if (isHeading(line)) {
      if (PREFERRED_SIGNAL.test(line)) bucket = 'preferred';
      else if (REQUIRED_HEADING.test(line)) bucket = 'required';
    }

    const target = bucket === 'required' ? requiredTerms : preferredTerms;
    for (const skill of taxonomySkillsIn(line)) {
      // A term stated under both sections counts once, as required.
      if (bucket === 'preferred' && requiredTerms.has(skill.name)) continue;
      if (bucket === 'required') preferredTerms.delete(skill.name);
      target.set(skill.name, { category: skill.category });
    }
    for (const concept of conceptTermsIn(line)) {
      if (bucket === 'preferred' && (requiredTerms.has(concept) || preferredTerms.has(concept))) continue;
      if (bucket === 'required') preferredTerms.delete(concept);
      if (!requiredTerms.has(concept) && !preferredTerms.has(concept)) {
        target.set(concept, { category: 'CONCEPT' });
      }
    }

    if (experienceYears === null) {
      const years = line.match(EXPERIENCE_YEARS);
      // "5 years" only counts when the line is actually about experience —
      // "paid every 3 years" must not become a requirement.
      if (years && /\bexperien|worked|working|years? (?:of )?(?:exp)/i.test(line)) {
        experienceYears = parseInt(years[1], 10);
        experienceLine = line;
      }
    }
    if (!educationRequired && DEGREE.test(line) && /\brequired|must|need|degree in|minimum\b/i.test(line)) {
      educationRequired = true;
      educationLine = line;
    }
    if (!certificationMentioned && CERTIFICATION.test(line)) {
      certificationMentioned = true;
      certificationLine = line;
    }
  }

  /* ── compare both sides ────────────────────────────────────────────── */

  const requirements: JobRequirement[] = [];

  const makeSkillRequirement = (
    term: string,
    meta: { category: string },
    source: 'required' | 'preferred'
  ): JobRequirement => {
    const evidenced = resumeTermNames.has(term);
    const related = evidenced
      ? []
      : resumeTaxonomy
          .filter((r) => r.category === meta.category)
          .map((r) => r.term);
    return {
      kind: meta.category === 'CONCEPT' ? 'concept' : 'skill',
      label: term,
      status: evidenced ? 'matched' : 'not_evidenced',
      sections: evidenced
        ? (resumeKeywords.keywords.find((k) => k.term === term)?.sections ?? [])
        : [],
      evidence: evidenced ? evidenceLinesFor(term, labelled) : [],
      related: [...new Set(related)].slice(0, 3),
      source
    };
  };

  for (const [term, meta] of requiredTerms) requirements.push(makeSkillRequirement(term, meta, 'required'));
  for (const [term, meta] of preferredTerms) requirements.push(makeSkillRequirement(term, meta, 'preferred'));

  if (experienceYears !== null) {
    const statedMonths = input.analysis.experience.reduce(
      (sum, e) => sum + (e.durationMonths ?? 0),
      0
    );
    const hasStatedDates = input.analysis.experience.some((e) => e.durationMonths !== null);
    const met = hasStatedDates && statedMonths >= experienceYears * 12;
    requirements.push({
      kind: 'experience',
      label: `${experienceYears}+ years of experience`,
      status: met ? 'matched' : 'not_evidenced',
      sections: ['experience'],
      evidence: met
        ? input.analysis.experience.map((e) => e.evidence).slice(0, 2)
        : [experienceLine],
      related: [],
      source: 'required'
    });
  }

  if (educationRequired) {
    const met = input.analysis.education.length > 0;
    requirements.push({
      kind: 'education',
      label: 'Education requirement stated in the job description',
      status: met ? 'matched' : 'not_evidenced',
      sections: met ? ['education'] : [],
      evidence: met ? input.analysis.education.map((e) => e.evidence).slice(0, 2) : [educationLine],
      related: [],
      source: 'required'
    });
  }

  if (certificationMentioned) {
    const met = input.analysis.certifications.length > 0;
    requirements.push({
      kind: 'certification',
      label: 'Certifications mentioned in the job description',
      status: met ? 'matched' : 'not_evidenced',
      sections: met ? ['certifications'] : [],
      evidence: met ? input.analysis.certifications.map((c) => c.evidence).slice(0, 2) : [certificationLine],
      related: [],
      source: 'preferred'
    });
  }

  const matched = requirements.filter((r) => r.status === 'matched');
  const notEvidenced = requirements.filter((r) => r.status === 'not_evidenced');

  /* ── score (its own calculation, never merged with the ATS score) ──── */

  const requiredSkills = [...requiredTerms].map(([term, meta]) =>
    makeSkillRequirement(term, meta, 'required')
  );
  const preferredSkills = [...preferredTerms].map(([term, meta]) =>
    makeSkillRequirement(term, meta, 'preferred')
  );

  const parts: JobMatchPart[] = [];

  if (requiredSkills.length > 0) {
    const exact = requiredSkills.filter((r) => r.status === 'matched').length;
    parts.push({
      label: 'Required skills named in the resume',
      score: Math.round((exact / requiredSkills.length) * 100),
      weight: 60,
      summary: `${exact} of ${requiredSkills.length} required terms appear in the document. Same-category technologies are shown as context but never counted as the named skill.`
    });
  }

  if (preferredSkills.length > 0) {
    const exact = preferredSkills.filter((r) => r.status === 'matched').length;
    parts.push({
      label: 'Preferred skills named in the resume',
      score: Math.round((exact / preferredSkills.length) * 100),
      weight: 15,
      summary: `${exact} of ${preferredSkills.length} preferred terms appear in the document.`
    });
  }

  if (experienceYears !== null) {
    const statedMonths = input.analysis.experience.reduce((sum, e) => sum + (e.durationMonths ?? 0), 0);
    const hasStatedDates = input.analysis.experience.some((e) => e.durationMonths !== null);
    parts.push({
      label: 'Stated experience against the requirement',
      // Unverifiable dates are excluded, not failed: the resume simply has
      // nothing to check the requirement against.
      score: hasStatedDates ? (statedMonths >= experienceYears * 12 ? 100 : 0) : null,
      weight: 15,
      summary: hasStatedDates
        ? `The job asks for ${experienceYears}+ years; your dated roles state ${Math.floor(statedMonths / 12)} year${Math.floor(statedMonths / 12) === 1 ? '' : 's'} and ${statedMonths % 12} months.`
        : 'Your roles carry no readable dates, so this requirement cannot be verified either way and is excluded from the score.'
    });
  }

  const matchedRequired = requiredSkills.filter((r) => r.status === 'matched');
  const anchored = matchedRequired.filter((r) => r.sections.includes('experience') || r.sections.includes('projects'));
  parts.push({
    label: 'Matched skills anchored to real work',
    score: matchedRequired.length === 0 ? null : Math.round((anchored.length / matchedRequired.length) * 100),
    weight: 10,
    summary:
      matchedRequired.length === 0
        ? 'No required term is evidenced, so there is nothing to anchor.'
        : `${anchored.length} of ${matchedRequired.length} matched required terms appear inside experience or project descriptions, not only in a list.`
  });

  const available = parts.filter((p) => p.score !== null);
  const totalWeight = available.reduce((sum, p) => sum + p.weight, 0);
  const overall =
    totalWeight === 0 || requirements.length === 0
      ? null
      : Math.round(available.reduce((sum, p) => sum + (p.score as number) * p.weight, 0) / totalWeight);

  const score: JobMatchScore = {
    overall,
    parts,
    methodologyVersion: JOB_MATCH_VERSION,
    basis:
      overall === null
        ? 'No requirements could be read from this job description, so no match score is computed — an empty score is honest, a fabricated one is not.'
        : `Computed by DevProof's deterministic match methodology v${JOB_MATCH_VERSION} as a weighted mean of the parts shown (60 required / 15 preferred / 15 experience / 10 anchoring, excluding parts with no input). This is a keyword-and-evidence comparison, not a prediction of interview selection, and it says nothing about proficiency.`
  };

  /* ── E: sections that would gain the most ──────────────────────────── */

  const sectionsToImprove: SectionToImprove[] = [];
  const matchedNotInSkills = matched.filter(
    (r) => r.kind !== 'experience' && r.sections.length > 0 && !r.sections.includes('skills')
  );
  if (matchedNotInSkills.length > 0 && input.sections.skills) {
    sectionsToImprove.push({
      section: 'Skills',
      reason: `${matchedNotInSkills.length} matched term${matchedNotInSkills.length === 1 ? '' : 's'} appear in the document but not in your skills list (${matchedNotInSkills.map((r) => r.label).slice(0, 5).join(', ')}). Consolidating names you genuinely work with makes them findable in one place.`
    });
  }
  const anchoredGaps = notEvidenced.filter((r) => r.kind === 'skill' && r.source === 'required');
  if (anchoredGaps.length > 0 && input.sections.experience) {
    sectionsToImprove.push({
      section: 'Experience',
      reason: `The job emphasises ${anchoredGaps.slice(0, 4).map((r) => r.label).join(', ')} — if you have used any of them in real work, that use belongs in a bullet under the role where it happened.`
    });
  }

  /* ── F: tailoring steps ────────────────────────────────────────────── */

  const tailoring: string[] = [];
  for (const gap of notEvidenced.filter((r) => r.kind === 'skill' && r.source === 'required').slice(0, 5)) {
    tailoring.push(
      gap.related.length > 0
        ? `The resume does not name "${gap.label}", though it does name ${gap.related.join(', ')} in the same area. If you have genuinely used ${gap.label}, add it where you actually used it; if not, emphasise the related work you do have rather than claiming it.`
        : `The resume does not name "${gap.label}". If you have used it, add it to the section where you used it — and if you have not, leave it out and lean on the strengths you can evidence.`
    );
  }
  if (matchedNotInSkills.length > 0) {
    tailoring.push(
      `Mirror the job's own wording where it is truthful: the matched terms ${matchedNotInSkills
        .slice(0, 4)
        .map((r) => r.label)
        .join(', ')} appear in your document but not in a single scannable list.`
    );
  }
  if (experienceYears !== null) {
    const statedMonths = input.analysis.experience.reduce((sum, e) => sum + (e.durationMonths ?? 0), 0);
    const hasStatedDates = input.analysis.experience.some((e) => e.durationMonths !== null);
    if (hasStatedDates && statedMonths < experienceYears * 12) {
      tailoring.push(
        `The posting asks for ${experienceYears}+ years and your dated roles state ${Math.floor(statedMonths / 12)} — lead with the depth of specific work and any substantial internship or project history rather than inflating dates.`
      );
    } else if (!hasStatedDates) {
      tailoring.push(
        'Your roles carry no readable dates, so no experience requirement can be checked. Add unambiguous dates to each role — that is a formatting fix, not a claim.'
      );
    }
  }

  return {
    methodologyVersion: JOB_MATCH_VERSION,
    matchedAt: new Date().toISOString(),
    score,
    matched,
    notEvidenced,
    sectionsToImprove,
    tailoring,
    detected: {
      requiredSkills: requiredTerms.size,
      preferredSkills: preferredTerms.size,
      concepts: [...requiredTerms, ...preferredTerms].filter(([, m]) => m.category === 'CONCEPT').length,
      experienceYears,
      educationRequired,
      certificationMentioned
    },
    note:
      'A match means the resume mentions the term — evidence of exposure, not proof of proficiency. "Not evidenced" means this document does not say it, not that you lack it.'
  };
}
