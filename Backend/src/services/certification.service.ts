import { EvidenceLevel, Prisma } from '@prisma/client';
import { prisma } from '../config/database';
import { AppError } from '../utils/appError';
import { skillsNamedIn } from './skill.service';

// ==========================================
// CERTIFICATION SERVICE
// ==========================================
// CRUD over a user's certifications, plus the one piece of intelligence that
// makes them more than a list: a certification is third-party evidence, so it
// moves the matching skill onto the CREDENTIAL_VERIFIED rung of the evidence
// ladder. Without that, LEARNED and CREDENTIAL_VERIFIED are unreachable and the
// ladder is a four-tier scale that only ever reports two values.

export interface CertificationInput {
  name: string;
  issuer: string;
  credentialId?: string | null;
  credentialUrl?: string | null;
  issueDate?: Date | null;
}


export class CertificationService {
  static async list(userId: string) {
    return prisma.certification.findMany({
      where: { userId },
      orderBy: [{ issueDate: 'desc' }, { createdAt: 'desc' }]
    });
  }

  static async create(userId: string, input: CertificationInput) {
    const certification = await prisma.certification.create({
      data: {
        userId,
        name: input.name,
        issuer: input.issuer,
        credentialId: input.credentialId ?? null,
        credentialUrl: input.credentialUrl ?? null,
        issueDate: input.issueDate ?? null
      }
    });

    const promoted = await CertificationService.promoteSkillsFor(userId, input.name);

    return { certification, promotedSkills: promoted };
  }

  static async update(userId: string, id: string, input: CertificationInput) {
    const existing = await prisma.certification.findFirst({ where: { id, userId } });
    if (!existing) {
      throw AppError.notFound('Certification not found or access denied');
    }

    const certification = await prisma.certification.update({
      where: { id },
      data: {
        name: input.name,
        issuer: input.issuer,
        credentialId: input.credentialId ?? null,
        credentialUrl: input.credentialUrl ?? null,
        issueDate: input.issueDate ?? null
      }
    });

    // The title may now vouch for a different technology, so both directions are
    // reconciled: what the old title backed may no longer hold.
    await CertificationService.demoteSkillsFor(userId, existing.name);
    const promoted = await CertificationService.promoteSkillsFor(userId, certification.name);

    return { certification, promotedSkills: promoted };
  }

  static async remove(userId: string, id: string) {
    const existing = await prisma.certification.findFirst({ where: { id, userId } });
    if (!existing) {
      throw AppError.notFound('Certification not found or access denied');
    }

    try {
      await prisma.certification.delete({ where: { id } });
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2025') {
        throw AppError.notFound('Certification not found or access denied');
      }
      throw error;
    }

    await CertificationService.demoteSkillsFor(userId, existing.name);
  }

  /** Every skill name currently vouched for by one of the user's certifications. */
  static async certifiedSkillNames(userId: string): Promise<string[]> {
    const certifications = await prisma.certification.findMany({
      where: { userId },
      select: { name: true }
    });

    const names = new Set<string>();
    for (const certification of certifications) {
      for (const skill of skillsNamedIn(certification.name)) {
        names.add(skill.name);
      }
    }
    return [...names];
  }

  /**
   * Move skills this certification vouches for up to CREDENTIAL_VERIFIED.
   *
   * Never downgrades. A skill already at PRACTICALLY_EVIDENCED stays there:
   * working code in a repository is stronger evidence than a certificate, and
   * the ladder must not move backwards because a credential was added.
   */
  private static async promoteSkillsFor(userId: string, certificationName: string): Promise<string[]> {
    const candidates = skillsNamedIn(certificationName);
    const promoted: string[] = [];

    for (const candidate of candidates) {
      const existing = await prisma.skill.findUnique({
        where: { userId_name: { userId, name: candidate.name } }
      });

      if (!existing) {
        await prisma.skill.create({
          data: {
            userId,
            name: candidate.name,
            category: candidate.category,
            confidence: 0,
            currentLevel: EvidenceLevel.CREDENTIAL_VERIFIED
          }
        });
        promoted.push(candidate.name);
        continue;
      }

      if (
        existing.currentLevel === EvidenceLevel.CLAIMED ||
        existing.currentLevel === EvidenceLevel.LEARNED
      ) {
        await prisma.skill.update({
          where: { id: existing.id },
          data: { currentLevel: EvidenceLevel.CREDENTIAL_VERIFIED }
        });
        promoted.push(candidate.name);
      }
    }

    return promoted;
  }

  /**
   * Drop skills back to CLAIMED when the last certification backing them goes.
   *
   * Only touches skills sitting at CREDENTIAL_VERIFIED — one held up by actual
   * repository evidence is unaffected, because removing a certificate does not
   * remove the code.
   */
  private static async demoteSkillsFor(userId: string, certificationName: string): Promise<void> {
    const affected = skillsNamedIn(certificationName);
    if (affected.length === 0) return;

    const stillCertified = new Set(await CertificationService.certifiedSkillNames(userId));

    for (const candidate of affected) {
      if (stillCertified.has(candidate.name)) continue;

      await prisma.skill.updateMany({
        where: {
          userId,
          name: candidate.name,
          currentLevel: EvidenceLevel.CREDENTIAL_VERIFIED
        },
        data: { currentLevel: EvidenceLevel.CLAIMED }
      });
    }
  }
}
