import type {
  AtsCheck,
  AtsRecommendation,
  AtsWeakness,
  RecommendationPriority
} from './types';

// ==========================================
// ATS RECOMMENDATION ENGINE
// ==========================================
// Prioritised actions generated from actual findings — never a canned list.
//
// The rules:
//  - Priority follows defined mappings (severity and check weight), not
//    sentiment. High means a screener or parser is likely blocked; medium
//    means evidence is weakened; low means polish.
//  - Multiple checks describing the same underlying issue produce ONE
//    recommendation: a weakness suppresses the checks it already covers
//    (see CHECK_SUPPRESSION), and absent optional sections never generate
//    demands.
//  - Every recommendation names why it fired for THIS resume — the finding
//    or the detected line that triggered it.

export interface RecommendationInput {
  sectionChecks: AtsCheck[];
  formattingChecks: AtsCheck[];
  weaknesses: AtsWeakness[];
}

const PRIORITY_ORDER: Record<RecommendationPriority, number> = { high: 0, medium: 1, low: 2 };

/** Weakness findings that already speak for a check's gap. */
const CHECK_SUPPRESSION: Record<string, string[]> = {
  contact: ['missing-contact'],
  summary: ['missing-summary'],
  experience: ['missing-bullets', 'undated-roles', 'unquantified-impact', 'weak-action-verbs'],
  projects: ['thin-projects', 'no-evidence-carrier'],
  certifications: ['unattributed-certifications'],
  achievements: ['undated-achievements'],
  'date-coverage': ['undated-roles'],
  'date-order': ['undated-roles'],
  'bullet-structure': ['missing-bullets'],
  skills: [],
  education: [],
  'section-headings': []
};

/**
 * `not_detected` only earns a recommendation for sections whose absence
 * genuinely blocks a screen. Absent optional sections (certifications,
 * achievements, projects for a long career, education for a veteran) are
 * reported by their check but never demanded here.
 */
const CORE_SECTIONS = new Set(['contact', 'skills', 'experience']);

/** Priority per check, by how much a gap there obstructs a screen. */
const CHECK_PRIORITY: Record<string, RecommendationPriority> = {
  contact: 'high',
  skills: 'high',
  experience: 'high',
  'section-headings': 'high',
  'date-coverage': 'high',
  'date-order': 'high',
  'bullet-structure': 'high',
  summary: 'medium',
  projects: 'medium',
  education: 'medium',
  certifications: 'medium',
  achievements: 'low'
};

/** Priority follows the finding's severity, one to one. */
const SEVERITY_PRIORITY: Record<AtsWeakness['severity'], RecommendationPriority> = {
  high: 'high',
  medium: 'medium',
  low: 'low'
};

export function buildRecommendations(input: RecommendationInput): AtsRecommendation[] {
  const recommendations: AtsRecommendation[] = [];
  const presentWeaknesses = new Set(input.weaknesses.map((w) => w.id));

  // 1. Findings the user already reads in the weaknesses panel become the
  //    primary recommendations, carrying their severity as priority.
  for (const weakness of input.weaknesses) {
    recommendations.push({
      id: `rec-${weakness.id}`,
      priority: SEVERITY_PRIORITY[weakness.severity],
      title: weakness.title,
      why: weakness.explanation,
      action: weakness.recommendation,
      evidence: weakness.evidence
    });
  }

  // 2. Checks with concrete, evidenced gaps that no finding already covers.
  const allChecks = [...input.sectionChecks, ...input.formattingChecks];
  for (const check of allChecks) {
    const suppressed = (CHECK_SUPPRESSION[check.id] ?? []).some((id) => presentWeaknesses.has(id));
    if (suppressed) continue;

    const actionable =
      check.status === 'needs_improvement' ||
      (check.status === 'not_detected' && CORE_SECTIONS.has(check.id));
    if (!actionable) continue;

    const phrase = check.status === 'not_detected' ? 'not detected' : 'needs improvement';
    recommendations.push({
      id: `rec-${check.id}`,
      priority: CHECK_PRIORITY[check.id] ?? 'medium',
      title: `${check.label} — ${phrase}`,
      why: `${check.detected ?? 'Nothing matching this check was found'}. ${check.whyItMatters}`,
      action: check.improvement ?? 'Review this section against current screening norms.',
      evidence: check.evidence
    });
  }

  recommendations.sort(
    (a, b) => PRIORITY_ORDER[a.priority] - PRIORITY_ORDER[b.priority] || a.id.localeCompare(b.id)
  );

  return recommendations;
}
