import { EvidenceLevel, Prisma, SkillCategory } from '@prisma/client';
import { prisma } from '../config/database';
import { AppError } from '../utils/appError';

// ==========================================
// SKILL INTELLIGENCE SERVICE
// ==========================================
// Turns a user's REAL repository evidence into Skill + SkillEvidence rows.
//
// The rule this service exists to enforce: a skill appears only when something
// measured supports it, and every skill carries the evidence rows that justify
// it. Nothing here invents a technology the user might plausibly know, and a
// derived skill whose evidence disappears is deleted rather than left behind as
// a stale claim.

/** Saturation point for a skill evidenced by something present and verifiable. */
const DEFAULT_CONFIDENCE_CEILING = 95;

/**
 * Saturation point for a skill inferred from the *absence* of a finding.
 *
 * The analysis engine samples at most 20 files per repository, so "no secrets
 * were detected" means "none in the files we looked at" — not "none exist". A
 * clean result across many repositories is still worth recording, but it cannot
 * reach the confidence of evidence that something is demonstrably there.
 */
const ABSENCE_CONFIDENCE_CEILING = 60;

/** Evidence types recorded on SkillEvidence.evidenceType. */
const EVIDENCE_REPO_LANGUAGE = 'REPOSITORY_LANGUAGE';
const EVIDENCE_REPO_TOPIC = 'REPOSITORY_TOPIC';
const EVIDENCE_ANALYSIS = 'ANALYSIS_SIGNAL';

export interface SkillSeed {
  name: string;
  category: SkillCategory;
  /**
   * Upper bound on confidence for this skill, overriding {@link DEFAULT_CONFIDENCE_CEILING}.
   *
   * Exists because not all evidence is equally strong. Most skills here are
   * evidenced by something *present* — a language GitHub itself reports, a
   * Dockerfile that exists. A skill evidenced by something *absent* cannot earn
   * the same confidence no matter how often it repeats, so it gets a lower
   * ceiling rather than being excluded outright.
   */
  confidenceCeiling?: number;
}

/**
 * Recognised technology tokens, matched against a repository's GitHub language
 * and topics. Both are user-independent facts reported by GitHub, which is what
 * makes them usable as evidence.
 *
 * Deliberately a fixed list rather than "create a skill from any topic": repo
 * topics are free text, and turning "awesome", "hacktoberfest" or "college-project"
 * into claimed engineering skills is exactly the unearned inference this product
 * is supposed to avoid. Unrecognised tokens are ignored.
 */
