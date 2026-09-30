import { CodingProfile, Prisma } from '@prisma/client';
import { prisma } from '../config/database';
import { AppError } from '../utils/appError';
import { LeetCodeService, LeetCodeProfile } from './leetcode.service';

// ==========================================
// CODING PROFILE SERVICE
// ==========================================
// Owns persistence for competitive-programming profiles and delegates the
// actual fetching to a per-platform service.
//
// Platforms are registered in FETCHERS below, so adding GeeksforGeeks means
// writing its fetcher and adding one line here — no controller or route change.

/** Platforms DevProof can ingest. Validated at the route boundary by Zod. */
export const SUPPORTED_PLATFORMS = ['LEETCODE', 'GEEKSFORGEEKS'] as const;
export type SupportedPlatform = (typeof SUPPORTED_PLATFORMS)[number];

/** Human-facing platform names, used in messages rather than raw enum values. */
const PLATFORM_LABEL: Record<SupportedPlatform, string> = {
  LEETCODE: 'LeetCode',
  GEEKSFORGEEKS: 'GeeksforGeeks'
};

/**
 * The normalized shape every platform fetcher must return.
 *
 * Deliberately the same as LeetCodeProfile: it is the superset of what any
 * platform reports, and a platform that cannot supply a field returns null for
 * it rather than omitting it or substituting a zero.
 */
export type FetchedProfile = LeetCodeProfile;

type PlatformFetcher = (handle: string) => Promise<FetchedProfile>;

const FETCHERS: Partial<Record<SupportedPlatform, PlatformFetcher>> = {
  LEETCODE: (handle) => LeetCodeService.fetchProfile(handle)
};

function fetcherFor(platform: SupportedPlatform): PlatformFetcher {
  const fetcher = FETCHERS[platform];
  if (!fetcher) {
    // 501 rather than 400: the request is valid, the capability is missing.
    throw AppError.notImplemented(
      `${PLATFORM_LABEL[platform]} integration is not available yet. Only LeetCode can be connected right now.`
    );
  }
  return fetcher;
}

export class CodingProfileService {
  /** Every coding profile the user has linked. */
  static async list(userId: string): Promise<CodingProfile[]> {
    return prisma.codingProfile.findMany({
      where: { userId },
      orderBy: { platform: 'asc' }
    });
  }

  /**
   * Link a platform account and populate it in one step.
   *
   * The fetch happens before any write, so an invalid or private handle leaves
   * nothing behind — a stored profile always corresponds to one that resolved
   * at least once.
   */
  static async connect(
    userId: string,
    platform: SupportedPlatform,
    handle: string
  ): Promise<CodingProfile> {
    const profile = await fetcherFor(platform)(handle);
    return CodingProfileService.persist(userId, platform, profile);
  }

  /**
   * Refresh a linked profile from its platform.
   *
   * Re-fetches using the stored handle rather than trusting a client-supplied
   * one, so a sync can never quietly repoint a profile at a different account.
   */
  static async sync(userId: string, platform: SupportedPlatform): Promise<CodingProfile> {
    const existing = await prisma.codingProfile.findUnique({
      where: { userId_platform: { userId, platform } }
    });

    if (!existing) {
      throw AppError.notFound(
        `No ${PLATFORM_LABEL[platform]} profile is linked. Connect one before syncing.`
      );
    }

    const profile = await fetcherFor(platform)(existing.handle);
    return CodingProfileService.persist(userId, platform, profile);
  }

  /** Unlink a platform. Absent profiles report 404 rather than succeeding silently. */
  static async disconnect(userId: string, platform: SupportedPlatform): Promise<void> {
    try {
      await prisma.codingProfile.delete({
        where: { userId_platform: { userId, platform } }
      });
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2025') {
        throw AppError.notFound(`No ${PLATFORM_LABEL[platform]} profile is linked.`);
      }
      throw error;
    }
  }

  /**
   * Write a fetched profile, creating or replacing the row for this platform.
   *
   * Every statistic is written on every sync, including the nulls: a user who
   * stops entering contests must lose their stored rating rather than keep a
   * stale one that no longer reflects the platform.
   */
  private static persist(
    userId: string,
    platform: SupportedPlatform,
    profile: FetchedProfile
  ): Promise<CodingProfile> {
    const stats = {
      handle: profile.handle,
      profileUrl: profile.profileUrl,
      totalSolved: profile.totalSolved,
      easySolved: profile.easySolved,
      mediumSolved: profile.mediumSolved,
      hardSolved: profile.hardSolved,
      acceptanceRate: profile.acceptanceRate,
      ranking: profile.ranking,
      rating: profile.rating,
      contestsAttended: profile.contestsAttended,
      globalRanking: profile.globalRanking,
      topPercentage: profile.topPercentage,
      streakDays: profile.streakDays,
      totalActiveDays: profile.totalActiveDays,
      rawStats: profile.rawStats as unknown as Prisma.InputJsonValue,
      lastSyncedAt: new Date()
    };

    return prisma.codingProfile.upsert({
      where: { userId_platform: { userId, platform } },
      create: { userId, platform, ...stats },
      // userId and platform are fixed by the where clause and never rewritten.
      update: stats
    });
  }
}
