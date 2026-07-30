import { prisma } from '../config/database';
import { EvidenceLevel, SkillCategory } from '@prisma/client';

export class Developer360Service {
  /**
   * Aggregate developer 360 degree intelligence metrics
   */
  static async getDeveloperOverview(userId: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        githubAccount: true,
        repositories: {
          include: {
            analyses: {
              orderBy: { createdAt: 'desc' },
              take: 1,
              include: { metrics: true, findings: true }
            }
          }
        },
        skills: {
          include: { evidences: true }
        },
        courses: true,
        certifications: true,
        codingProfiles: true,
        targetRoles: {
          include: { recommendations: true }
        }
      }
    });

    if (!user) {
      throw new Error('User not found');
    }

    const repos = user.repositories || [];
    const completedAnalyses = repos.flatMap((r) => r.analyses).filter((a) => a && a.status === 'COMPLETED');

    // Aggregate average score across analyzed repositories
    const averageRepoScore =
      completedAnalyses.length > 0
        ? Math.round(
            (completedAnalyses.reduce((acc, a) => acc + a.overallScore, 0) / completedAnalyses.length) * 10
          ) / 10
        : 72.5;

    // Calculate skill counts by evidence tier
    const skills = user.skills || [];
    const tierCounts = {
      CLAIMED: skills.filter((s) => s.currentLevel === EvidenceLevel.CLAIMED).length,
      LEARNED: skills.filter((s) => s.currentLevel === EvidenceLevel.LEARNED).length,
      CREDENTIAL_VERIFIED: skills.filter((s) => s.currentLevel === EvidenceLevel.CREDENTIAL_VERIFIED).length,
      PRACTICALLY_EVIDENCED: skills.filter((s) => s.currentLevel === EvidenceLevel.PRACTICALLY_EVIDENCED).length
    };

    // Calculate evidence radar across technical categories
    const categories: SkillCategory[] = [
      SkillCategory.FRONTEND,
      SkillCategory.BACKEND,
      SkillCategory.DATABASE,
      SkillCategory.TESTING,
      SkillCategory.DEVOPS,
      SkillCategory.SECURITY
    ];

    const categoryBreakdown = categories.map((cat) => {
      const catSkills = skills.filter((s) => s.category === cat);
      const score =
        catSkills.length > 0
          ? Math.round(catSkills.reduce((acc, s) => acc + s.confidence, 0) / catSkills.length)
          : 70;
      return {
        category: cat,
        score,
        skillCount: catSkills.length
      };
    });

    return {
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        avatarUrl: user.avatarUrl,
        githubUsername: user.githubAccount?.username || null
      },
      developer360Score: averageRepoScore,
      totalRepositories: repos.length,
      totalAnalyzed: completedAnalyses.length,
      evidenceTiers: tierCounts,
      categoryBreakdown,
      skillsList: skills,
      recentCertifications: user.certifications,
      codingProfiles: user.codingProfiles,
      targetRoles: user.targetRoles
    };
  }
}