export const TOKEN_SKILLS: Record<string, SkillSeed> = {
  // Languages
  typescript: { name: 'TypeScript', category: SkillCategory.GENERAL },
  javascript: { name: 'JavaScript', category: SkillCategory.GENERAL },
  python: { name: 'Python', category: SkillCategory.GENERAL },
  java: { name: 'Java', category: SkillCategory.GENERAL },
  go: { name: 'Go', category: SkillCategory.GENERAL },
  rust: { name: 'Rust', category: SkillCategory.GENERAL },
  'c++': { name: 'C++', category: SkillCategory.GENERAL },
  'c#': { name: 'C#', category: SkillCategory.GENERAL },
  php: { name: 'PHP', category: SkillCategory.GENERAL },
  ruby: { name: 'Ruby', category: SkillCategory.GENERAL },
  kotlin: { name: 'Kotlin', category: SkillCategory.GENERAL },
  swift: { name: 'Swift', category: SkillCategory.GENERAL },
  dart: { name: 'Dart', category: SkillCategory.GENERAL },
  html: { name: 'HTML', category: SkillCategory.FRONTEND },
  css: { name: 'CSS', category: SkillCategory.FRONTEND },

  // Frontend
  react: { name: 'React', category: SkillCategory.FRONTEND },
  nextjs: { name: 'Next.js', category: SkillCategory.FRONTEND },
  'next-js': { name: 'Next.js', category: SkillCategory.FRONTEND },
  vue: { name: 'Vue', category: SkillCategory.FRONTEND },
  angular: { name: 'Angular', category: SkillCategory.FRONTEND },
  svelte: { name: 'Svelte', category: SkillCategory.FRONTEND },
  tailwindcss: { name: 'Tailwind CSS', category: SkillCategory.FRONTEND },
  tailwind: { name: 'Tailwind CSS', category: SkillCategory.FRONTEND },
  vite: { name: 'Vite', category: SkillCategory.FRONTEND },
  'react-native': { name: 'React Native', category: SkillCategory.FRONTEND },
  flutter: { name: 'Flutter', category: SkillCategory.FRONTEND },

  // Backend
  nodejs: { name: 'Node.js', category: SkillCategory.BACKEND },
  node: { name: 'Node.js', category: SkillCategory.BACKEND },
  express: { name: 'Express', category: SkillCategory.BACKEND },
  nestjs: { name: 'NestJS', category: SkillCategory.BACKEND },
  django: { name: 'Django', category: SkillCategory.BACKEND },
  flask: { name: 'Flask', category: SkillCategory.BACKEND },
  fastapi: { name: 'FastAPI', category: SkillCategory.BACKEND },
  spring: { name: 'Spring', category: SkillCategory.BACKEND },
  'spring-boot': { name: 'Spring', category: SkillCategory.BACKEND },
  graphql: { name: 'GraphQL', category: SkillCategory.BACKEND },
  'rest-api': { name: 'REST APIs', category: SkillCategory.BACKEND },

  // Database
  postgresql: { name: 'PostgreSQL', category: SkillCategory.DATABASE },
  postgres: { name: 'PostgreSQL', category: SkillCategory.DATABASE },
  mysql: { name: 'MySQL', category: SkillCategory.DATABASE },
  mongodb: { name: 'MongoDB', category: SkillCategory.DATABASE },
  redis: { name: 'Redis', category: SkillCategory.DATABASE },
  sqlite: { name: 'SQLite', category: SkillCategory.DATABASE },
  prisma: { name: 'Prisma', category: SkillCategory.DATABASE },
  sql: { name: 'SQL', category: SkillCategory.DATABASE },

  // DevOps
  docker: { name: 'Docker', category: SkillCategory.DEVOPS },
  kubernetes: { name: 'Kubernetes', category: SkillCategory.DEVOPS },
  aws: { name: 'AWS', category: SkillCategory.DEVOPS },
  gcp: { name: 'Google Cloud', category: SkillCategory.DEVOPS },
  azure: { name: 'Azure', category: SkillCategory.DEVOPS },
  terraform: { name: 'Terraform', category: SkillCategory.DEVOPS },
  nginx: { name: 'Nginx', category: SkillCategory.DEVOPS },

  // Testing
  jest: { name: 'Jest', category: SkillCategory.TESTING },
  vitest: { name: 'Vitest', category: SkillCategory.TESTING },
  playwright: { name: 'Playwright', category: SkillCategory.TESTING },
  cypress: { name: 'Cypress', category: SkillCategory.TESTING },
  pytest: { name: 'pytest', category: SkillCategory.TESTING },

  // ML
  tensorflow: { name: 'TensorFlow', category: SkillCategory.ML },
  pytorch: { name: 'PyTorch', category: SkillCategory.ML },
  'machine-learning': { name: 'Machine Learning', category: SkillCategory.ML },
  'deep-learning': { name: 'Deep Learning', category: SkillCategory.ML },
  pandas: { name: 'pandas', category: SkillCategory.ML },

  // Security
  oauth: { name: 'OAuth', category: SkillCategory.SECURITY },
  jwt: { name: 'JWT Authentication', category: SkillCategory.SECURITY }
};

/**
 * Skills a certification's title vouches for.
 *
 * Certification names are marketing copy ("AWS Certified Solutions Architect –
 * Associate"), so the technology is matched as a whole word inside the title
 * rather than by exact equality. Word boundaries matter: without them "Java"
 * would match "JavaScript" and a Java certificate would credit the wrong skill.
 *
 * A title that matches nothing recognised still stores fine — it simply does not
 * promote any skill, which is the honest outcome for a certification whose
 * subject we cannot identify.
 */
