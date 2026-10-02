import { prisma } from '../config/database';

// ==========================================
// GROWTH HISTORY SERVICE
// ==========================================
// Reconstructs a developer's measured history from records that already carry
// timestamps: every completed analysis writes an AnalysisHistory row, and
// repositories and skills record when they were added.
//
// The rule throughout: a point exists only where something was actually
// measured. Months with no activity are omitted rather than emitted as zero —
// a zero would draw a line implying a measurement of "nothing", when the truth
// is that nothing was measured. The client decides how to render the gap.

export interface GrowthPoint {
  /** ISO date of the analysis. */
  date: string;
  score: number;
  repository: string;
}

export interface GrowthMonth {
  /** YYYY-MM. */
  month: string;
  analyses: number;
  averageScore: number;
  bestScore: number;
}

export interface GrowthMilestone {
  date: string;
  label: string;
  detail: string;
}

/**
 * How one repository's score moved across repeated analyses.
 *
 * Only repositories analyzed more than once appear. This is the only honest
 * measure of improvement available: comparing the first analysis of one
 * repository against the latest of another measures the difference between two
 * codebases, not progress by the developer.
 */
export interface RepositoryTrend {
  repository: string;
  analyses: number;
  firstScore: number;
  latestScore: number;
  change: number;
  firstAt: string;
  latestAt: string;
}

export interface GrowthHistory {
  points: GrowthPoint[];
  months: GrowthMonth[];
  milestones: GrowthMilestone[];
  trends: RepositoryTrend[];
  totals: {
    analyses: number;
    repositories: number;
    skills: number;
    firstMeasuredAt: string | null;
    lastMeasuredAt: string | null;
    bestScore: number | null;
    averageScore: number | null;
    /**
     * Whether any repository has been analyzed more than once.
     *
     * False means no improvement can be stated yet, however many analyses
     * exist — a trend needs the same repository measured twice, and the client
     * should say that rather than drawing a line through unrelated scores.
     */
    trendAvailable: boolean;
  };
}

/** YYYY-MM in UTC, matching how the dates are stored. */
function monthKey(date: Date): string {
  return `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, '0')}`;
}

function round(value: number): number {
  return Math.round(value * 10) / 10;
}

export class GrowthService {
  /**
   * The user's measured history, oldest first.
   *
   * Everything returned is reconstructed from stored timestamps. Nothing is
   * interpolated, smoothed or back-filled.
   */
  static async getHistory(userId: string): Promise<GrowthHistory> {
    const [history, repositories, skills] = await Promise.all([
      prisma.analysisHistory.findMany({
        where: { userId },
        orderBy: { createdAt: 'asc' },
        include: { repository: { select: { fullName: true, name: true } } }
      }),
      prisma.repository.findMany({
        where: { userId },
        select: { createdAt: true, fullName: true },
        orderBy: { createdAt: 'asc' }
      }),
      prisma.skill.findMany({
        where: { userId },
        select: { createdAt: true, name: true, currentLevel: true },
        orderBy: { createdAt: 'asc' }
      })
    ]);

    const points: GrowthPoint[] = history.map((entry) => ({
      date: entry.createdAt.toISOString(),
      score: round(entry.score),
      repository: entry.repository?.fullName ?? entry.repository?.name ?? 'Unknown repository'
    }));

    // ── Monthly buckets, only for months that contain a measurement ──
    const buckets = new Map<string, number[]>();
    for (const entry of history) {
      const key = monthKey(entry.createdAt);
      const scores = buckets.get(key);
      if (scores) scores.push(entry.score);
      else buckets.set(key, [entry.score]);
    }

    const months: GrowthMonth[] = [...buckets.entries()]
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([month, scores]) => ({
        month,
        analyses: scores.length,
        averageScore: round(scores.reduce((sum, s) => sum + s, 0) / scores.length),
        bestScore: round(Math.max(...scores))
      }));

    // ── Per-repository trends: the same codebase measured more than once ──
    const byRepository = new Map<string, typeof history>();
    for (const entry of history) {
      const name = entry.repository?.fullName ?? entry.repository?.name ?? 'Unknown repository';
      const existing = byRepository.get(name);
      if (existing) existing.push(entry);
      else byRepository.set(name, [entry]);
    }

    const trends: RepositoryTrend[] = [...byRepository.entries()]
      .filter(([, entries]) => entries.length >= 2)
      .map(([repository, entries]) => {
        const first = entries[0];
        const latest = entries[entries.length - 1];
        return {
          repository,
          analyses: entries.length,
          firstScore: round(first.score),
          latestScore: round(latest.score),
          change: round(latest.score - first.score),
          firstAt: first.createdAt.toISOString(),
          latestAt: latest.createdAt.toISOString()
        };
      })
      .sort((a, b) => b.change - a.change);

    const scores = history.map((entry) => entry.score);

    return {
      points,
      months,
      milestones: GrowthService.milestonesFrom(history, repositories, skills),
      trends,
      totals: {
        analyses: history.length,
        repositories: repositories.length,
        skills: skills.length,
        firstMeasuredAt: history.length > 0 ? history[0].createdAt.toISOString() : null,
        lastMeasuredAt:
          history.length > 0 ? history[history.length - 1].createdAt.toISOString() : null,
        bestScore: scores.length > 0 ? round(Math.max(...scores)) : null,
        averageScore:
          scores.length > 0 ? round(scores.reduce((sum, s) => sum + s, 0) / scores.length) : null,
        trendAvailable: trends.length > 0
      }
    };
  }

  /**
   * Dated events worth marking, each tied to a specific stored record.
   *
   * Only firsts and bests appear: these are facts with a date attached, not
   * narrative. A milestone that cannot name the row it came from is not one.
   */
  private static milestonesFrom(
    history: { createdAt: Date; score: number; repository: { fullName: string | null } | null }[],
    repositories: { createdAt: Date; fullName: string }[],
    skills: { createdAt: Date; name: string; currentLevel: string }[]
  ): GrowthMilestone[] {
    const milestones: GrowthMilestone[] = [];

    if (repositories.length > 0) {
      milestones.push({
        date: repositories[0].createdAt.toISOString(),
        label: 'First repository connected',
        detail: repositories[0].fullName
      });
    }

    if (history.length > 0) {
      milestones.push({
        date: history[0].createdAt.toISOString(),
        label: 'First analysis completed',
        detail: `${history[0].repository?.fullName ?? 'A repository'} scored ${round(history[0].score)}/100`
      });

      const best = history.reduce((top, entry) => (entry.score > top.score ? entry : top));
      // Only worth marking separately when it is not already the first analysis.
      if (best !== history[0]) {
        milestones.push({
          date: best.createdAt.toISOString(),
          label: 'Best analysis score',
          detail: `${best.repository?.fullName ?? 'A repository'} scored ${round(best.score)}/100`
        });
      }
    }

    const evidenced = skills.filter((skill) => skill.currentLevel === 'PRACTICALLY_EVIDENCED');
    if (evidenced.length > 0) {
      milestones.push({
        date: evidenced[0].createdAt.toISOString(),
        label: 'First skill evidenced by code',
        detail: evidenced[0].name
      });
    }

    return milestones.sort((a, b) => a.date.localeCompare(b.date));
  }
}
