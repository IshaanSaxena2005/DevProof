import type {
  AtsCategoryScore,
  AtsCategoryId,
  AtsCheck,
  AtsKeywordAnalysis,
  AtsScore,
  CheckStatus
} from './types';
import { ATS_METHODOLOGY_VERSION } from './types';
import type { ResumeAnalysis } from '../resumeAnalysis.service';

// ==========================================
// DETERMINISTIC ATS SCORING ENGINE
// ==========================================
// One number, computed from documented rules over the analysis results — no
// randomness, no model opinion, no flattering defaults. The same document
// always produces the same score.
//
// The rules that keep it honest:
//  - Every category documents its calculation in its `summary`, with the
//    actual counts the calculation used.
//  - A category whose input cannot be determined scores null and is
//    EXCLUDED from the total; the remaining weights are renormalised. An
//    unavailable check is never counted as a failure.
//  - Optional content (certifications for a fresher, projects for a senior)
//    is handled by applicability rules inside categories, not by pretending
//    absence is always a defect.
//  - The methodology is versioned: changing any weight or rule below
//    requires bumping ATS_METHODOLOGY_VERSION.

/** Category weights — sum to 100 when every category is available. */
export const CATEGORY_WEIGHTS: Record<AtsCategoryId, number> = {
  parsing: 10,
  sections: 25,
  contact: 15,
  keywords: 20,
  structure: 15,
  credentials: 10,
  formatting: 5
};

export interface ScoringInput {
  analysis: ResumeAnalysis;
  sectionChecks: AtsCheck[];
  formattingChecks: AtsCheck[];
  keywords: AtsKeywordAnalysis;
  wordCount: number;
  /** How many standard headings the splitter recognised. */
  recognisedSections: number;
  /** Whether the document has a name/contact header block. */
  headerPresent: boolean;
}

/** Check status → component value. Unknown is excluded, never zero. */
function valueOf(status: CheckStatus): number | null {
  if (status === 'passed') return 1;
  if (status === 'needs_improvement') return 0.5;
  if (status === 'not_detected') return 0;
  return null;
}

/** Weighted average over available components, scaled to 0–100. Components
 *  whose value is null are dropped and the rest renormalised. */
function weighted(components: { value: number | null; weight: number }[]): number | null {
  const applicable = components.filter((c): c is { value: number; weight: number } => c.value !== null);
  const totalWeight = applicable.reduce((sum, c) => sum + c.weight, 0);
  if (totalWeight === 0) return null;
  const earned = applicable.reduce((sum, c) => sum + c.value * c.weight, 0);
  return Math.round((earned / totalWeight) * 100);
}

function checkById(checks: AtsCheck[], id: string): AtsCheck | undefined {
  return checks.find((c) => c.id === id);
}

/* ── per-category calculations ───────────────────────────────────────── */

function scoreParsing(input: ScoringInput): number {
  const sectionsPart = Math.min(1, input.recognisedSections / 5) * 50;
  const words = input.wordCount;
  const lengthPart = words >= 150 && words <= 1500 ? 25 : words >= 80 && words < 150 ? 12.5 : 0;
  const headerPart = input.headerPresent ? 25 : 0;
  return Math.round(sectionsPart + lengthPart + headerPart);
}

function scoreSections(input: ScoringInput): number | null {
  const months = input.analysis.experience.reduce(
    (sum, entry) => sum + (entry.durationMonths ?? 0),
    0
  );
  const earlyCareerWithProjects =
    input.analysis.experience.length === 0 && input.analysis.projects.length >= 2;

  // Applicability per section: what this resume legitimately should contain.
  // Education drops out for a long career; projects drop out for a
  // substantial one; experience drops out only for an early-career resume
  // whose projects carry the evidence instead.
  const components = [
    { id: 'skills', weight: 25 },
    { id: 'summary', weight: 10 },
    { id: 'experience', weight: 25, applicable: !(earlyCareerWithProjects && months < 24) },
    { id: 'projects', weight: 20, applicable: months < 24 },
    { id: 'education', weight: 20, applicable: months < 36 }
  ].map(({ id, weight, applicable = true }) => {
    if (!applicable) return { value: null, weight };
    return { value: valueOf(checkById(input.sectionChecks, id)?.status ?? 'unknown'), weight };
  });

  return weighted(components);
}