export function skillsCertifiedBy(certificationName: string): { name: string; category: SkillCategory }[] {
  const haystack = certificationName.toLowerCase();
  const matched = new Map<string, SkillCategory>();

  for (const [token, seed] of Object.entries(TOKEN_SKILLS)) {
    // Escape regex metacharacters — tokens include "c++" and "c#".
    const escaped = token.replace(/[.*+?^${}()|[\]\\]/g, (match) => `\\${match}`);
    // \b does not work after "+" or "#", so fall back to a lookahead on a
    // non-word character or end of string for those.
    const pattern = /[a-z0-9]$/.test(token)
      ? new RegExp(`\\b${escaped}\\b`)
      : new RegExp(`${escaped}(?![a-z0-9])`);

    if (pattern.test(haystack)) {
      matched.set(seed.name, seed.category);
    }
  }

  return [...matched].map(([name, category]) => ({ name, category }));
}

/** Normalizes a GitHub language or topic into a TOKEN_SKILLS key. */
export function normalizeToken(raw: string): string {
  return raw.trim().toLowerCase().replace(/\s+/g, '-').replace(/\.js$/, 'js');
}

/** The measured analysis signals that stand on their own as capability evidence. */
interface AnalysisSignals {
  hasTests?: boolean;
  hasDocker?: boolean;
  hasCiCd?: boolean;
  hasReadme?: boolean;
  secretWarnings?: number;
}

interface PendingEvidence {
  evidenceType: string;
  title: string;
  snippet: string;
  sourceUrl: string | null;
}

interface PendingSkill {
  name: string;
  category: SkillCategory;
  confidenceCeiling: number;
  evidences: PendingEvidence[];
}

/**
 * Confidence for a derived skill, on 0..100.
 *
 * The 0..100 scale is the one the rest of the app already speaks:
 * developer360.service averages these straight into `categoryBreakdown.score`,
 * which the dashboard renders as "n / 100". A 0..1 fraction would round to 0
 * there and read as a measured score of nothing.
 *
 * Grows with the number of independent repositories evidencing the skill and
 * saturates below 100: one repository is real evidence but weak evidence, and
 * no number of repositories makes this a certainty rather than an inference.
 *
 * `ceiling` lowers that saturation point for skills whose evidence is weaker
 * per repository — see {@link SkillSeed.confidenceCeiling}. Repetition of a weak
 * signal is still weak, so the ceiling binds no matter how many repos agree.
 */
function confidenceFor(evidenceCount: number, ceiling: number = DEFAULT_CONFIDENCE_CEILING): number {
  return Math.min(45 + 18 * (evidenceCount - 1), ceiling);
}

export class SkillService {
  /** Every skill for a user, strongest evidence first. */
  static async listSkills(userId: string) {
    return prisma.skill.findMany({
      where: { userId },
      include: { evidences: { orderBy: { createdAt: 'asc' } } },
      orderBy: [{ confidence: 'desc' }, { name: 'asc' }]
    });
  }

