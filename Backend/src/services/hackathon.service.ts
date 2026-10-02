import { EvidenceLevel, Hackathon, Prisma } from '@prisma/client';
import { prisma } from '../config/database';
import { AppError } from '../utils/appError';
import { skillsNamedIn } from './skill.service';

// ==========================================
// HACKATHON SERVICE
// ==========================================
// CRUD over a user's hackathon and competition history.
//
// Unlike courses and certifications, a hackathon record moves nothing up the
// evidence ladder. There is no issuer to check and no scan to run: the name,
// the placement and the project link are all the user's own account of what
// happened. Technologies listed here create skills at CLAIMED — the rung that
// means exactly "the user says so" — and an existing skill is never touched.
//
// A project URL is a pointer for a human to follow, not proof the code is
// theirs. Treating it as evidence would be the resume problem again.

export interface HackathonInput {
  name: string;
  organizer: string;
  role?: string | null;
  projectName?: string | null;
  projectUrl?: string | null;
  result?: string | null;
  teamSize?: number | null;
  heldAt?: Date | null;
  technologies?: string[];
}

/** Technologies the user listed, plus any named in the project title. */
function technologiesIn(input: Pick<HackathonInput, 'projectName' | 'technologies'>): string[] {
  const named = new Set<string>();

  for (const tech of input.technologies ?? []) {
    const trimmed = tech.trim();
    if (trimmed) named.add(trimmed);
  }
  // The hackathon's own name is deliberately not matched: "HackMIT" or
  // "Smart India Hackathon" says nothing about what was built.
  for (const match of skillsNamedIn(input.projectName ?? '')) {
    named.add(match.name);
  }

  return [...named];
}

function toData(input: HackathonInput) {
  return {
    name: input.name,
    organizer: input.organizer,
    role: input.role ?? null,
    projectName: input.projectName ?? null,
    projectUrl: input.projectUrl ?? null,
    result: input.result ?? null,
    teamSize: input.teamSize ?? null,
    heldAt: input.heldAt ?? null,
    technologies: (input.technologies ?? []) as unknown as Prisma.InputJsonValue
  };
}

export class HackathonService {
  static async list(userId: string): Promise<Hackathon[]> {
    return prisma.hackathon.findMany({
      where: { userId },
      orderBy: [{ heldAt: 'desc' }, { createdAt: 'desc' }]
    });
  }

  static async create(userId: string, input: HackathonInput) {
    const hackathon = await prisma.hackathon.create({
      data: { userId, ...toData(input) }
    });

    const recorded = await HackathonService.recordClaimedSkills(userId, input);
    return { hackathon, recordedSkills: recorded };
  }

  static async update(userId: string, id: string, input: HackathonInput) {
    const existing = await prisma.hackathon.findFirst({ where: { id, userId } });
    if (!existing) {
      throw AppError.notFound('Hackathon not found or access denied');
    }

    const hackathon = await prisma.hackathon.update({
      where: { id },
      data: toData(input)
    });

    // No demotion pass on update: skills recorded here sit at CLAIMED, which is
    // the floor. There is nothing below it to fall to, and silently deleting a
    // skill the user may since have evidenced elsewhere would be worse.
    const recorded = await HackathonService.recordClaimedSkills(userId, input);
    return { hackathon, recordedSkills: recorded };
  }

  static async remove(userId: string, id: string): Promise<void> {
    const existing = await prisma.hackathon.findFirst({ where: { id, userId } });
    if (!existing) {
      throw AppError.notFound('Hackathon not found or access denied');
    }

    try {
      await prisma.hackathon.delete({ where: { id } });
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2025') {
        throw AppError.notFound('Hackathon not found or access denied');
      }
      throw error;
    }
  }

  /**
   * Create any listed technology as a CLAIMED skill.
   *
   * Returns only the ones actually created. An existing skill is left exactly
   * as it is, whatever rung it sits on: a hackathon can neither raise a skill
   * nor lower one, because it evidences nothing either way.
   */
  private static async recordClaimedSkills(
    userId: string,
    input: HackathonInput
  ): Promise<string[]> {
    const created: string[] = [];

    for (const name of technologiesIn(input)) {
      const existing = await prisma.skill.findUnique({ where: { userId_name: { userId, name } } });
      if (existing) continue;

      await prisma.skill.create({
        data: { userId, name, confidence: 0, currentLevel: EvidenceLevel.CLAIMED }
      });
      created.push(name);
    }

    return created;
  }
}
