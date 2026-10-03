import { EvidenceLevel, MetricCategory, SkillCategory } from '@prisma/client';
import { prisma } from '../config/database';

// ==========================================
// CAREER READINESS SERVICE
// ==========================================
// Scores a developer against role definitions made of explicit, checkable
// requirements.
//
// The design constraint is explainability: every point in a score traces to one
// named requirement, and every met requirement names the evidence that met it.
// There is no model, no weighting learned from data, and no number that cannot
// be read back as a sentence. A user who disagrees with their score can be
// shown exactly which requirement produced it and what would satisfy it.
//
// Nothing is persisted. A stored readiness score goes stale the moment the next
// analysis lands, and a stale score presented as current is the kind of
// unearned claim this product exists to avoid.

/** How a requirement is checked. Each maps to data DevProof actually holds. */
type RequirementCheck =
  | { kind: 'skillInCategory'; category: SkillCategory; minimumLevel: EvidenceLevel }
  | { kind: 'namedSkill'; names: string[]; minimumLevel: EvidenceLevel }
  | { kind: 'analysisMetric'; metric: MetricCategory; minimumScore: number }
  | { kind: 'analyzedRepositories'; minimum: number }
  | { kind: 'problemSolving'; minimumSolved: number };

interface RoleRequirement {
  id: string;
  label: string;
  /**
   * Relative importance within the role, 1–3.
   *
   * Deliberately coarse: a finer scale would imply a precision these weights
   * do not have. They encode "core / important / supporting", nothing more.
   */
  weight: 1 | 2 | 3;
  check: RequirementCheck;
}

interface RoleDefinition {
  id: string;
  name: string;
  summary: string;
  requirements: RoleRequirement[];
}

/** Ordering of the evidence ladder, lowest first. */
const LEVEL_RANK: Record<EvidenceLevel, number> = {
  CLAIMED: 0,
  LEARNED: 1,
  CREDENTIAL_VERIFIED: 2,
  PRACTICALLY_EVIDENCED: 3
};

/**
 * Requirements shared by every engineering role.
 *
 * Kept in one place so a role definition only states what is distinctive about
 * it, and so a change to the common baseline applies everywhere.
 */
const COMMON_REQUIREMENTS: RoleRequirement[] = [
  {
    id: 'analyzed-repositories',
    label: 'At least two repositories analyzed',
    weight: 2,
    check: { kind: 'analyzedRepositories', minimum: 2 }
  },
  {
    id: 'testing-practice',
    label: 'Evidence of automated testing',
    weight: 2,
    check: { kind: 'analysisMetric', metric: MetricCategory.TESTING, minimumScore: 50 }
  },
  {
    id: 'documentation-practice',
    label: 'Repositories are documented',
    weight: 1,
    check: { kind: 'analysisMetric', metric: MetricCategory.DOCUMENTATION, minimumScore: 60 }
  },
  {
    id: 'code-quality',
    label: 'Code quality above the review threshold',
    weight: 2,
    check: { kind: 'analysisMetric', metric: MetricCategory.CODE_QUALITY, minimumScore: 60 }
  },
  {
    id: 'security-hygiene',
    label: 'No exposed secrets or unsafe patterns detected',
    weight: 1,
    check: { kind: 'analysisMetric', metric: MetricCategory.SECURITY, minimumScore: 70 }
  }
];