  /**
   * Rebuild the user's evidenced skills from their analyzed repositories.
   *
   * Idempotent: running it twice produces the same rows. Manually claimed
   * skills are preserved, and are promoted to PRACTICALLY_EVIDENCED if the
   * repositories turn out to back them up.
   */
  static async deriveSkills(userId: string) {
    const repositories = await prisma.repository.findMany({
      where: { userId },
      include: {
        analyses: {
          where: { status: 'COMPLETED' },
          orderBy: { createdAt: 'desc' },
          take: 1,
          include: { metrics: true }
        }
      }
    });

    const pending = new Map<string, PendingSkill>();

    const record = (seed: SkillSeed, evidence: PendingEvidence) => {
      const existing = pending.get(seed.name);
      if (existing) {
        // One repository counts once per skill, whatever route it arrived by.
        // Matching on title alone (not title + evidenceType) is deliberate: a
        // repo whose language is "TypeScript" *and* which is tagged "typescript"
        // is a single piece of evidence, and counting it twice would inflate
        // confidence, which is computed from the number of evidence rows.
        // Language is recorded before topics, so the more authoritative source wins.
        const alreadyCounted = existing.evidences.some((e) => e.title === evidence.title);
        if (!alreadyCounted) existing.evidences.push(evidence);
        return;
      }
      pending.set(seed.name, {
        name: seed.name,
        category: seed.category,
        confidenceCeiling: seed.confidenceCeiling ?? DEFAULT_CONFIDENCE_CEILING,
        evidences: [evidence]
      });
    };

    for (const repo of repositories) {
      // ── Language: GitHub's own classification of the repository ──
      if (repo.language) {
        const seed = TOKEN_SKILLS[normalizeToken(repo.language)];
        if (seed) {
          record(seed, {
            evidenceType: EVIDENCE_REPO_LANGUAGE,
            title: repo.fullName,
            snippet: `GitHub reports ${repo.language} as the primary language of this repository.`,
            sourceUrl: repo.url
          });
        }
      }

      // ── Topics: declared by the repository owner on GitHub ──
      const topics = Array.isArray(repo.topics) ? (repo.topics as unknown[]) : [];
      for (const topic of topics) {
        if (typeof topic !== 'string') continue;
        const seed = TOKEN_SKILLS[normalizeToken(topic)];
        if (!seed) continue;
        record(seed, {
          evidenceType: EVIDENCE_REPO_TOPIC,
          title: repo.fullName,
          snippet: `Tagged "${topic}" on GitHub.`,
          sourceUrl: repo.url
        });
      }

      // ── Measured analysis signals ──
      const analysis = repo.analyses[0];
      if (!analysis) continue;

      const signals = (analysis.rawResults ?? {}) as AnalysisSignals;

      if (signals.hasTests) {
        record(
          { name: 'Automated Testing', category: SkillCategory.TESTING },
          {
            evidenceType: EVIDENCE_ANALYSIS,
            title: repo.fullName,
            snippet: 'Analysis found test files in this repository.',
            sourceUrl: repo.url
          }
        );
      }

      if (signals.hasDocker) {
        record(
          { name: 'Docker', category: SkillCategory.DEVOPS },
          {
            evidenceType: EVIDENCE_ANALYSIS,
            title: repo.fullName,
            snippet: 'Analysis found Docker configuration in this repository.',
            sourceUrl: repo.url
          }
        );
      }

      if (signals.hasCiCd) {
        record(
          { name: 'CI/CD', category: SkillCategory.DEVOPS },
          {
            evidenceType: EVIDENCE_ANALYSIS,
            title: repo.fullName,
            snippet: 'Analysis found a CI/CD pipeline configuration in this repository.',
            sourceUrl: repo.url
          }
        );
      }

      if (signals.hasReadme) {
        record(
          { name: 'Technical Documentation', category: SkillCategory.GENERAL },
          {
            evidenceType: EVIDENCE_ANALYSIS,
            title: repo.fullName,
            snippet: 'Analysis found README documentation in this repository.',
            sourceUrl: repo.url
          }
        );
      }

      // Secure coding is only claimed on a repository that was actually scanned
      // *and* came back clean — "no finding" is evidence here precisely because
      // the scan ran. A repository with zero analyzed files never reaches this.
      //
      // Unlike every other skill here, this one is inferred from an absence, and
      // from a sample rather than the whole repository. Both the wording below
      // and the lowered ceiling exist so it never reads as a stronger claim than
      // the scan can support.
      const securityMetric = analysis.metrics.find((m) => m.category === 'SECURITY');
      if (securityMetric && securityMetric.score >= 90 && (signals.secretWarnings ?? 0) === 0) {
        record(
          {
            name: 'Secure Coding Practices',
            category: SkillCategory.SECURITY,
            confidenceCeiling: ABSENCE_CONFIDENCE_CEILING
          },
          {
            evidenceType: EVIDENCE_ANALYSIS,
            title: repo.fullName,
            snippet: `Security analysis scored ${Math.round(securityMetric.score)}/100, with no hardcoded secrets in the sampled files.`,
            sourceUrl: repo.url
          }
        );
      }
    }

    // ── Persist ────────────────────────────────────────────────
    const derivedNames = [...pending.keys()];

    // Read certifications directly rather than through CertificationService:
    // that service already depends on this one for the token vocabulary, and
    // importing it back would close an import cycle.
    const certifications = await prisma.certification.findMany({
      where: { userId },
      select: { name: true }
    });
    const certifiedNames = [
      ...new Set(certifications.flatMap((c) => skillsCertifiedBy(c.name).map((s) => s.name)))
    ];

    return prisma.$transaction(async (tx) => {
      // Drop skills that were previously derived but have no evidence any more
      // (the repository was removed, or re-analysis no longer supports them).
      // Manually claimed skills are never removed by a derivation run.
      // A skill can also be held up by a certification. Deleting it here because
      // the repositories no longer evidence it would silently discard that
      // third-party evidence, so certified names are spared and demoted instead.
      const protectedNames = [...new Set([...derivedNames, ...certifiedNames])];

      await tx.skill.deleteMany({
        where: {
          userId,
          currentLevel: EvidenceLevel.PRACTICALLY_EVIDENCED,
          name: { notIn: protectedNames.length > 0 ? protectedNames : ['__none__'] }
        }
      });

      // Certified, but no longer evidenced by code: fall back down the ladder
      // rather than keeping a PRACTICALLY_EVIDENCED claim nothing supports.
      const demotable = certifiedNames.filter((name) => !derivedNames.includes(name));
      if (demotable.length > 0) {
        await tx.skill.updateMany({
          where: {
            userId,
            name: { in: demotable },
            currentLevel: EvidenceLevel.PRACTICALLY_EVIDENCED
          },
          data: { currentLevel: EvidenceLevel.CREDENTIAL_VERIFIED }
        });
      }

      let created = 0;
      let updated = 0;

      for (const skill of pending.values()) {
        const confidence = confidenceFor(skill.evidences.length, skill.confidenceCeiling);

        const existing = await tx.skill.findUnique({
          where: { userId_name: { userId, name: skill.name } },
          select: { id: true }
        });

        const saved = await tx.skill.upsert({
          where: { userId_name: { userId, name: skill.name } },
          create: {
            userId,
            name: skill.name,
            category: skill.category,
            confidence,
            currentLevel: EvidenceLevel.PRACTICALLY_EVIDENCED
          },
          update: {
            category: skill.category,
            confidence,
            // A skill the user merely claimed is promoted once the repositories
            // back it up — the evidence ladder only moves in this direction here.
            currentLevel: EvidenceLevel.PRACTICALLY_EVIDENCED
          }
        });

        if (existing) updated += 1;
        else created += 1;

        // Evidence rows are rebuilt wholesale rather than diffed: they are
        // derived data, and a stale row would misrepresent which repository
        // supports the skill.
        await tx.skillEvidence.deleteMany({ where: { skillId: saved.id } });
        await tx.skillEvidence.createMany({
          data: skill.evidences.map((evidence) => ({
            skillId: saved.id,
            evidenceType: evidence.evidenceType,
            title: evidence.title,
            snippet: evidence.snippet,
            sourceUrl: evidence.sourceUrl,
            level: EvidenceLevel.PRACTICALLY_EVIDENCED
          }))
        });
      }

      return {
        created,
        updated,
        total: pending.size,
        repositoriesConsidered: repositories.length,
        repositoriesAnalyzed: repositories.filter((r) => r.analyses.length > 0).length
      };
    });
  }

  /**
   * Record a skill the user claims but nothing measured supports yet.
   *
   * Stored at CLAIMED, which is the bottom of the evidence ladder, so the UI can
   * always distinguish it from something the repositories actually demonstrate.
   */
  static async addClaimedSkill(userId: string, name: string, category: SkillCategory) {
    const trimmed = name.trim();

    const existing = await prisma.skill.findUnique({
      where: { userId_name: { userId, name: trimmed } }
    });

    if (existing) {
      throw AppError.conflict(`"${trimmed}" is already on your profile.`);
    }

    return prisma.skill.create({
      data: {
        userId,
        name: trimmed,
        category,
        confidence: 0,
        currentLevel: EvidenceLevel.CLAIMED
      },
      include: { evidences: true }
    });
  }

  /** Remove a skill the caller owns. Evidence rows cascade. */
  static async deleteSkill(userId: string, skillId: string) {
    try {
      await prisma.skill.delete({ where: { id: skillId, userId } });
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2025') {
        throw AppError.notFound('Skill not found or access denied');
      }
      throw error;
    }
  }
}
