import { AppError } from '../utils/appError';

// ==========================================
// LEETCODE PROFILE SERVICE
// ==========================================
// Reads a public LeetCode profile through the site's GraphQL endpoint.
//
// This is LeetCode's own internal API, not a documented public one: there is no
// contract, no versioning, and no deprecation notice. Everything below is
// therefore defensive — every field is treated as optional, and a shape change
// degrades the profile to fewer statistics rather than throwing.
//
// Nothing here invents a value. A statistic LeetCode does not return stays null
// all the way to the dashboard, which renders it as unavailable rather than 0.

const LEETCODE_GRAPHQL = 'https://leetcode.com/graphql';
const REQUEST_TIMEOUT_MS = 15_000;

/** Difficulty buckets LeetCode reports, alongside an "All" total. */
type Difficulty = 'All' | 'Easy' | 'Medium' | 'Hard';

interface SubmissionCount {
  difficulty?: Difficulty;
  count?: number;
  submissions?: number;
}

interface LeetCodeResponse {
  data?: {
    matchedUser?: {
      username?: string;
      profile?: { ranking?: number; realName?: string; userAvatar?: string };
      submitStats?: {
        acSubmissionNum?: SubmissionCount[];
        totalSubmissionNum?: SubmissionCount[];
      };
      userCalendar?: { streak?: number; totalActiveDays?: number; submissionCalendar?: string };
      languageProblemCount?: { languageName?: string; problemsSolved?: number }[];
      tagProblemCounts?: Record<string, { tagName?: string; problemsSolved?: number }[]>;
    } | null;
    userContestRanking?: {
      attendedContestsCount?: number;
      rating?: number;
      globalRanking?: number;
      topPercentage?: number;
    } | null;
    allQuestionsCount?: { difficulty?: Difficulty; count?: number }[];
    recentAcSubmissionList?: { title?: string; titleSlug?: string; timestamp?: string }[] | null;
  };
  errors?: { message?: string }[];
}

/** Normalized profile, with null for anything LeetCode did not report. */
export interface LeetCodeProfile {
  handle: string;
  profileUrl: string;
  totalSolved: number;
  easySolved: number;
  mediumSolved: number;
  hardSolved: number;
  acceptanceRate: number | null;
  ranking: number | null;
  rating: number | null;
  contestsAttended: number | null;
  globalRanking: number | null;
  topPercentage: number | null;
  streakDays: number | null;
  totalActiveDays: number | null;
  rawStats: {
    /** ISO date -> submissions that day. Drives the activity chart and heatmap. */
    submissionCalendar: Record<string, number>;
    /** Total problems on the site per difficulty, for coverage percentages. */
    totalAvailable: { easy: number | null; medium: number | null; hard: number | null };
    topics: { tag: string; solved: number }[];
    languages: { language: string; solved: number }[];
    /**
     * Most recent accepted submissions.
     *
     * Every entry is an accepted solve — LeetCode exposes no public feed of
     * failed attempts — so there is no "attempted" state to report here.
     * difficulty and topic come from a second lookup per problem and are null
     * when that lookup fails, which costs a table cell rather than the sync.
     */
    recentSolves: {
      title: string;
      url: string;
      solvedAt: string;
      difficulty: string | null;
      topic: string | null;
    }[];
  };
}

const PROFILE_QUERY = `
query devproofUserProfile($username: String!) {
  matchedUser(username: $username) {
    username
    profile { ranking realName userAvatar }
    submitStats {
      acSubmissionNum { difficulty count submissions }
      totalSubmissionNum { difficulty count submissions }
    }
    userCalendar { streak totalActiveDays submissionCalendar }
    languageProblemCount { languageName problemsSolved }
    tagProblemCounts {
      advanced { tagName problemsSolved }
      intermediate { tagName problemsSolved }
      fundamental { tagName problemsSolved }
    }
  }
  userContestRanking(username: $username) {
    attendedContestsCount
    rating
    globalRanking
    topPercentage
  }
  allQuestionsCount { difficulty count }
  recentAcSubmissionList(username: $username, limit: 8) {
    title
    titleSlug
    timestamp
  }
}`;

/** Second-pass lookup: the submission feed carries no difficulty or topic. */
const QUESTION_QUERY = `
query devproofQuestionMeta($titleSlug: String!) {
  question(titleSlug: $titleSlug) {
    difficulty
    topicTags { name }
  }
}`;

/** Reads one difficulty bucket out of LeetCode's array-of-objects shape. */
function bucket(list: SubmissionCount[] | undefined, difficulty: Difficulty): SubmissionCount | undefined {
  return (list ?? []).find((entry) => entry.difficulty === difficulty);
}