const ROLES: RoleDefinition[] = [
  {
    id: 'frontend-engineer',
    name: 'Frontend Engineer',
    summary: 'Builds user interfaces with evidence of component work, styling and testing.',
    requirements: [
      {
        id: 'frontend-skill',
        label: 'A frontend technology demonstrated in code',
        weight: 3,
        check: { kind: 'skillInCategory', category: SkillCategory.FRONTEND, minimumLevel: EvidenceLevel.PRACTICALLY_EVIDENCED }
      },
      {
        id: 'frontend-language',
        label: 'JavaScript or TypeScript demonstrated in code',
        weight: 3,
        check: { kind: 'namedSkill', names: ['JavaScript', 'TypeScript'], minimumLevel: EvidenceLevel.PRACTICALLY_EVIDENCED }
      },
      ...COMMON_REQUIREMENTS
    ]
  },
  {
    id: 'backend-engineer',
    name: 'Backend Engineer',
    summary: 'Builds services and data layers with evidence of API, database and testing work.',
    requirements: [
      {
        id: 'backend-skill',
        label: 'A backend technology demonstrated in code',
        weight: 3,
        check: { kind: 'skillInCategory', category: SkillCategory.BACKEND, minimumLevel: EvidenceLevel.PRACTICALLY_EVIDENCED }
      },
      {
        id: 'database-skill',
        label: 'A database technology demonstrated in code',
        weight: 3,
        check: { kind: 'skillInCategory', category: SkillCategory.DATABASE, minimumLevel: EvidenceLevel.PRACTICALLY_EVIDENCED }
      },
      {
        id: 'dependency-health',
        label: 'Dependencies are managed with a lockfile',
        weight: 1,
        check: { kind: 'analysisMetric', metric: MetricCategory.DEPENDENCY_HEALTH, minimumScore: 70 }
      },
      ...COMMON_REQUIREMENTS
    ]
  },
  {
    id: 'full-stack-engineer',
    name: 'Full Stack Engineer',
    summary: 'Works across the stack with demonstrated frontend, backend and data work.',
    requirements: [
      {
        id: 'frontend-skill',
        label: 'A frontend technology demonstrated in code',
        weight: 3,
        check: { kind: 'skillInCategory', category: SkillCategory.FRONTEND, minimumLevel: EvidenceLevel.PRACTICALLY_EVIDENCED }
      },
      {
        id: 'backend-skill',
        label: 'A backend technology demonstrated in code',
        weight: 3,
        check: { kind: 'skillInCategory', category: SkillCategory.BACKEND, minimumLevel: EvidenceLevel.PRACTICALLY_EVIDENCED }
      },
      {
        id: 'database-skill',
        label: 'A database technology demonstrated in code',
        weight: 2,
        check: { kind: 'skillInCategory', category: SkillCategory.DATABASE, minimumLevel: EvidenceLevel.PRACTICALLY_EVIDENCED }
      },
      ...COMMON_REQUIREMENTS
    ]
  },
  {
    id: 'devops-engineer',
    name: 'DevOps Engineer',
    summary: 'Automates build and deployment with evidence of containers and pipelines.',
    requirements: [
      {
        id: 'devops-skill',
        label: 'A DevOps technology demonstrated in code',
        weight: 3,
        check: { kind: 'skillInCategory', category: SkillCategory.DEVOPS, minimumLevel: EvidenceLevel.PRACTICALLY_EVIDENCED }
      },
      {
        id: 'ci-cd',
        label: 'A CI/CD pipeline present in a repository',
        weight: 3,
        check: { kind: 'namedSkill', names: ['CI/CD'], minimumLevel: EvidenceLevel.PRACTICALLY_EVIDENCED }
      },
      {
        id: 'maintainability',
        label: 'Maintainability above the review threshold',
        weight: 2,
        check: { kind: 'analysisMetric', metric: MetricCategory.MAINTAINABILITY, minimumScore: 60 }
      },
      ...COMMON_REQUIREMENTS
    ]
  },
  {
    id: 'software-engineer-new-grad',
    name: 'Software Engineer (New Grad)',
    summary: 'Entry-level engineering, weighted towards fundamentals and problem solving.',
    requirements: [
      {
        id: 'any-language',
        label: 'A programming language demonstrated in code',
        weight: 3,
        check: { kind: 'skillInCategory', category: SkillCategory.GENERAL, minimumLevel: EvidenceLevel.PRACTICALLY_EVIDENCED }
      },
      {
        id: 'problem-solving',
        label: 'At least 100 problems solved on a coding platform',
        weight: 3,
        check: { kind: 'problemSolving', minimumSolved: 100 }
      },
      ...COMMON_REQUIREMENTS
    ]
  }
];

export interface RequirementResult {
  id: string;
  label: string;
  weight: number;
  met: boolean;
  /** What satisfied it, or what is missing. Always populated. */
  evidence: string;
}

export interface RoleReadiness {
  roleId: string;
  role: string;
  summary: string;
  /** 0–100: the share of requirement weight met. */
  score: number;
  requirementsMet: number;
  requirementsTotal: number;
  requirements: RequirementResult[];
}

export interface CareerReadiness {
  /**
   * False when the user has no evidence at all. The roles are still returned
   * with every requirement unmet, because "nothing demonstrated yet" is a
   * truthful answer and a more useful one than an empty response.
   */
  hasEvidence: boolean;
  bestMatch: string | null;
  roles: RoleReadiness[];
}

/** The evidence a readiness run is computed against, loaded once. */
interface EvidenceSnapshot {
  skills: { name: string; category: SkillCategory; currentLevel: EvidenceLevel }[];
  metricAverages: Partial<Record<MetricCategory, number>>;
  analyzedRepositories: number;
  problemsSolved: number;
}

export class CareerReadinessService {
  static async getReadiness(userId: string): Promise<CareerReadiness> {
    const snapshot = await CareerReadinessService.loadEvidence(userId);

    const roles = ROLES.map((role) => CareerReadinessService.scoreRole(role, snapshot));

    const hasEvidence =
      snapshot.skills.length > 0 ||
      snapshot.analyzedRepositories > 0 ||
      snapshot.problemsSolved > 0;

    // Ties resolve to the role defined first, which is stable across requests.
    const best = roles.reduce((top, role) => (role.score > top.score ? role : top), roles[0]);

    return {
      hasEvidence,
      bestMatch: hasEvidence && best.score > 0 ? best.role : null,
      roles: [...roles].sort((a, b) => b.score - a.score)
    };
  }

