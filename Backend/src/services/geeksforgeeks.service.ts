import { AppError } from '../utils/appError';

// ==========================================
// GEEKSFORGEEKS PROFILE SERVICE
// ==========================================
// Reads a public GeeksforGeeks profile.
//
// GeeksforGeeks publishes no API. Its profile page is a Next.js app whose
// server-rendered payload carries the statistics as JSON, so they can be read
// with a plain request — no headless browser, no authentication, no key. What
// this is NOT is a contract: the field names below are implementation detail of
// their site and can change in any deploy, with no notice and no version. Every
// field is therefore optional, and a shape change costs statistics rather than
// failing the sync.
//
// GeeksforGeeks publishes considerably less than LeetCode. There is no
// difficulty breakdown, no acceptance rate, no contest rating, no submission
// calendar and no per-topic counts — not for a dormant account and not for an
// active one. Those stay null rather than being approximated.

const PROFILE_URL = 'https://www.geeksforgeeks.org/profile';
const REQUEST_TIMEOUT_MS = 15_000;

/** The subset of the embedded payload this service reads. */
interface GfgStats {
  name?: string;
  score?: number;
  monthly_score?: number;
  total_problems_solved?: number;
  institute_rank?: string;
  institute_name?: string | null;
  pod_solved_current_streak?: number;
  pod_solved_longest_streak?: number;
  pod_correct_submissions_count?: number;
  total_articles_published?: number;
  created_date?: string;
}

/** Normalized profile, matching the shape every platform fetcher returns. */
export interface GeeksforGeeksProfile {
  handle: string;
  profileUrl: string;
  totalSolved: number;
  easySolved: null;
  mediumSolved: null;
  hardSolved: null;
  acceptanceRate: null;
  ranking: null;
  rating: null;
  contestsAttended: null;
  globalRanking: null;
  topPercentage: null;
  streakDays: number | null;
  totalActiveDays: null;
  rawStats: {
    submissionCalendar: Record<string, number>;
    totalAvailable: { easy: null; medium: null; hard: null };
    topics: never[];
    languages: never[];
    recentSolves: never[];
    /** Statistics GeeksforGeeks publishes that have no equivalent elsewhere. */
    geeksforgeeks: {
      displayName: string | null;
      codingScore: number | null;
      monthlyScore: number | null;
      instituteName: string | null;
      instituteRank: string | null;
      longestStreak: number | null;
      problemOfTheDaySolved: number | null;
      articlesPublished: number | null;
      memberSince: string | null;
    };
  };
}

function num(value: unknown): number | null {
  return typeof value === 'number' && Number.isFinite(value) ? value : null;
}

function count(value: unknown): number {
  const n = num(value);
  return n !== null && n >= 0 ? Math.round(n) : 0;
}

function text(value: unknown): string | null {
  return typeof value === 'string' && value.trim() ? value.trim() : null;
}

export class GeeksforGeeksService {
  /**
   * Fetch and normalize a public GeeksforGeeks profile.
   *
   * @throws 404 when the handle has no public profile.
   * @throws 503 when GeeksforGeeks is unreachable, slow, or returns something
   *         this service cannot read — none of which is a bug here, and all of
   *         which are worth retrying later.
   */
  static async fetchProfile(handle: string): Promise<GeeksforGeeksProfile> {
    const username = handle.trim();
    if (!username) {
      throw AppError.badRequest('A GeeksforGeeks username is required.');
    }

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

    let response: Response;
    try {
      response = await fetch(`${PROFILE_URL}/${encodeURIComponent(username)}`, {
        headers: {
          // The site serves a different, stat-free payload without a browser UA.
          'User-Agent':
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120 Safari/537.36',
          Accept: 'text/html,application/xhtml+xml'
        },
        redirect: 'follow',
        signal: controller.signal
      });
    } catch (error) {
      if ((error as Error).name === 'AbortError') {
        throw AppError.serviceUnavailable('GeeksforGeeks did not respond in time. Please try again shortly.');
      }
      throw AppError.serviceUnavailable(`Could not reach GeeksforGeeks: ${(error as Error).message}`);
    } finally {
      clearTimeout(timeout);
    }

    if (response.status === 404) {
      throw AppError.notFound(
        `GeeksforGeeks has no public profile for "${username}". Check the username on your profile URL.`
      );
    }
    if (response.status === 429) {
      throw AppError.serviceUnavailable(
        'GeeksforGeeks is rate limiting requests. Please try again in a few minutes.'
      );
    }
    if (!response.ok) {
      throw AppError.serviceUnavailable(`GeeksforGeeks returned status ${response.status}.`);
    }

    const html = await response.text();
    const stats = GeeksforGeeksService.extractStats(html);

    if (!stats) {
      // A page that loads but carries no statistics block: either the handle
      // does not exist (the site answers 200 with a generic page) or the payload
      // has changed shape. Both are reported as "not found" because from the
      // caller's position the profile could not be read.
      throw AppError.notFound(
        `No GeeksforGeeks statistics could be read for "${username}". Check the username, or the profile may not be public.`
      );
    }

    return {
      handle: username,
      profileUrl: `${PROFILE_URL}/${encodeURIComponent(username)}`,
      totalSolved: count(stats.total_problems_solved),
      // GeeksforGeeks publishes no difficulty split. Null, never zero.
      easySolved: null,
      mediumSolved: null,
      hardSolved: null,
      acceptanceRate: null,
      ranking: null,
      rating: null,
      contestsAttended: null,
      globalRanking: null,
      topPercentage: null,
      streakDays: num(stats.pod_solved_current_streak),
      totalActiveDays: null,
      rawStats: {
        submissionCalendar: {},
        totalAvailable: { easy: null, medium: null, hard: null },
        topics: [],
        languages: [],
        recentSolves: [],
        geeksforgeeks: {
          displayName: text(stats.name),
          codingScore: num(stats.score),
          monthlyScore: num(stats.monthly_score),
          instituteName: text(stats.institute_name),
          instituteRank: text(stats.institute_rank),
          longestStreak: num(stats.pod_solved_longest_streak),
          problemOfTheDaySolved: num(stats.pod_correct_submissions_count),
          articlesPublished: num(stats.total_articles_published),
          memberSince: text(stats.created_date)
        }
      }
    };
  }

  /**
   * Pull the statistics object out of the server-rendered payload.
   *
   * The payload is JSON embedded in script tags with its quotes escaped. Rather
   * than regex each field out of the whole document — which picks up identically
   * named fields from unrelated objects, as `handle` does a dozen times — this
   * locates the one object containing `total_problems_solved` and parses from
   * its opening brace, so every value is read from the same record.
   */
  private static extractStats(html: string): GfgStats | null {
    const unescaped = html.replace(/\\"/g, '"');

    const marker = unescaped.indexOf('"total_problems_solved"');
    if (marker === -1) return null;

    // Walk back to the start of the object holding it.
    const start = unescaped.lastIndexOf('{', marker);
    if (start === -1) return null;

    // Walk forward matching braces, so a nested object does not end it early.
    let depth = 0;
    let end = -1;
    for (let i = start; i < unescaped.length; i++) {
      const char = unescaped[i];
      if (char === '{') depth += 1;
      else if (char === '}') {
        depth -= 1;
        if (depth === 0) {
          end = i + 1;
          break;
        }
      }
    }
    if (end === -1) return null;

    try {
      return JSON.parse(unescaped.slice(start, end)) as GfgStats;
    } catch {
      // The slice is not valid JSON on its own — the payload shape has moved.
      return null;
    }
  }
}
