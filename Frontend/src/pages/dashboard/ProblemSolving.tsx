import { useState } from "react";
import { motion } from "motion/react";
import {
  Target,
  Flame,
  CheckCircle2,
  AlertTriangle,
  Braces,
  BarChart3,
  PieChart,
  Lightbulb,
} from "lucide-react";
import PageContainer from "../../components/PageContainer";
import GlassCard from "../../components/GlassCard";
import { NotConnectedNotice } from "../../components/StateBlocks";
import { Reveal, SectionLabel, StatLabel, PendingNotice } from "./ps/shared";
import { DIFFICULTY_COLORS } from "./ps/shared";
import PlatformCard, { type PlatformProfile } from "./ps/PlatformCard";
import { hasDifficultySplit, summarizeDifficulty } from "./ps/difficulty.mts";
import {
  longestStreakFrom,
  mergeCalendars,
  seriesFrom,
  submissionsWithin,
} from "./ps/activityDays.mts";
import ProblemActivityChart from "./ps/ProblemActivityChart";
import DifficultyDonut, { difficultyPercent } from "./ps/DifficultyDonut";
import ConsistencyHeatmap, { ConsistencyStats } from "./ps/ConsistencyHeatmap";
import { ErrorBlock, LoadingBlock } from "../../components/StateBlocks";
import { ApiError } from "../../lib/api";
import { useResource } from "../../lib/useResource";
import { codingProfilesService } from "../../services/codingProfiles";
import type { CodingPlatform, CodingProfile, CodingProfilesResponse } from "../../lib/types";

/* ────────────────────────────────────────────────────────────
   Adapter: CodingProfile rows -> the shapes this page's components expect.

   The API returns structured, nullable values (acceptanceRate: 0.428,
   rating: null). The components below want display-ready strings
   ("43%", "18 d"). Formatting lives here rather than in the backend so that
   changing a label never needs a deploy, and so a statistic a platform does
   not report can simply be dropped instead of being rendered as a zero.
   ──────────────────────────────────────────────────────────── */

const PLATFORM_LABEL: Record<CodingPlatform, PlatformProfile["platform"]> = {
  LEETCODE: "LeetCode",
  GEEKSFORGEEKS: "GeeksforGeeks",
};