  private static async loadEvidence(userId: string): Promise<EvidenceSnapshot> {
    const [skills, analyses, codingProfiles] = await Promise.all([
      prisma.skill.findMany({
        where: { userId },
        select: { name: true, category: true, currentLevel: true }
      }),
      prisma.repositoryAnalysis.findMany({
        where: { userId, status: 'COMPLETED' },
        select: { repositoryId: true, metrics: { select: { category: true, score: true } } }
      }),
      prisma.codingProfile.findMany({ where: { userId }, select: { totalSolved: true } })
    ]);

    // Average each metric across analyses. A repository analyzed twice counts
    // twice, which is correct: the later analysis reflects the current state and
    // should pull the average towards it.
    const totals = new Map<MetricCategory, { sum: number; count: number }>();
    for (const analysis of analyses) {
      for (const metric of analysis.metrics) {
        const current = totals.get(metric.category) ?? { sum: 0, count: 0 };
        current.sum += metric.score;
        current.count += 1;
        totals.set(metric.category, current);
      }
    }

    const metricAverages: Partial<Record<MetricCategory, number>> = {};
    for (const [category, { sum, count }] of totals) {
      metricAverages[category] = sum / count;
    }

    return {
      skills,
      metricAverages,
      analyzedRepositories: new Set(analyses.map((a) => a.repositoryId)).size,
      problemsSolved: codingProfiles.reduce((sum, p) => sum + p.totalSolved, 0)
    };
  }

  private static scoreRole(role: RoleDefinition, snapshot: EvidenceSnapshot): RoleReadiness {
    const requirements = role.requirements.map((requirement) =>
      CareerReadinessService.evaluate(requirement, snapshot)
    );

    const totalWeight = role.requirements.reduce((sum, r) => sum + r.weight, 0);
    const metWeight = role.requirements.reduce(
      (sum, r, index) => (requirements[index].met ? sum + r.weight : sum),
      0
    );

    return {
      roleId: role.id,
      role: role.name,
      summary: role.summary,
      score: totalWeight > 0 ? Math.round((metWeight / totalWeight) * 100) : 0,
      requirementsMet: requirements.filter((r) => r.met).length,
      requirementsTotal: requirements.length,
      requirements
    };
  }

  /** Check one requirement, always reporting what did or did not satisfy it. */
  private static evaluate(
    requirement: RoleRequirement,
    snapshot: EvidenceSnapshot
  ): RequirementResult {
    const base = { id: requirement.id, label: requirement.label, weight: requirement.weight };
    const check = requirement.check;

    switch (check.kind) {
      case 'skillInCategory': {
        const matches = snapshot.skills.filter(
          (skill) =>
            skill.category === check.category &&
            LEVEL_RANK[skill.currentLevel] >= LEVEL_RANK[check.minimumLevel]
        );
        return {
          ...base,
          met: matches.length > 0,
          evidence:
            matches.length > 0
              ? `${matches.map((s) => s.name).join(', ')} (${check.minimumLevel.toLowerCase().replace(/_/g, ' ')})`
              : `No ${check.category.toLowerCase()} skill at ${check.minimumLevel.toLowerCase().replace(/_/g, ' ')} yet`
        };
      }

      case 'namedSkill': {
        const matches = snapshot.skills.filter(
          (skill) =>
            check.names.includes(skill.name) &&
            LEVEL_RANK[skill.currentLevel] >= LEVEL_RANK[check.minimumLevel]
        );
        return {
          ...base,
          met: matches.length > 0,
          evidence:
            matches.length > 0
              ? matches.map((s) => s.name).join(', ')
              : `Needs one of: ${check.names.join(', ')}`
        };
      }

      case 'analysisMetric': {
        const average = snapshot.metricAverages[check.metric];
        if (average === undefined) {
          return {
            ...base,
            met: false,
            evidence: 'No completed analysis has measured this yet'
          };
        }
        return {
          ...base,
          met: average >= check.minimumScore,
          evidence: `${Math.round(average)}/100 average, threshold ${check.minimumScore}`
        };
      }

      case 'analyzedRepositories':
        return {
          ...base,
          met: snapshot.analyzedRepositories >= check.minimum,
          evidence: `${snapshot.analyzedRepositories} analyzed, needs ${check.minimum}`
        };

      case 'problemSolving':
        return {
          ...base,
          met: snapshot.problemsSolved >= check.minimumSolved,
          evidence: `${snapshot.problemsSolved} solved, needs ${check.minimumSolved}`
        };
    }
  }
}