function scoreContact(input: ScoringInput): number {
  const { email, phone, links } = input.analysis.contact;
  return weighted([
    { value: email ? 1 : 0, weight: 40 },
    { value: phone ? 1 : 0, weight: 30 },
    { value: links.length > 0 ? 1 : 0, weight: 30 }
  ]) ?? 0;
}

function scoreKeywords(input: ScoringInput): number {
  const taxonomyTerms = input.keywords.keywords.filter((k) => k.source === 'taxonomy');
  const distinct = taxonomyTerms.length;

  // Breadth: eight or more distinct named technologies is a full shelf.
  const breadth = Math.min(1, distinct / 8) * 50;

  // Consolidation: the skills section should carry most of what the document
  // names, so a screener finds one authoritative list.
  const inSkills = taxonomyTerms.filter((k) => k.sections.includes('skills')).length;
  const consolidation = distinct === 0 ? 0 : (inSkills / distinct) * 25;

  // Cross-evidence: technologies that also appear in experience or projects
  // are attached to work, not floating in a list.
  const crossEvidenced = taxonomyTerms.filter(
    (k) => k.sections.includes('experience') || k.sections.includes('projects')
  ).length;
  const cross = Math.min(1, crossEvidenced / 3) * 25;

  return Math.round(breadth + consolidation + cross);
}

function scoreStructure(input: ScoringInput): number | null {
  const { experience, projects } = input.analysis;

  const components: { value: number | null; weight: number }[] = [];

  if (experience.length > 0) {
    // Per entry: role, organisation, dates and at least one bullet, each a
    // quarter of the entry's readability.
    const entryQuality =
      experience.reduce((sum, entry) => {
        const parts = [!!entry.role, !!entry.organization, !!entry.period, entry.highlights.length > 0];
        return sum + parts.filter(Boolean).length / parts.length;
      }, 0) / experience.length;

    const allHighlights = experience.flatMap((e) => e.highlights);
    const quantified =
      allHighlights.length === 0
        ? null
        : Math.min(1, allHighlights.filter((h) => /\d/.test(h)).length / allHighlights.length / 0.5);

    components.push({ value: entryQuality, weight: 50 }, { value: quantified, weight: 30 });
  }

  if (projects.length > 0) {
    const described =
      projects.filter((p) => p.description && p.description.split(/\s+/).length >= 8).length /
      projects.length;
    components.push({ value: described, weight: 20 });
  }

  if (components.length === 0) return null;
  return weighted(components);
}

function scoreCredentials(input: ScoringInput): number | null {
  const { education, certifications } = input.analysis;

  const components: { value: number | null; weight: number }[] = [];

  if (education.length > 0) {
    const completeness =
      education.reduce((sum, entry) => {
        const parts = [!!entry.qualification, !!entry.institution, !!entry.period];
        return sum + parts.filter(Boolean).length / parts.length;
      }, 0) / education.length;
    components.push({ value: completeness, weight: 60 });
  }

  if (certifications.length > 0) {
    const attributable =
      certifications.filter(
        (c) => !!c.issuer && (!!c.issueDate || !!c.credentialId || !!c.credentialUrl)
      ).length / certifications.length;
    components.push({ value: attributable, weight: 40 });
  }

  if (components.length === 0) return null;
  return weighted(components);
}

function scoreFormatting(input: ScoringInput): number | null {
  return weighted(
    input.formattingChecks.map((check) => ({ value: valueOf(check.status), weight: 1 }))
  );
}

/* ── the score ───────────────────────────────────────────────────────── */

const CATEGORY_LABELS: Record<AtsCategoryId, string> = {
  parsing: 'Document parsing',
  sections: 'Section completeness',
  contact: 'Contact information',
  keywords: 'Skills & keyword coverage',
  structure: 'Experience & project structure',
  credentials: 'Education & certifications',
  formatting: 'Formatting & dates'
};