/** "2 hours ago" style relative time for the last sync. */
function relativeTime(iso: string | null): string | undefined {
  if (!iso) return undefined;
  const then = new Date(iso).getTime();
  if (Number.isNaN(then)) return undefined;

  const minutes = Math.max(0, Math.round((Date.now() - then) / 60000));
  if (minutes < 1) return "just now";
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.round(hours / 24)}d ago`;
}

/* Calendar days, trailing windows and streaks live in ./activityDays, which
   documents the page's UTC-day convention in one place so the chart, the
   heatmap and the consistency stats cannot drift apart. */

/**
 * One platform's card.
 *
 * `stats` only carries entries the platform actually reported: a null rating
 * means "never entered a contest", and an empty slot says that more honestly
 * than a zero would.
 */
function toPlatformCard(
  platform: CodingPlatform,
  profile: CodingProfile | undefined
): PlatformProfile {
  const label = PLATFORM_LABEL[platform];

  if (!profile) {
    return {
      platform: label,
      username: "",
      connected: false,
      headline: { label: "Solved", value: 0 },
      stats: [],
    };
  }

  const stats: PlatformProfile["stats"] = [];
  if (profile.acceptanceRate !== null) {
    stats.push({ label: "Acceptance", value: `${Math.round(profile.acceptanceRate * 100)}%` });
  }
  if (profile.rating !== null) {
    stats.push({ label: "Contest", value: String(Math.round(profile.rating)) });
  }
  if (profile.streakDays !== null) {
    stats.push({ label: "Streak", value: `${profile.streakDays} d` });
  }
  if (profile.totalActiveDays !== null) {
    stats.push({ label: "Active days", value: String(profile.totalActiveDays) });
  }

  // GFG-specific metrics
  const gfgStats = platform === "GEEKSFORGEEKS" ? {
    codingScore: profile.rawStats?.geeksforgeeks?.codingScore ?? null,
    monthlyScore: profile.rawStats?.geeksforgeeks?.monthlyScore ?? null,
    longestStreak: profile.rawStats?.geeksforgeeks?.longestStreak ?? null,
    articlesPublished: profile.rawStats?.geeksforgeeks?.articlesPublished ?? null,
  } : undefined;

  // Medium coverage is the one progress figure both sides of the ratio exist
  // for; without the site-wide total — or without a difficulty split, as on
  // GeeksforGeeks — there is nothing honest to show.
  const mediumTotal = profile.rawStats?.totalAvailable?.medium ?? null;
  const mediumSolved = profile.mediumSolved;
  const progress =
    mediumTotal && mediumTotal > 0 && mediumSolved !== null
      ? {
          label: "Medium difficulty coverage",
          percent: Math.round((mediumSolved / mediumTotal) * 100),
          caption: `${mediumSolved} of ${mediumTotal.toLocaleString()} medium problems solved`,
        }
      : undefined;

  return {
    platform: label,
    username: profile.handle,
    connected: true,
    lastSyncedAt: relativeTime(profile.lastSyncedAt),
    profileUrl: profile.profileUrl ?? undefined,
    headline: { label: "Solved", value: profile.totalSolved },
    // Omitted entirely when the platform publishes no difficulty split, which
    // leaves the bars out rather than drawing three empty ones. Otherwise the
    // per-bucket counts pass through as they arrived: a bucket the platform did
    // not publish stays null and renders as unavailable on the card, rather than
    // being substituted with a 0 it never measured.
    breakdown: hasDifficultySplit(profile)
      ? [
          { label: "Easy", count: profile.easySolved, color: DIFFICULTY_COLORS.easy },
          { label: "Medium", count: profile.mediumSolved, color: DIFFICULTY_COLORS.medium },
          { label: "Hard", count: profile.hardSolved, color: DIFFICULTY_COLORS.hard },
        ]
      : undefined,
    difficultyUnavailable: !hasDifficultySplit(profile),
    stats,
    progress,
    gfgStats,
  };
}

const PERIODS = ["7D", "30D", "90D", "1Y"] as const;

const DIFFICULTY_BADGE: Record<string, string> = {
  Easy: "text-green-300 bg-green-500/10 border-green-500/25",
  Medium: "text-amber-300 bg-amber-500/10 border-amber-500/25",
  Hard: "text-red-300 bg-red-500/10 border-red-500/25",
};

const PLATFORM_BADGE: Record<string, string> = {
  LeetCode: "text-amber-200/90 bg-amber-500/[0.08] border-amber-500/20",
  GeeksforGeeks: "text-emerald-200/90 bg-emerald-500/[0.08] border-emerald-500/20",
};

/* ──────────────────────────────────────────────────────────── */

export default function ProblemSolving() {
  const [period, setPeriod] = useState<(typeof PERIODS)[number]>("30D");

  const { data, loading, error, reload } = useResource<CodingProfilesResponse>(
    () => codingProfilesService.list(),
    []
  );

  const [busy, setBusy] = useState<CodingPlatform | null>(null);
  /**
   * The last failed action, kept together with the platform it belongs to so the
   * message renders on the card the user acted on rather than only at page
   * level, where it named no cause and sat far from the control.
   */
  const [actionError, setActionError] = useState<{
    platform: CodingPlatform;
    message: string;
  } | null>(null);
  const [handleDrafts, setHandleDrafts] = useState<Record<string, string>>({});

  const profiles: CodingProfile[] = data?.profiles ?? [];
  const leetcode = profiles.find((p) => p.platform === "LEETCODE");
  const gfg = profiles.find((p) => p.platform === "GEEKSFORGEEKS");
  const anyConnected = profiles.length > 0;

  /**
   * Drop a failure message once its cause is being edited. The message names the
   * handle that failed, so it would otherwise read as a verdict on the new one.
   */
  function clearActionError(platform: CodingPlatform) {
    setActionError((current) => (current?.platform === platform ? null : current));
  }

  async function runConnect(platform: CodingPlatform, handle: string) {
    setBusy(platform);
    setActionError(null);
    try {
      await codingProfilesService.connect(platform, handle.trim());
      setHandleDrafts((d) => ({ ...d, [platform]: "" }));
      reload();
    } catch (err) {
      setActionError({
        platform,
        message: err instanceof ApiError ? err.message : "Could not connect that profile.",
      });
    } finally {
      setBusy(null);
    }
  }

  async function runSync(platform: CodingPlatform) {
    setBusy(platform);
    setActionError(null);
    try {
      await codingProfilesService.sync(platform);
      reload();
    } catch (err) {
      setActionError({
        platform,
        message: err instanceof ApiError ? err.message : "Could not sync that profile.",
      });
    } finally {
      setBusy(null);
    }
  }

  async function runDisconnect(platform: CodingPlatform) {
    if (!confirm(`Are you sure you want to disconnect your ${PLATFORM_LABEL[platform]} profile?`)) {
      return;
    }
    setBusy(platform);
    setActionError(null);
    try {
      await codingProfilesService.disconnect(platform);
      reload();
    } catch (err) {
      setActionError({
        platform,
        message: err instanceof ApiError ? err.message : "Could not disconnect that profile.",
      });
    } finally {
      setBusy(null);
    }
  }

  // ── Everything below is derived from the rows above, never invented ──
  const calendar = mergeCalendars(profiles);
  const series = seriesFrom(calendar, period);

  /**
   * Only platforms that publish a difficulty split can contribute to the
   * per-difficulty figures, and only their solves can be the denominator for
   * them: dividing by every solve would silently understate each share by
   * whatever GeeksforGeeks contributed. `summarizeDifficulty` also reports, per
   * bucket, whether anything was published at all — so a bucket nobody reports
   * renders as unavailable instead of as a zero.
   */
  const difficulty = summarizeDifficulty(profiles);

  const overview = {
    total: profiles.reduce((sum, p) => sum + p.totalSolved, 0),
    /** Solves on platforms that report a difficulty split. The right denominator. */
    classified: difficulty.classified,
    easy: difficulty.easy.count,
    medium: difficulty.medium.count,
    hard: difficulty.hard.count,
    // Each platform publishes its own streak under its own definition. Taking
    // the best one keeps the overview consistent with the platform cards;
    // recomputing it here produced a second, different number for the same word.
    streak: profiles.reduce((best, p) => Math.max(best, p.streakDays ?? 0), 0),
  };

  const platforms: PlatformProfile[] = [
    toPlatformCard("LEETCODE", leetcode),
    toPlatformCard("GEEKSFORGEEKS", gfg),
  ];

  /** Wire the unconnected cards' CTAs: functional where connect is live,
      pointing at that input where it exists but is empty, inert where no
      integration exists yet. The display-only mirror (id prefixed `mirror-`)
      never gets a CTA — it only reflects state. */
  const connectProps = (card: PlatformProfile, mirror: boolean) => {
    if (mirror) return {};
    
    // For connected platforms, provide sync and disconnect handlers
    if (card.connected) {
      const platform = card.platform === "LeetCode" ? "LEETCODE" : "GEEKSFORGEEKS";
      return {
        onSync: () => void runSync(platform),
        onDisconnect: () => void runDisconnect(platform),
        isSyncing: busy === platform,
        isDisconnecting: busy === platform,
        errorMessage: actionError?.platform === platform ? actionError.message : null,
      };
    }
    
    // For unconnected platforms, provide connect handlers
    if (card.platform === "LeetCode" && !leetcode) {
      const draft = (handleDrafts["LEETCODE"] ?? "").trim();
      return {
        onConnect: () => void runConnect("LEETCODE", handleDrafts["LEETCODE"] ?? ""),
        connectDisabled: draft === "",
        connectHint: draft === "" ? "Enter your LeetCode username above first" : undefined,
        usernameValue: handleDrafts["LEETCODE"] ?? "",
        onUsernameChange: (value: string) => {
          clearActionError("LEETCODE");
          setHandleDrafts((d) => ({ ...d, LEETCODE: value }));
        },
        usernamePlaceholder: "Enter your LeetCode username",
        // `busy` also covers a sync or disconnect on the other card, so the
        // in-flight state is reported per platform rather than globally.
        isConnecting: busy === "LEETCODE",
        errorMessage: actionError?.platform === "LEETCODE" ? actionError.message : null,
      };
    }
    if (card.platform === "GeeksforGeeks" && !gfg) {
      const draft = (handleDrafts["GEEKSFORGEEKS"] ?? "").trim();
      return {
        onConnect: () => void runConnect("GEEKSFORGEEKS", handleDrafts["GEEKSFORGEEKS"] ?? ""),
        connectDisabled: draft === "",
        connectHint: draft === "" ? "Enter your GFG username above first" : undefined,
        usernameValue: handleDrafts["GEEKSFORGEEKS"] ?? "",
        onUsernameChange: (value: string) => {
          clearActionError("GEEKSFORGEEKS");
          setHandleDrafts((d) => ({ ...d, GEEKSFORGEEKS: value }));
        },
        usernamePlaceholder: "Enter your GFG username",
        isConnecting: busy === "GEEKSFORGEEKS",
        errorMessage: actionError?.platform === "GEEKSFORGEEKS" ? actionError.message : null,
      };
    }
    return {};
  };

  /** Each bucket, with whether any connected platform actually reported it. */
  const difficultyDistribution = [
    {
      label: "Easy",
      count: overview.easy,
      known: difficulty.easy.known,
      color: DIFFICULTY_COLORS.easy,
    },
    {
      label: "Medium",
      count: overview.medium,
      known: difficulty.medium.known,
      color: DIFFICULTY_COLORS.medium,
    },
    {
      label: "Hard",
      count: overview.hard,
      known: difficulty.hard.known,
      color: DIFFICULTY_COLORS.hard,
    },
  ];

  /** The buckets that were reported, in the donut's shape. */
  const difficultySegments = difficultyDistribution
    .filter((d) => d.known)
    .map(({ label, count, color }) => ({ label, count, color }));

  /**
   * What the donut's centre says: the solved total its segments add up to, or
   * null when no platform published a split — an unavailable centre, not 0.
   */
  const difficultyTotal = difficulty.anyKnown
    ? difficultySegments.reduce((sum, segment) => sum + segment.count, 0)
    : null;

  /**
   * Topics carry a solve count but no accuracy: platforms report problems
   * solved per tag and nothing about attempts, so per-topic accuracy cannot
   * be derived. It stays absent rather than being approximated.
   *
   * Merged across every connected platform by tag, so a future GeeksforGeeks
   * profile with topic data contributes here without any UI change.
   */
  const topicTotals = new Map<string, number>();
  for (const profile of profiles) {
    for (const t of profile.rawStats?.topics ?? []) {
      topicTotals.set(t.tag, (topicTotals.get(t.tag) ?? 0) + t.solved);
    }
  }
  const topics = [...topicTotals.entries()]
    .map(([topic, solved]) => ({ topic, solved, accuracy: null as number | null }))
    .sort((a, b) => b.solved - a.solved)
    .slice(0, 12);

  /**
   * Most recent solves, one row per problem, merged across every connected
   * platform and sorted newest-first so a future GeeksforGeeks feed
   * interleaves with LeetCode's instead of being appended.
   *
   * The feed can contain the same problem more than once — re-solving it is a
   * real event — but two identical rows read as a rendering fault, and the
   * table keys on platform, problem and date. The first occurrence is the
   * most recent.
   */
  const recentActivity = [
    ...new Map(
      profiles
        .flatMap((p) =>
          (p.rawStats?.recentSolves ?? []).map((solve) => ({ solve, platform: p.platform }))
        )
        .sort((a, b) => new Date(b.solve.solvedAt).getTime() - new Date(a.solve.solvedAt).getTime())
        .map(({ solve, platform }) => [`${platform}:${solve.title}`, { solve, platform }] as const)
    ).values(),
  ].map(({ solve, platform }) => ({
    platform: PLATFORM_LABEL[platform],
    problem: solve.title,
    // Every entry comes from the accepted-submissions feed, so there is no
    // "Attempted" state to represent — these platforms publish no failed attempts.
    difficulty: solve.difficulty ?? "—",
    topic: solve.topic ?? "—",
    status: "Solved",
    date: solve.solvedAt
      ? new Date(solve.solvedAt).toLocaleDateString(undefined, { month: "short", day: "numeric" })
      : "—",
    url: solve.url,
  }));

  const hasCalendarData = Object.keys(calendar).length > 0;
  const consistency = {
    currentStreak: hasCalendarData ? overview.streak : 0,
    // Computed from the calendar because no platform publishes an all-time best.
    longestStreak: hasCalendarData ? Math.max(longestStreakFrom(calendar), overview.streak) : 0,
    thisWeek: hasCalendarData ? submissionsWithin(calendar, 7) : 0,
    thisMonth: hasCalendarData ? submissionsWithin(calendar, 30) : 0,
    activeDays: hasCalendarData ? Object.keys(calendar).length : 0,
  };

  /**
   * The insight panel, stated only in terms of what was measured.
   *
   * The previous copy cited per-topic accuracy, which no platform reports; this
   * version talks about solve volume and difficulty mix, both of which are
   * counted. Hard-problem share is the one judgement here, and the threshold it
   * uses is stated in the sentence rather than hidden behind an adjective.
   */
  const hardShare =
    overview.classified > 0 ? Math.round((overview.hard / overview.classified) * 100) : 0;
  const mediumShare =
    overview.classified > 0 ? Math.round((overview.medium / overview.classified) * 100) : 0;
  const strongest = topics.slice(0, 3);
  const thinnest = topics.length > 3 ? topics[topics.length - 1] : null;

  const insight = anyConnected
    ? {
        summary:
          strongest.length > 0
            ? `Your solve volume is concentrated in ${strongest
                .map((t) => t.topic)
                .join(", ")} — ${strongest.reduce((sum, t) => sum + t.solved, 0)} problems across those topics. ` +
              `Medium problems are ${mediumShare}% of your solves with a reported difficulty and Hard ${hardShare}%. ` +
              `Per-topic accuracy is not published by these platforms, so these are counts rather than success rates.`
            : `You have ${overview.total.toLocaleString()} solved problems recorded. Topic-level detail will appear once the platform reports it.`,
        focusTitle: thinnest ? thinnest.topic : "Hard problems",
        focusDetail: thinnest
          ? `${thinnest.solved} problems — the thinnest coverage among the topics you have touched.`
          : `${overview.hard} of ${overview.classified} solves with a reported difficulty are Hard.`,
        recommendationTitle: hardShare < 15 ? "Increase hard-problem volume" : "Keep the difficulty mix",
        recommendationDetail:
          hardShare < 15
            ? `Hard problems are ${hardShare}% of your solves. Raising that share is the usual gap between practice volume and interview-grade depth.`
            : `Hard problems are ${hardShare}% of your solves, which is a healthy share — depth is not the limiting factor here.`,
      }
    : {
        summary:
          "Nothing is connected yet, so there is nothing to analyse. Connect a platform and this panel will describe your actual solve history.",
        focusTitle: "No data",
        focusDetail: "Connect a coding platform to see where your coverage is thinnest.",
        recommendationTitle: "Connect a platform",
        recommendationDetail:
          "GeeksforGeeks can be connected below using your public username.",
      };

  /** Names the denominator, so the percentages are never read against the wrong one. */
  const shareBasis =
    overview.classified === overview.total
      ? "of all solves"
      : `of ${overview.classified} solves with reported difficulty (${overview.total - overview.classified} from platforms without difficulty data)`;

  /**
   * A bucket's figure and caption. A bucket nothing published has no count to
   * report: the card shows a dash and says so, rather than a 0 the platforms
   * never measured — which is also why the percentage is withheld.
   */
  const difficultyCard = (known: boolean, count: number) =>
    known
      ? { value: count, sub: `${difficultyPercent(count, overview.classified)}% ${shareBasis}` }
      : { value: null, sub: "Not published by connected platforms" };

  const easyCard = difficultyCard(difficulty.easy.known, overview.easy);
  const mediumCard = difficultyCard(difficulty.medium.known, overview.medium);
  const hardCard = difficultyCard(difficulty.hard.known, overview.hard);

  const overviewCards: {
    icon: typeof Target;
    label: string;
    value: number | null;
    sub: string;
    color: string;
    border: string;
    bg: string;
  }[] = [
    { icon: Target, label: "Total Problems Solved", value: overview.total, sub: `Across ${profiles.length} platform${profiles.length === 1 ? "" : "s"}`, color: "text-primary", border: "border-primary/25", bg: "bg-primary/10" },
    { icon: CheckCircle2, label: "Easy", ...easyCard, color: "text-green-300", border: "border-green-500/25", bg: "bg-green-500/10" },
    { icon: AlertTriangle, label: "Medium", ...mediumCard, color: "text-amber-300", border: "border-amber-500/25", bg: "bg-amber-500/10" },
    { icon: Braces, label: "Hard", ...hardCard, color: "text-red-300", border: "border-red-500/25", bg: "bg-red-500/10" },
    { icon: Flame, label: "Current Streak", value: overview.streak, sub: "Days in a row", color: "text-orange-300", border: "border-orange-500/25", bg: "bg-orange-500/10" },
  ];

  if (loading) {
    return (
      <PageContainer
        title="Problem Solving"
        description="Coding performance, consistency, and problem-solving patterns across competitive programming platforms."
      >
        <LoadingBlock label="Loading your coding profiles…" />
      </PageContainer>
    );
  }

  if (error) {
    return (
      <PageContainer
        title="Problem Solving"
        description="Coding performance, consistency, and problem-solving patterns across competitive programming platforms."
      >
        <ErrorBlock message={error} onRetry={reload} />
      </PageContainer>
    );
  }

  return (
    <PageContainer
      title="Problem Solving"
      description="Coding performance, consistency, and problem-solving patterns across competitive programming platforms."
    >
      {/* Header-right status indicator. Pulled up beside the page title to sit
          top-right, as the title block above only occupies the left side. */}
      <div className="-mt-16 mb-4 flex justify-end">
        <span className="glass-chip px-3 py-1.5 flex items-center gap-2">
          <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
          <span className="text-[10px] font-bold uppercase tracking-widest text-primary">{anyConnected ? "Data synced" : "Not connected"}</span>
        </span>
      </div>

      {!anyConnected && (
        <NotConnectedNotice what="No coding platform is connected yet, so there is nothing to measure. Enter your public GeeksforGeeks or LeetCode username in a card below and these sections fill with your real solve history." />
      )}

      {/* ── 1. Overall overview ── */}
      <Reveal>
        <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-5 gap-4 mb-8">
          {overviewCards.map((c, i) => (
            <motion.div
              key={c.label}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.05 * i, duration: 0.45, ease: [0.25, 0.46, 0.45, 0.94] }}
              whileHover={{ y: -3 }}
              className="glass-panel p-5 relative overflow-hidden"
            >
              <div className={`w-9 h-9 rounded-xl border ${c.border} ${c.bg} flex items-center justify-center ${c.color} mb-4`}>
                <c.icon className="w-4 h-4" />
              </div>
              <p
                className={`text-[26px] leading-none font-extrabold tracking-tight tabular-nums ${
                  c.value === null ? "text-white/30" : "text-white"
                }`}
                title={c.value === null ? "No connected platform publishes this count" : undefined}
              >
                {c.value === null ? "—" : c.value.toLocaleString()}
              </p>
              <p className="text-[10px] font-bold uppercase tracking-widest text-white/35 mt-2.5">{c.label}</p>
              <p className="text-[11px] text-white/30 mt-0.5">{c.sub}</p>
            </motion.div>
          ))}
        </div>
      </Reveal>

      {/* ── 2. Platform cards ── */}
      <Reveal delay={0.1}>
        <SectionLabel right={<span className="text-[10px] font-semibold uppercase tracking-widest text-white/25">Sources: competitive programming</span>}>
          Connected Platforms
        </SectionLabel>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-8">
          {platforms.map((p) => (
            <PlatformCard key={p.platform} profile={p} {...connectProps(p, false)} />
          ))}
        </div>
      </Reveal>

      {/* ── 3. Problem solving analytics ── */}
      <Reveal delay={0.15}>
        <SectionLabel>Problem Solving Analytics</SectionLabel>
        <GlassCard hover={false} className="p-8 mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
            <div className="flex items-center gap-2">
              <BarChart3 className="w-3.5 h-3.5 text-primary" />
              {/* The plotted series is the platforms' submission calendars:
                  submissions recorded in the window, not distinct solves. */}
              <h3 className="text-xs font-bold text-white/70 uppercase tracking-wider">Submissions — Last {period}</h3>
            </div>

            {/* Period selector */}
            <div className="flex items-center gap-1 rounded-full border border-white/[0.08] bg-white/[0.03] p-1 self-start">
              {PERIODS.map((p) => (
                <button
                  key={p}
                  onClick={() => setPeriod(p)}
                  className={`relative px-3 py-1 rounded-full text-[10px] font-bold tracking-widest transition-colors cursor-pointer ${
                    period === p ? "text-black" : "text-white/40 hover:text-white/70"
                  }`}
                >
                  {period === p && (
                    <motion.span
                      layoutId="ps-period-pill"
                      className="absolute inset-0 rounded-full bg-primary"
                      transition={{ type: "spring", stiffness: 320, damping: 26 }}
                    />
                  )}
                  <span className="relative z-10">{p}</span>
                </button>
              ))}
            </div>
          </div>

          <ProblemActivityChart data={series} />
          <p className="text-[11px] text-white/30 mt-3 leading-relaxed">
            Recorded submissions from the submission calendars the connected platforms publish. A
            problem submitted more than once counts more than once — these are submission counts, not
            distinct problems solved.
          </p>
        </GlassCard>
      </Reveal>

      {/* ── 4. Difficulty distribution ── */}
      <Reveal delay={0.2}>
        <SectionLabel>Difficulty Distribution</SectionLabel>
        <GlassCard hover={false} className="p-6 mb-8">
          <div className="flex items-center gap-2 mb-5">
            <PieChart className="w-3.5 h-3.5 text-primary" />
            <h3 className="text-xs font-bold text-white/70 uppercase tracking-wider">How your solves split across difficulty</h3>
          </div>

          <div className="flex flex-col sm:flex-row items-center gap-8">
            <DifficultyDonut segments={difficultySegments} total={difficultyTotal} />

            <div className="flex-1 w-full space-y-4">
              {difficultyDistribution.map((d) => (
                <div key={d.label}>
                  <div className="flex items-center justify-between mb-1.5">
                    <div className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full shrink-0" style={{ background: d.color, boxShadow: `0 0 6px ${d.color}66` }} />
                      <span className="text-sm font-semibold text-white/85">{d.label}</span>
                    </div>
                    <div className="flex items-baseline gap-2">
                      <span
                        className={`text-sm font-bold tabular-nums ${d.known ? "text-white" : "text-white/25"}`}
                        title={d.known ? undefined : "Not published by connected platforms"}
                      >
                        {d.known ? d.count : "—"}
                      </span>
                      {d.known && (
                        <span className="text-[11px] text-white/35 tabular-nums">
                          {difficultyPercent(d.count, overview.classified)}%
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="h-1.5 rounded-full bg-white/[0.05] overflow-hidden">
                    {d.known && (
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${difficultyPercent(d.count, overview.classified)}%` }}
                        transition={{ duration: 0.9, delay: 0.3, ease: [0.25, 0.46, 0.45, 0.94] }}
                        className="h-full rounded-full"
                        style={{ background: d.color, boxShadow: `0 0 6px ${d.color}55` }}
                      />
                    )}
                  </div>
                </div>
              ))}

              {/* Says which platforms the counts came from, or that none of them
                  publish a split — the difference between 0 and unknown. */}
              <p className="text-[11px] text-white/30 pt-1 leading-relaxed">
                {!anyConnected
                  ? "No platform connected yet."
                  : difficulty.anyKnown
                    ? `Counts come from ${profiles
                        .filter(hasDifficultySplit)
                        .map((p) => PLATFORM_LABEL[p.platform])
                        .join(" and ")}${difficulty.unclassified > 0 ? `; ${difficulty.unclassified} solves on platforms that publish no split are excluded from the shares` : ""}.`
                    : "No connected platform publishes an easy / medium / hard split, so these counts are unavailable rather than zero."}
              </p>
            </div>
          </div>
        </GlassCard>
      </Reveal>

      {/* ── 5. Topic performance ── */}
      <Reveal delay={0.25}>
        <SectionLabel>Topic Performance</SectionLabel>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 mb-8">
          {topics.map((t, i) => (
            <motion.div
              key={t.topic}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.02 * i, duration: 0.4 }}
              whileHover={{ y: -2 }}
              className="glass-panel p-4"
            >
              <div className="flex items-start justify-between gap-2 mb-3">
                <div>
                  <p className="text-sm font-semibold text-white/90 leading-tight">{t.topic}</p>
                  <p className="text-[11px] text-white/35 mt-0.5 tabular-nums">{t.solved} problems</p>
                </div>
                {t.accuracy !== null && (
                  <span className="text-sm font-bold text-white/80 tabular-nums shrink-0">{t.accuracy}%</span>
                )}
              </div>

              {/* Accuracy as bar length — length encodes accuracy directly.
                  LeetCode reports problems solved per topic but nothing about
                  attempts, so accuracy is unavailable and the bar is omitted
                  rather than drawn from an approximation. */}
              {t.accuracy !== null && (
              <div className="h-1.5 rounded-full bg-white/[0.05] overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${t.accuracy}%` }}
                  transition={{ duration: 0.8, delay: 0.15 + 0.03 * i, ease: [0.25, 0.46, 0.45, 0.94] }}
                  className="h-full rounded-full"
                  style={{
                    background:
                      t.accuracy >= 75 ? "rgba(22,255,0,0.7)" : t.accuracy >= 60 ? "rgba(251,191,36,0.7)" : "rgba(248,113,113,0.65)",
                    boxShadow: `0 0 6px ${t.accuracy >= 75 ? "rgba(22,255,0,0.25)" : t.accuracy >= 60 ? "rgba(251,191,36,0.25)" : "rgba(248,113,113,0.2)"}`,
                  }}
                />
              </div>
              )}
              {t.accuracy !== null && (
                <p className="text-[10px] font-bold uppercase tracking-widest text-white/25 mt-2.5">
                  {t.accuracy}% accuracy
                </p>
              )}
            </motion.div>
          ))}
        </div>
      </Reveal>

      {/* ── 6. Recent problem activity ── */}
      <Reveal delay={0.3}>
        <SectionLabel>Recent Problem Activity</SectionLabel>
        <GlassCard hover={false} className="p-0 mb-8 overflow-hidden">
          <div className="overflow-x-auto main-scroll">
            <table className="w-full text-left border-collapse min-w-[760px]">
              <thead>
                <tr className="border-b border-white/[0.07]" style={{ background: "rgba(255,255,255,0.02)" }}>
                  {["Platform", "Problem", "Difficulty", "Topic", "Status", "Date"].map((h) => (
                    <th key={h} className="px-5 py-3.5 text-[10px] font-bold uppercase tracking-widest text-white/35 whitespace-nowrap">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {recentActivity.map((r) => (
                  <tr key={`${r.platform}-${r.problem}-${r.date}`} className="border-b border-white/[0.04] last:border-b-0 hover:bg-white/[0.02] transition-colors">
                    <td className="px-5 py-3.5">
                      <span className={`inline-flex items-center text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-full border ${PLATFORM_BADGE[r.platform]}`}>
                        {r.platform}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 text-[13px] font-medium text-white/85 whitespace-nowrap">{r.problem}</td>
                    <td className="px-5 py-3.5">
                      <span className={`inline-flex items-center text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-full border ${DIFFICULTY_BADGE[r.difficulty]}`}>
                        {r.difficulty}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 text-[12px] text-white/50 whitespace-nowrap">{r.topic}</td>
                    <td className="px-5 py-3.5">
                      {r.status === "Solved" ? (
                        <span className="flex items-center gap-1.5 text-[11px] font-semibold text-primary whitespace-nowrap">
                          <CheckCircle2 className="w-3 h-3" /> Solved
                        </span>
                      ) : (
                        <span className="flex items-center gap-1.5 text-[11px] font-semibold text-amber-300/90 whitespace-nowrap">
                          <AlertTriangle className="w-3 h-3" /> Attempted
                        </span>
                      )}
                    </td>
                    <td className="px-5 py-3.5 text-[12px] text-white/35 tabular-nums whitespace-nowrap">{r.date}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </GlassCard>
      </Reveal>

      {/* ── 7. Coding consistency ── */}
      <Reveal delay={0.35}>
        <SectionLabel>Coding Consistency</SectionLabel>
        <div className="mb-8">
          <ConsistencyStats active={anyConnected} hasCalendarData={Object.keys(calendar).length > 0} stats={consistency} />
          <div className="mt-4">
            <ConsistencyHeatmap
              active={anyConnected}
              activity={calendar}
              weeks={26}
              footerNote="Cells represent days with problem-solving submissions from platforms that provide submission calendar data (e.g., LeetCode). This is practice evidence, not GitHub commit activity."
            />
          </div>
        </div>
      </Reveal>

      {/* ── 8. DevProof insight ── */}
      <Reveal delay={0.4}>
        <GlassCard hover={false} className="p-6 md:p-7 border-l-2 border-l-primary relative overflow-hidden mb-8">
          <div
            className="absolute inset-0 pointer-events-none"
            style={{ background: "radial-gradient(ellipse at 0% 50%, rgba(22,255,0,0.05) 0%, transparent 60%)" }}
          />
          <div className="relative">
            <div className="flex items-center gap-2.5 mb-4">
              <Lightbulb className="w-4 h-4 text-primary" />
              <h3 className="text-sm font-bold text-white uppercase tracking-wider">DevProof Insight</h3>
            </div>

            <p className="text-[14px] leading-relaxed text-white/75 max-w-3xl">
              {insight.summary}
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-5">
              <div className="rounded-xl border border-amber-500/20 bg-amber-500/[0.06] p-4">
                <StatLabel>Focus Area</StatLabel>
                <p className="text-sm font-bold text-amber-200 mt-1">{insight.focusTitle}</p>
                <p className="text-[11px] text-white/40 mt-1 leading-relaxed">
                  {insight.focusDetail}
                </p>
              </div>
              <div className="rounded-xl border border-white/[0.08] bg-white/[0.03] p-4">
                <StatLabel>Recommendation</StatLabel>
                <p className="text-sm font-bold text-white mt-1">{insight.recommendationTitle}</p>
                <p className="text-[11px] text-white/40 mt-1 leading-relaxed">
                  {insight.recommendationDetail}
                </p>
              </div>
            </div>
          </div>
        </GlassCard>
      </Reveal>

      <PendingNotice>
        <span className="font-semibold text-amber-200/90">GeeksforGeeks reports less than LeetCode.</span>{" "}
        Enter your username in the platform card above to connect. GeeksforGeeks publishes a solve count,
        a coding score and a streak, but no difficulty split, no acceptance rate, no contest rating and no
        daily activity — so those stay empty on its card rather than showing a zero it never measured.
      </PendingNotice>
    </PageContainer>
  );
}