/** A finite number, or null. Guards against nulls, strings and NaN alike. */
function num(value: unknown): number | null {
  return typeof value === 'number' && Number.isFinite(value) ? value : null;
}

/** A finite non-negative integer, defaulting to 0 — used only for solve counts. */
function count(value: unknown): number {
  const n = num(value);
  return n !== null && n >= 0 ? Math.round(n) : 0;
}

export class LeetCodeService {
  /**
   * Fetch and normalize a public LeetCode profile.
   *
   * @throws 404 when the handle does not exist or the profile is not public.
   * @throws 503 when LeetCode is unreachable, times out, or answers with a
   *         shape we cannot read — never a 500, because none of these are bugs
   *         in DevProof and all of them are worth retrying later.
   */
  static async fetchProfile(handle: string): Promise<LeetCodeProfile> {
    const username = handle.trim();
    if (!username) {
      throw AppError.badRequest('A LeetCode username is required.');
    }

    // fetch() has no built-in timeout; without this a hung upstream would hold
    // the request open indefinitely.
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

    let response: Response;
    try {
      response = await fetch(LEETCODE_GRAPHQL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          // LeetCode rejects requests without a browser-ish UA and referer.
          'User-Agent': 'Mozilla/5.0 (compatible; DevProof/1.0)',
          Referer: `https://leetcode.com/u/${encodeURIComponent(username)}/`
        },
        body: JSON.stringify({ query: PROFILE_QUERY, variables: { username } }),
        signal: controller.signal
      });
    } catch (error) {
      if ((error as Error).name === 'AbortError') {
        throw AppError.serviceUnavailable('LeetCode did not respond in time. Please try again shortly.');
      }
      throw AppError.serviceUnavailable(`Could not reach LeetCode: ${(error as Error).message}`);
    } finally {
      clearTimeout(timeout);
    }

    if (response.status === 429) {
      throw AppError.serviceUnavailable('LeetCode is rate limiting requests. Please try again in a few minutes.');
    }
    if (!response.ok) {
      throw AppError.serviceUnavailable(`LeetCode returned status ${response.status}.`);
    }

    let body: LeetCodeResponse;
    try {
      body = (await response.json()) as LeetCodeResponse;
    } catch {
      throw AppError.serviceUnavailable('LeetCode returned a response DevProof could not parse.');
    }

    const user = body.data?.matchedUser;

    // A missing user is reported as HTTP 200 with matchedUser: null and an
    // errors array — not a 404 — so the absence has to be detected here.
    if (!user) {
      throw AppError.notFound(
        `LeetCode has no public profile for "${username}". Check the username, or make the profile public.`
      );
    }

    const accepted = user.submitStats?.acSubmissionNum;
    const attempted = user.submitStats?.totalSubmissionNum;

    // LeetCode's own acceptance rate is accepted submissions over all
    // submissions — not problems solved over problems attempted.
    const acceptedSubmissions = num(bucket(accepted, 'All')?.submissions);
    const totalSubmissions = num(bucket(attempted, 'All')?.submissions);
    const acceptanceRate =
      acceptedSubmissions !== null && totalSubmissions !== null && totalSubmissions > 0
        ? Math.round((acceptedSubmissions / totalSubmissions) * 1000) / 1000
        : null;

    const contest = body.data?.userContestRanking ?? null;
    const available = body.data?.allQuestionsCount ?? [];
    const availableFor = (difficulty: Difficulty) =>
      num(available.find((entry) => entry.difficulty === difficulty)?.count);

    // Tag counts arrive grouped by advanced/intermediate/fundamental; the
    // grouping is LeetCode's editorial judgement and not worth preserving.
    const topics = Object.values(user.tagProblemCounts ?? {})
      .flat()
      .flatMap((tag) =>
        tag?.tagName && count(tag.problemsSolved) > 0
          ? [{ tag: tag.tagName, solved: count(tag.problemsSolved) }]
          : []
      )
      .sort((a, b) => b.solved - a.solved);

    const languages = (user.languageProblemCount ?? [])
      .flatMap((entry) =>
        entry?.languageName && count(entry.problemsSolved) > 0
          ? [{ language: entry.languageName, solved: count(entry.problemsSolved) }]
          : []
      )
      .sort((a, b) => b.solved - a.solved);

    return {
      handle: user.username ?? username,
      profileUrl: `https://leetcode.com/u/${encodeURIComponent(user.username ?? username)}/`,
      totalSolved: count(bucket(accepted, 'All')?.count),
      easySolved: count(bucket(accepted, 'Easy')?.count),
      mediumSolved: count(bucket(accepted, 'Medium')?.count),
      hardSolved: count(bucket(accepted, 'Hard')?.count),
      acceptanceRate,
      ranking: num(user.profile?.ranking),
      // A user who has never entered a contest has no rating. That is null,
      // not zero — zero would render as a real but terrible score.
      rating: num(contest?.rating),
      contestsAttended: num(contest?.attendedContestsCount),
      globalRanking: num(contest?.globalRanking),
      topPercentage: num(contest?.topPercentage),
      streakDays: num(user.userCalendar?.streak),
      totalActiveDays: num(user.userCalendar?.totalActiveDays),
      rawStats: {
        recentSolves: await LeetCodeService.enrichRecentSolves(body.data?.recentAcSubmissionList),
        submissionCalendar: LeetCodeService.parseCalendar(user.userCalendar?.submissionCalendar),
        totalAvailable: {
          easy: availableFor('Easy'),
          medium: availableFor('Medium'),
          hard: availableFor('Hard')
        },
        topics,
        languages
      }
    };
  }

  /**
   * Attach difficulty and topic to each recent solve.
   *
   * These need one extra request per problem, issued in parallel and capped by
   * the `limit` on the submission query itself. Every lookup is independently
   * recoverable: a failure leaves that row's difficulty and topic null rather
   * than losing the solve, and no lookup failure can fail the sync.
   */
  private static async enrichRecentSolves(
    submissions: { title?: string; titleSlug?: string; timestamp?: string }[] | null | undefined
  ): Promise<LeetCodeProfile['rawStats']['recentSolves']> {
    const recent = (submissions ?? []).filter((s) => s?.title && s?.titleSlug);
    if (recent.length === 0) return [];

    return Promise.all(
      recent.map(async (submission) => {
        const slug = submission.titleSlug!;
        const epoch = Number(submission.timestamp);

        let difficulty: string | null = null;
        let topic: string | null = null;

        try {
          const meta = await LeetCodeService.fetchQuestionMeta(slug);
          difficulty = meta.difficulty;
          topic = meta.topic;
        } catch {
          // Non-fatal by design — see the doc comment above.
        }

        return {
          title: submission.title!,
          url: `https://leetcode.com/problems/${slug}/`,
          solvedAt: Number.isFinite(epoch) ? new Date(epoch * 1000).toISOString() : '',
          difficulty,
          topic
        };
      })
    );
  }

  /** Difficulty and primary topic for one problem. Throws; callers tolerate it. */
  private static async fetchQuestionMeta(
    titleSlug: string
  ): Promise<{ difficulty: string | null; topic: string | null }> {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

    try {
      const response = await fetch(LEETCODE_GRAPHQL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'User-Agent': 'Mozilla/5.0 (compatible; DevProof/1.0)',
          Referer: `https://leetcode.com/problems/${titleSlug}/`
        },
        body: JSON.stringify({ query: QUESTION_QUERY, variables: { titleSlug } }),
        signal: controller.signal
      });

      if (!response.ok) return { difficulty: null, topic: null };

      const body = (await response.json()) as {
        data?: { question?: { difficulty?: string; topicTags?: { name?: string }[] } | null };
      };
      const question = body.data?.question;

      return {
        difficulty: question?.difficulty ?? null,
        // LeetCode tags a problem with several topics; the first is the one its
        // own UI leads with, and the table has room for exactly one.
        topic: question?.topicTags?.[0]?.name ?? null
      };
    } finally {
      clearTimeout(timeout);
    }
  }

  /**
   * LeetCode returns the calendar as a JSON *string* keyed by unix seconds.
   *
   * Converted to ISO dates so consumers never deal with epoch maths or the
   * double-encoding, and so the stored shape is readable in the database.
   */
  private static parseCalendar(raw: string | undefined): Record<string, number> {
    if (!raw) return {};

    let parsed: unknown;
    try {
      parsed = JSON.parse(raw);
    } catch {
      // A malformed calendar costs the heatmap, not the whole sync.
      return {};
    }

    if (!parsed || typeof parsed !== 'object') return {};

    const calendar: Record<string, number> = {};
    for (const [seconds, submissions] of Object.entries(parsed as Record<string, unknown>)) {
      const epoch = Number(seconds);
      const value = count(submissions);
      if (!Number.isFinite(epoch) || value <= 0) continue;

      const date = new Date(epoch * 1000).toISOString().slice(0, 10);
      calendar[date] = (calendar[date] ?? 0) + value;
    }
    return calendar;
  }
}