function summariseCategory(id: AtsCategoryId, score: number | null, input: ScoringInput): string {
  if (score === null) {
    return 'Not graded: this document has no input for this category, so it is excluded from the total rather than counted as a failure.';
  }
  switch (id) {
    case 'parsing':
      return `${input.recognisedSections} standard section${input.recognisedSections === 1 ? '' : 's'} recognised, ${input.wordCount} words read, ${input.headerPresent ? 'a' : 'no'} name/contact block above the sections.`;
    case 'sections': {
      const listed = ['skills', 'summary', 'experience', 'projects', 'education']
        .filter((key) => checkById(input.sectionChecks, key))
        .map((key) => `${key}: ${checkById(input.sectionChecks, key)!.status.replace('_', ' ')}`);
      return `Weighted over the applicable sections — ${listed.join('; ')}.`;
    }
    case 'contact': {
      const { email, phone, links } = input.analysis.contact;
      return `Email ${email ? 'found' : 'missing'}, phone ${phone ? 'found' : 'missing'}, profile link ${links.length > 0 ? 'found' : 'missing'} (weights 40/30/30).`;
    }
    case 'keywords': {
      const taxonomy = input.keywords.keywords.filter((k) => k.source === 'taxonomy').length;
      return `${taxonomy} distinct named technologies: breadth up to 50 points, consolidation in the skills section up to 25, appearances attached to experience or projects up to 25.`;
    }
    case 'structure': {
      const roles = input.analysis.experience.length;
      const projects = input.analysis.projects.length;
      const highlights = input.analysis.experience.reduce((sum, e) => sum + e.highlights.length, 0);
      return `${roles} role${roles === 1 ? '' : 's'} (${highlights} bullet${highlights === 1 ? '' : 's'}), ${projects} project${projects === 1 ? '' : 's'} — graded only over what exists.`;
    }
    case 'credentials': {
      const education = input.analysis.education.length;
      const certifications = input.analysis.certifications.length;
      return `${education} education entr${education === 1 ? 'y' : 'ies'} and ${certifications} certification${certifications === 1 ? '' : 's'} present — only the present parts are graded.`;
    }
    case 'formatting': {
      const passed = input.formattingChecks.filter((c) => c.status === 'passed').length;
      const graded = input.formattingChecks.filter((c) => c.status !== 'unknown').length;
      return `${passed} of ${graded} gradable formatting checks passed; ungradable checks are excluded.`;
    }
  }
}

/**
 * Compute the compatibility score from the finished analysis layers.
 * Deterministic: no clock, no randomness — the same inputs yield the same
 * score (the analysis timestamp lives on the envelope, not in the number).
 */
export function scoreResume(input: ScoringInput): AtsScore {
  const scorers: Record<AtsCategoryId, () => number | null> = {
    parsing: () => scoreParsing(input),
    sections: () => scoreSections(input),
    contact: () => scoreContact(input),
    keywords: () => scoreKeywords(input),
    structure: () => scoreStructure(input),
    credentials: () => scoreCredentials(input),
    formatting: () => scoreFormatting(input)
  };

  const categories: AtsCategoryScore[] = (Object.keys(CATEGORY_WEIGHTS) as AtsCategoryId[]).map(
    (id) => {
      const score = scorers[id]();
      return {
        id,
        label: CATEGORY_LABELS[id],
        score,
        weight: CATEGORY_WEIGHTS[id],
        summary: summariseCategory(id, score, input)
      };
    }
  );

  const available = categories.filter((c): c is AtsCategoryScore & { score: number } => c.score !== null);
  const totalWeight = available.reduce((sum, c) => sum + c.weight, 0);

  const overall =
    totalWeight === 0
      ? 0
      : Math.max(
          0,
          Math.min(100, Math.round(available.reduce((sum, c) => sum + c.score * c.weight, 0) / totalWeight))
        );

  const excluded = categories.filter((c) => c.score === null);
  const basis =
    `Computed by DevProof's deterministic ATS-compatibility methodology v${ATS_METHODOLOGY_VERSION} ` +
    `from the checks shown here${excluded.length > 0 ? `; ${excluded.map((c) => c.label).join(', ')} excluded (no input to grade)` : ''}. ` +
    'This score is not issued by any ATS vendor and does not predict shortlisting — it grades how completely and readably a parser can route this document.';

  return { overall, methodologyVersion: ATS_METHODOLOGY_VERSION, categories, basis };
}
