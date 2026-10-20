// ==========================================
// ATS ANALYSIS — SHARED TYPES
// ==========================================
// The contracts every ATS module produces and the scoring engine consumes.
//
// Honesty rules, in order of importance:
//  - Every score, check, finding and recommendation must be traceable to a
//    line the parser actually read. Nothing here may invent a fact about the
//    resume.
//  - "Not detected" and "unable to determine" are different states and are
//    never collapsed: an absent section is a finding, a missing input is an
//    unavailable check.
//  - The overall number is DevProof's own deterministic ATS-compatibility
//    estimate. It is not issued by any ATS vendor and guarantees nothing about
//    shortlisting.

/**
 * Version of the scoring methodology, independent of the analysis shape.
 *
 * Bumped whenever a weight, rule or category calculation changes, so a score
 * computed under an older methodology keeps its version and old dashboards
 * never silently re-interpret old numbers. The shape version lives in
 * `AtsAnalysis.methodologyVersion` — keep them in step until the shape
 * genuinely diverges from the rules that produced it.
 */
export const ATS_METHODOLOGY_VERSION = 1;

/** Outcome of one analysis check. */
export type CheckStatus =
  /** The check ran and the resume satisfies it. */
  | 'passed'
  /** The check ran and the resume fell short — a real, evidenced gap. */
  | 'needs_improvement'
  /** The check ran and the expected content is absent from the document. */
  | 'not_detected'
  /** The check could not be evaluated from this document (input unavailable). */
  | 'unknown';

/** One explainable analysis check, shown verbatim in the dashboard. */
export interface AtsCheck {
  /** Stable identifier, safe to key UI state on. */
  id: string;
  label: string;
  status: CheckStatus;
  /** Short description of what was actually found. Null when nothing was. */
  detected: string | null;
  /** Why this matters to an ATS screen — static, rule-based text. */
  whyItMatters: string;
  /** A practical improvement, specific to this resume. Null when it passed
   *  or when no improvement can be given honestly. */
  improvement: string | null;
  /** The resume lines this result rests on. Empty when nothing supports it. */
  evidence: string[];
}

export type AtsCategoryId =
  | 'parsing'
  | 'sections'
  | 'contact'
  | 'keywords'
  | 'structure'
  | 'credentials'
  | 'formatting';

/** One scored category of the compatibility calculation. */
export interface AtsCategoryScore {
  id: AtsCategoryId;
  label: string;
  /** 0–100 within the category. Null means unavailable: the category's input
   *  could not be determined, so it is excluded from the total rather than
   *  counted as a failure. */
  score: number | null;
  /** Share of the 100-point total this category carries when available.
   *  Unavailable weights are redistributed across the available ones. */
  weight: number;
  /** How this score was calculated, in one honest sentence. */
  summary: string;
}

/** The computed compatibility score and its provenance. */
export interface AtsScore {
  /** 0–100. Deterministic: the same document always yields this number. */
  overall: number;
  methodologyVersion: number;
  categories: AtsCategoryScore[];
  /** Plain-language statement of what the number is — and what it is not. */
  basis: string;
}

export type Severity = 'high' | 'medium' | 'low';

/** An evidence-grounded positive observation. */
export interface AtsStrength {
  id: string;
  title: string;
  /** What the resume does well and why it helps an ATS screen. */
  explanation: string;
  /** The lines that support the claim. Never empty — a strength without
   *  evidence is an invention. */
  evidence: string[];
}

/** An evidence-grounded gap, with a fix the user can actually apply. */
export interface AtsWeakness {
  id: string;
  title: string;
  severity: Severity;
  explanation: string;
  /** Concrete, resume-specific improvement. */
  recommendation: string;
  /**
   * Optional example wording. Placeholders only — the user supplies the
   * facts, so an example may never state a result the resume does not.
   */
  example: string | null;
  evidence: string[];
}

export type RecommendationPriority = 'high' | 'medium' | 'low';

/** One prioritised, deduplicated action item. */
export interface AtsRecommendation {
  id: string;
  priority: RecommendationPriority;
  /** What to do. */
  title: string;
  /** Why this rule fired for THIS resume. */
  why: string;
  /** How to do it. */
  action: string;
  /** The findings/evidence that triggered the recommendation. */
  evidence: string[];
}

/** Where a keyword was found in the document. */
export type KeywordSection =
  | 'header'
  | 'summary'
  | 'skills'
  | 'experience'
  | 'projects'
  | 'education'
  | 'certifications'
  | 'achievements'
  | 'other';

/** One detected keyword, with the sections that support it. */
export interface AtsKeyword {
  /** Canonical display name (normalised capitalisation). */
  term: string;
  /** Category from the project's shared skill taxonomy, or 'concept' for
   *  recognised professional terms outside it. */
  category: string;
  /** Sections the term appears in — the evidence for the match. */
  sections: KeywordSection[];
  /** Total occurrences across the document (deduplicated per section). */
  count: number;
  /**
   * 'taxonomy' — matched the project's shared skill dictionary (an explicit
   * mention of a named technology).
   * 'concept'  — a professional/CS term recognised by the keyword module.
   * Never 'inferred proficiency': presence is a mention, not a skill level.
   */
  source: 'taxonomy' | 'concept';
}

export interface AtsKeywordAnalysis {
  /** Detected keywords, sorted by section count then term. */
  keywords: AtsKeyword[];
  /** Distinct keywords found — the headline number. */
  distinctCount: number;
  /** Keywords per section, for the distribution view. */
  sectionCounts: Record<KeywordSection, number>;
}

/** The full ATS analysis stored alongside the structured resume reading. */
export interface AtsAnalysis {
  methodologyVersion: number;
  /** ISO timestamp of when this analysis was computed. */
  analysedAt: string;
  score: AtsScore;
  sectionChecks: AtsCheck[];
  formattingChecks: AtsCheck[];
  keywords: AtsKeywordAnalysis;
  strengths: AtsStrength[];
  weaknesses: AtsWeakness[];
  recommendations: AtsRecommendation[];
}
