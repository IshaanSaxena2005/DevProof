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

    // Average score across analyzed repositories, or null when there is
    // nothing to average. This used to fall back to a hardcoded 72.5, which
    // reached the UI indistinguishable from a real measurement — directly
    // against this product's evidence-based premise. Absence of evidence must
    // read as absence, not as an invented number.
    const averageRepoScore =
      completedAnalyses.length > 0
        ? Math.round(
            (completedAnalyses.reduce((acc, a) => acc + a.overallScore, 0) / completedAnalyses.length) * 10
          ) / 10
        : null;

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
      // null (not 70) when the user has no recorded skills in this category —
      // see averageRepoScore above for why a placeholder number is unsafe here.
      const score =
        catSkills.length > 0
          ? Math.round(catSkills.reduce((acc, s) => acc + s.confidence, 0) / catSkills.length)
          : null;
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
      targetRoles: user.targetRoles,
      // GitHub-sourced engineering evidence, derived entirely from data already
      // synced into our DB (see GitHubSyncService). No extra GitHub API calls,
      // no fabricated values — absent data reads as null/empty, never a guess.
      github: Developer360Service.buildGitHubEvidence(user.githubAccount, repos)
    };
  }

  /**
   * Assemble the GitHub evidence block from stored account + repository rows.
   *
   * Everything here is directly observed GitHub metadata (source = "GitHub"),
   * not inferred skill. Language distribution is a *repository count per primary
   * language* over the user's authored repos — we deliberately do NOT call the
   * per-repo `/languages` endpoint (that would be one extra request per repo),
   * so this is not a byte-level breakdown and is not presented as one.
   */
  private static buildGitHubEvidence(
    account: {
      username: string;
      profileUrl: string | null;
      avatarUrl: string | null;
      totalRepos: number;
      totalStars: number;
      totalFollowers: number;
      totalFollowing: number;
      lastSyncedAt: Date | null;
    } | null,
    repos: Array<{
      name: string;
      fullName: string;
      owner: string;
      url: string;
      language: string | null;
      isFork: boolean;
      isArchived: boolean;
      starsCount: number;
      forksCount: number;
      pushedAt: Date | null;
    }>
  ) {
    // Not linked → an explicit "not connected" shape the UI turns into the
    // "Connect GitHub to unlock repository intelligence" empty state.
    if (!account) {
      return {
        source: 'GitHub' as const,
        connected: false,
        lastSyncedAt: null,
        username: null,
        profileUrl: null,
        avatarUrl: null,
        publicRepos: null,
        followers: null,
        following: null,
        totalStars: 0,
        totalForks: 0,
        repositoriesTracked: 0,
        languageDistribution: [] as Array<{ language: string; count: number; percentage: number }>,
        primaryTechnologies: [] as string[],
        recentActivity: [] as Array<{
          name: string;
          fullName: string;
          url: string;
          language: string | null;
          isFork: boolean;
          isArchived: boolean;
          starsCount: number;
          forksCount: number;
          pushedAt: Date | null;
        }>
      };
    }

    const username = account.username ? account.username.toLowerCase() : null;

    // The user's own original work: repositories they own that are not forks of
    // someone else's project. Forks are excluded because a fork's primary
    // language reflects the upstream project, not what this developer chose to
    // build — counting them would overstate the evidence.
    const authoredRepos = repos.filter((r) => {
      if (r.isFork) return false;
      if (username && r.owner) return r.owner.toLowerCase() === username;
      return true;
    });

    const languageCounts = new Map<string, number>();
    for (const r of authoredRepos) {
      if (!r.language) continue;
      languageCounts.set(r.language, (languageCounts.get(r.language) ?? 0) + 1);
    }
    const languageTotal = Array.from(languageCounts.values()).reduce((a, b) => a + b, 0);
    const languageDistribution = Array.from(languageCounts.entries())
      .map(([language, count]) => ({
        language,
        count,
        // Share of authored repositories (one decimal), not share of bytes.
        percentage: languageTotal > 0 ? Math.round((count / languageTotal) * 1000) / 10 : 0
      }))
      .sort((a, b) => b.count - a.count || a.language.localeCompare(b.language));

    const primaryTechnologies = languageDistribution.slice(0, 5).map((l) => l.language);

    // Forks-of-this-repo count is a legitimate impact signal for owned work.
    const totalForks = authoredRepos.reduce((sum, r) => sum + (r.forksCount || 0), 0);

    // Most recently pushed repositories — real activity, across all tracked
    // repos (a push to a fork is still the user's activity), newest first.
    const recentActivity = repos
      .filter((r) => r.pushedAt)
      .sort((a, b) => b.pushedAt!.getTime() - a.pushedAt!.getTime())
      .slice(0, 5)
      .map((r) => ({
        name: r.name,
        fullName: r.fullName,
        url: r.url,
        language: r.language,
        isFork: r.isFork,
        isArchived: r.isArchived,
        starsCount: r.starsCount,
        forksCount: r.forksCount,
        pushedAt: r.pushedAt
      }));

    return {
      source: 'GitHub' as const,
      connected: true,
      lastSyncedAt: account.lastSyncedAt,
      username: account.username,
      profileUrl: account.profileUrl,
      avatarUrl: account.avatarUrl,
      // Profile stats as captured at last sync (from GitHubSyncService).
      publicRepos: account.totalRepos,
      followers: account.totalFollowers,
      following: account.totalFollowing,
      totalStars: account.totalStars,
      totalForks,
      repositoriesTracked: repos.length,
      languageDistribution,
      primaryTechnologies,
      recentActivity
    };
  }
}
