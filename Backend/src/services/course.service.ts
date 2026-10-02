import { Course, EvidenceLevel, Prisma } from '@prisma/client';
import { prisma } from '../config/database';
import { AppError } from '../utils/appError';
import { skillsNamedIn } from './skill.service';

// ==========================================
// COURSE SERVICE
// ==========================================
// CRUD over a user's courses, plus the promotion that makes LEARNED reachable.
//
// Before this existed the evidence ladder had four rungs and only two were
// attainable: CLAIMED (typed in) and PRACTICALLY_EVIDENCED (derived from code).
// A completed course is the evidence for LEARNED, which sits between them.

export interface CourseInput {
  title: string;
  platform: string;
  isCompleted: boolean;
  certificateUrl?: string | null;
  completedAt?: Date | null;
  /** Skill names the user says this course taught. */
  learnedSkills?: string[];
}

/**
 * Skills a course vouches for: those the user listed, plus any technology named
 * in the title itself.
 *
 * The title is included because "The Complete Docker Course" plainly teaches
 * Docker whether or not the user thought to list it, and the matcher only
 * recognises a fixed vocabulary, so it cannot invent a technology from prose.
 */
function skillsTaughtBy(input: Pick<CourseInput, 'title' | 'learnedSkills'>): string[] {
  const named = new Set<string>();

  for (const skill of input.learnedSkills ?? []) {
    const trimmed = skill.trim();
    if (trimmed) named.add(trimmed);
  }
  for (const match of skillsNamedIn(input.title)) {
    named.add(match.name);
  }

  return [...named];
}

export class CourseService {
  static async list(userId: string): Promise<Course[]> {
    return prisma.course.findMany({
      where: { userId },
      orderBy: [{ completedAt: 'desc' }, { createdAt: 'desc' }]
    });
  }

  static async create(userId: string, input: CourseInput) {
    const course = await prisma.course.create({
      data: {
        userId,
        title: input.title,
        platform: input.platform,
        isCompleted: input.isCompleted,
        // A course cannot be completed at no particular time; default to now so
        // the ordering above is meaningful without demanding a date.
        completedAt: input.isCompleted ? input.completedAt ?? new Date() : null,
        certificateUrl: input.certificateUrl ?? null,
        learnedSkills: (input.learnedSkills ?? []) as unknown as Prisma.InputJsonValue
      }
    });

    const promoted = await CourseService.promoteSkills(userId, course);
    return { course, promotedSkills: promoted };
  }

  static async update(userId: string, id: string, input: CourseInput) {
    const existing = await prisma.course.findFirst({ where: { id, userId } });
    if (!existing) {
      throw AppError.notFound('Course not found or access denied');
    }

    const course = await prisma.course.update({
      where: { id },
      data: {
        title: input.title,
        platform: input.platform,
        isCompleted: input.isCompleted,
        // Reopening a completed course clears its completion date rather than
        // leaving a date on something no longer finished.
        completedAt: input.isCompleted ? input.completedAt ?? existing.completedAt ?? new Date() : null,
        certificateUrl: input.certificateUrl ?? null,
        learnedSkills: (input.learnedSkills ?? []) as unknown as Prisma.InputJsonValue
      }
    });

    // Both directions: the edit may have added a skill, or un-completed the
    // course and removed the only thing supporting one.
    await CourseService.demoteSkills(userId, existing);
    const promoted = await CourseService.promoteSkills(userId, course);

    return { course, promotedSkills: promoted };
  }

  static async remove(userId: string, id: string): Promise<void> {
    const existing = await prisma.course.findFirst({ where: { id, userId } });
    if (!existing) {
      throw AppError.notFound('Course not found or access denied');
    }

    try {
      await prisma.course.delete({ where: { id } });
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2025') {
        throw AppError.notFound('Course not found or access denied');
      }
      throw error;
    }

    await CourseService.demoteSkills(userId, existing);
  }

  /** Skill names currently supported by at least one *completed* course. */
  static async learnedSkillNames(userId: string): Promise<string[]> {
    const completed = await prisma.course.findMany({
      where: { userId, isCompleted: true },
      select: { title: true, learnedSkills: true }
    });

    const names = new Set<string>();
    for (const course of completed) {
      const listed = Array.isArray(course.learnedSkills) ? (course.learnedSkills as unknown[]) : [];
      for (const name of skillsTaughtBy({
        title: course.title,
        learnedSkills: listed.filter((s): s is string => typeof s === 'string')
      })) {
        names.add(name);
      }
    }
    return [...names];
  }

  /**
   * Move skills this course taught up to LEARNED.
   *
   * Only completed courses promote: being enrolled is not evidence of having
   * learned anything. Never downgrades — a skill already at CREDENTIAL_VERIFIED
   * or PRACTICALLY_EVIDENCED has stronger support than a course and keeps it.
   */
  private static async promoteSkills(userId: string, course: Course): Promise<string[]> {
    if (!course.isCompleted) return [];

    const listed = Array.isArray(course.learnedSkills) ? (course.learnedSkills as unknown[]) : [];
    const taught = skillsTaughtBy({
      title: course.title,
      learnedSkills: listed.filter((s): s is string => typeof s === 'string')
    });

    const promoted: string[] = [];

    for (const name of taught) {
      const existing = await prisma.skill.findUnique({ where: { userId_name: { userId, name } } });

      if (!existing) {
        await prisma.skill.create({
          data: { userId, name, confidence: 0, currentLevel: EvidenceLevel.LEARNED }
        });
        promoted.push(name);
        continue;
      }

      if (existing.currentLevel === EvidenceLevel.CLAIMED) {
        await prisma.skill.update({
          where: { id: existing.id },
          data: { currentLevel: EvidenceLevel.LEARNED }
        });
        promoted.push(name);
      }
    }

    return promoted;
  }

  /**
   * Drop skills back to CLAIMED when the last completed course backing them goes.
   *
   * Only touches skills sitting at LEARNED: one held up by a certification or by
   * repository evidence is unaffected, because deleting a course does not remove
   * those.
   */
  private static async demoteSkills(userId: string, course: Course): Promise<void> {
    const listed = Array.isArray(course.learnedSkills) ? (course.learnedSkills as unknown[]) : [];
    const affected = skillsTaughtBy({
      title: course.title,
      learnedSkills: listed.filter((s): s is string => typeof s === 'string')
    });
    if (affected.length === 0) return;

    const stillLearned = new Set(await CourseService.learnedSkillNames(userId));

    for (const name of affected) {
      if (stillLearned.has(name)) continue;

      await prisma.skill.updateMany({
        where: { userId, name, currentLevel: EvidenceLevel.LEARNED },
        data: { currentLevel: EvidenceLevel.CLAIMED }
      });
    }
  }
}
