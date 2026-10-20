import { buildSectionChecks } from './sections';
import { buildFormattingChecks } from './formatting';
import { analyseKeywords } from './keywords';
import { scoreResume } from './scoring';
import { buildFindings } from './findings';
import { buildRecommendations } from './recommendations';
import { ATS_METHODOLOGY_VERSION, type AtsAnalysis } from './types';
import type { ResumeAnalysis } from '../resumeAnalysis.service';

// ==========================================
// ATS ANALYSIS — ORCHESTRATOR
// ==========================================
// One entry point that runs every analysis layer over one parsed document,
// in dependency order: checks and keywords feed the score and the findings;
// the findings and checks feed the recommendations. Everything below is
// deterministic — the same document always yields the same analysis, with
// only the envelope timestamp differing.

/** Keys the section splitter produces — used to count recognised headings. */
const STANDARD_SECTION_KEYS = [
  'summary',
  'experience',
  'education',
  'skills',
  'projects',
  'certifications',
  'achievements'
];

export interface AtsInput {
  /** Lines before the first recognised heading (name/contact block). */
  header: string[];
  /** Recognised section text. */
  sections: Record<string, string>;
  /** The structured reading of the same document (ResumeAnalysis). */
  analysis: ResumeAnalysis;
  wordCount: number;
}

export function analyseAts(input: AtsInput): AtsAnalysis {
  const { header, sections, analysis } = input;

  const sectionChecks = buildSectionChecks({ header, sections, analysis });
  const formattingChecks = buildFormattingChecks({ sections, analysis });
  const keywords = analyseKeywords({ header, sections });

  const score = scoreResume({
    analysis,
    sectionChecks,
    formattingChecks,
    keywords,
    wordCount: input.wordCount,
    recognisedSections: Object.keys(sections).filter((key) => STANDARD_SECTION_KEYS.includes(key)).length,
    headerPresent: header.length > 0
  });

  const { strengths, weaknesses } = buildFindings({ analysis, sectionChecks, keywords });
  const recommendations = buildRecommendations({ sectionChecks, formattingChecks, weaknesses });

  return {
    methodologyVersion: ATS_METHODOLOGY_VERSION,
    analysedAt: new Date().toISOString(),
    score,
    sectionChecks,
    formattingChecks,
    keywords,
    strengths,
    weaknesses,
    recommendations
  };
}

export { ATS_METHODOLOGY_VERSION } from './types';
export type { AtsAnalysis } from './types';
