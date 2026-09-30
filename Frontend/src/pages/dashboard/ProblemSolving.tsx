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
  Link2,
} from "lucide-react";
import PageContainer from "../../components/PageContainer";
import GlassCard from "../../components/GlassCard";
import { SampleDataNotice } from "../../components/StateBlocks";
import { Reveal, SectionLabel, StatLabel, PendingNotice } from "./ps/shared";
import { DIFFICULTY_COLORS } from "./ps/shared";
import PlatformCard, { type PlatformProfile } from "./ps/PlatformCard";
import ProblemActivityChart, { type ActivityPoint } from "./ps/ProblemActivityChart";
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

/** Merges every connected platform's daily counts into one ISO-date map. */
function mergeCalendars(profiles: CodingProfile[]): Record<string, number> {
  const merged: Record<string, number> = {};
  for (const profile of profiles) {
    for (const [day, count] of Object.entries(profile.rawStats?.submissionCalendar ?? {})) {
      merged[day] = (merged[day] ?? 0) + count;
    }
  }
  return merged;
}

/** Local YYYY-MM-DD. Not toISOString(), which shifts to UTC and skews the day. */
function dayKey(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(
    date.getDate()
  ).padStart(2, "0")}`;
}

/** Daily submission counts over the trailing window the period selector asks for. */
function seriesFrom(calendar: Record<string, number>, period: string): ActivityPoint[] {
  const days = period === "7D" ? 7 : period === "30D" ? 30 : period === "90D" ? 90 : 365;
  const points: ActivityPoint[] = [];
  // A year of daily columns is unreadable, so 1Y is bucketed into weeks.
  const step = days > 90 ? 7 : 1;

  for (let i = days - step; i >= 0; i -= step) {
    const date = new Date();
    date.setDate(date.getDate() - i);

    let value = 0;
    for (let d = 0; d < step; d++) {
      const bucket = new Date(date);
      bucket.setDate(date.getDate() + d);
      value += calendar[dayKey(bucket)] ?? 0;
    }

    points.push({
      label: date.toLocaleDateString(undefined, { month: "short", day: "numeric" }),
      value,
    });
  }
  return points;
}

/** Longest run of consecutive active days anywhere in the recorded history. */
function longestStreakFrom(calendar: Record<string, number>): number {
  const days = Object.keys(calendar).sort();
  let longest = 0;
  let run = 0;
  let previous: number | null = null;

  for (const day of days) {
    const time = new Date(`${day}T00:00:00`).getTime();
    const consecutive = previous !== null && Math.round((time - previous) / 86400000) === 1;
    run = consecutive ? run + 1 : 1;
    if (run > longest) longest = run;
    previous = time;
  }
  return longest;
}

/** Submissions across the trailing `days` window. */
function submissionsWithin(calendar: Record<string, number>, days: number): number {
  let total = 0;
  for (let i = 0; i < days; i++) {
    const date = new Date();
    date.setDate(date.getDate() - i);
    total += calendar[dayKey(date)] ?? 0;
  }
  return total;
}

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

  // Medium coverage is the one progress figure both sides of the ratio exist
  // for; without the site-wide total there is nothing honest to show.
  const mediumTotal = profile.rawStats?.totalAvailable?.medium ?? null;
  const progress =
    mediumTotal && mediumTotal > 0
      ? {
          label: "Medium difficulty coverage",
          percent: Math.round((profile.mediumSolved / mediumTotal) * 100),
          caption: `${profile.mediumSolved} of ${mediumTotal.toLocaleString()} medium problems solved`,
        }
      : undefined;

  return {
    platform: label,
    username: profile.handle,
    connected: true,
    lastSyncedAt: relativeTime(profile.lastSyncedAt),
    profileUrl: profile.profileUrl ?? undefined,
    headline: { label: "Solved", value: profile.totalSolved },
    breakdown: [
      { label: "Easy", count: profile.easySolved, color: DIFFICULTY_COLORS.easy },
      { label: "Medium", count: profile.mediumSolved, color: DIFFICULTY_COLORS.medium },
      { label: "Hard", count: profile.hardSolved, color: DIFFICULTY_COLORS.hard },
    ],
    stats,
    progress,
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
  GFG: "text-emerald-200/90 bg-emerald-500/[0.08] border-emerald-500/20",
};

/* ──────────────────────────────────────────────────────────── */

export default function ProblemSolving() {
  const [period, setPeriod] = useState<(typeof PERIODS)[number]>("30D");

  const { data, loading, error, reload } = useResource<CodingProfilesResponse>(
    () => codingProfilesService.list(),
    []
  );

  const [busy, setBusy] = useState<CodingPlatform | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [handleDraft, setHandleDraft] = useState("");

  const profiles: CodingProfile[] = data?.profiles ?? [];
  const leetcode = profiles.find((p) => p.platform === "LEETCODE");
  const gfg = profiles.find((p) => p.platform === "GEEKSFORGEEKS");
  const anyConnected = profiles.length > 0;

  async function runConnect(platform: CodingPlatform, handle: string) {
    setBusy(platform);
    setActionError(null);
    try {
      await codingProfilesService.connect(platform, handle.trim());
      setHandleDraft("");
      reload();
    } catch (err) {
      setActionError(err instanceof ApiError ? err.message : "Could not connect that profile.");
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
      setActionError(err instanceof ApiError ? err.message : "Could not sync that profile.");
    } finally {
      setBusy(null);
    }
  }

  // ── Everything below is derived from the rows above, never invented ──
  const calendar = mergeCalendars(profiles);
  const series = seriesFrom(calendar, period);

  const overview = {
    total: profiles.reduce((sum, p) => sum + p.totalSolved, 0),
    easy: profiles.reduce((sum, p) => sum + p.easySolved, 0),
    medium: profiles.reduce((sum, p) => sum + p.mediumSolved, 0),
    hard: profiles.reduce((sum, p) => sum + p.hardSolved, 0),
    // Each platform publishes its own streak under its own definition. Taking
    // the best one keeps the overview consistent with the platform cards;
    // recomputing it here produced a second, different number for the same word.
    streak: profiles.reduce((best, p) => Math.max(best, p.streakDays ?? 0), 0),
  };

  const platforms: PlatformProfile[] = [
    toPlatformCard("LEETCODE", leetcode),
    toPlatformCard("GEEKSFORGEEKS", gfg),
  ];

  const difficultyDistribution = [
    { label: "Easy", count: overview.easy, color: DIFFICULTY_COLORS.easy },
    { label: "Medium", count: overview.medium, color: DIFFICULTY_COLORS.medium },
    { label: "Hard", count: overview.hard, color: DIFFICULTY_COLORS.hard },
  ];

  /**
   * Topics carry a solve count but no accuracy: LeetCode reports problems
   * solved per tag and nothing about attempts, so per-topic accuracy cannot be
   * derived. It stays absent rather than being approximated.
   */
  const topics = (leetcode?.rawStats?.topics ?? []).slice(0, 12).map((t) => ({
    topic: t.tag,
    solved: t.solved,
    accuracy: null as number | null,
  }));

  /**
   * Most recent solves, one row per problem.
   *
   * The feed can contain the same problem more than once — re-solving it is a
   * real event — but two identical rows read as a rendering fault, and the
   * table keys on problem and date. The first occurrence is the most recent.
   */
  const recentActivity = [
    ...new Map(
      (leetcode?.rawStats?.recentSolves ?? []).map((solve) => [solve.title, solve])
    ).values(),
  ].map((solve) => ({
    platform: "LeetCode" as const,
    problem: solve.title,
    // Every entry comes from the accepted-submissions feed, so there is no
    // "Attempted" state to represent — LeetCode publishes no failed attempts.
    difficulty: solve.difficulty ?? "—",
    topic: solve.topic ?? "—",
    status: "Solved",
    date: solve.solvedAt
      ? new Date(solve.solvedAt).toLocaleDateString(undefined, { month: "short", day: "numeric" })
      : "—",
    url: solve.url,
  }));

  const consistency = {
    currentStreak: overview.streak,
    // Computed from the calendar because no platform publishes an all-time best.
    longestStreak: Math.max(longestStreakFrom(calendar), overview.streak),
    thisWeek: submissionsWithin(calendar, 7),
    thisMonth: submissionsWithin(calendar, 30),
    activeDays: Object.keys(calendar).length,
  };

  /**
   * The insight panel, stated only in terms of what was measured.
   *
   * The previous copy cited per-topic accuracy, which no platform reports; this
   * version talks about solve volume and difficulty mix, both of which are
   * counted. Hard-problem share is the one judgement here, and the threshold it
   * uses is stated in the sentence rather than hidden behind an adjective.
   */
  const hardShare = overview.total > 0 ? Math.round((overview.hard / overview.total) * 100) : 0;
  const mediumShare = overview.total > 0 ? Math.round((overview.medium / overview.total) * 100) : 0;
  const strongest = topics.slice(0, 3);
  const thinnest = topics.length > 3 ? topics[topics.length - 1] : null;

  const insight = anyConnected
    ? {
        summary:
          strongest.length > 0
            ? `Your solve volume is concentrated in ${strongest
                .map((t) => t.topic)
                .join(", ")} — ${strongest.reduce((sum, t) => sum + t.solved, 0)} problems across those topics. ` +
              `Medium problems are ${mediumShare}% of everything you have solved and Hard ${hardShare}%. ` +
              `Per-topic accuracy is not published by LeetCode, so these are counts rather than success rates.`
            : `You have ${overview.total.toLocaleString()} solved problems recorded. Topic-level detail will appear once the platform reports it.`,
        focusTitle: thinnest ? thinnest.topic : "Hard problems",
        focusDetail: thinnest
          ? `${thinnest.solved} problems — the thinnest coverage among the topics you have touched.`
          : `${overview.hard} of ${overview.total} solves are Hard.`,
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
        recommendationDetail: "LeetCode can be connected below using your public username.",
      };

  const overviewCards = [
    { icon: Target, label: "Total Problems Solved", value: overview.total, sub: `Across ${profiles.length} platform${profiles.length === 1 ? "" : "s"}`, color: "text-primary", border: "border-primary/25", bg: "bg-primary/10" },
    { icon: CheckCircle2, label: "Easy", value: overview.easy, sub: `${difficultyPercent(overview.easy, overview.total)}% of all solves`, color: "text-green-300", border: "border-green-500/25", bg: "bg-green-500/10" },
    { icon: AlertTriangle, label: "Medium", value: overview.medium, sub: `${difficultyPercent(overview.medium, overview.total)}% of all solves`, color: "text-amber-300", border: "border-amber-500/25", bg: "bg-amber-500/10" },
    { icon: Braces, label: "Hard", value: overview.hard, sub: `${difficultyPercent(overview.hard, overview.total)}% of all solves`, color: "text-red-300", border: "border-red-500/25", bg: "bg-red-500/10" },
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
        <SampleDataNotice what="No coding platform is connected yet, so there is nothing to measure. Connect LeetCode below and these sections fill with your real solve history." />
      )}

      {actionError && (
        <div className="mb-6 rounded-2xl border border-red-500/25 bg-red-500/[0.08] px-5 py-3.5">
          <p className="text-[13px] text-red-300">{actionError}</p>
        </div>
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
              <p className="text-[26px] leading-none font-extrabold text-white tracking-tight tabular-nums">
                {c.value.toLocaleString()}
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
            <PlatformCard key={p.platform} profile={p} />
          ))}
        </div>
      </Reveal>

      {/* ── 3. Problem solving analytics ── */}
      <Reveal delay={0.15}>
        <SectionLabel>Problem Solving Analytics</SectionLabel>
        <GlassCard hover={false} className="p-6 mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5">
            <div className="flex items-center gap-2">
              <BarChart3 className="w-3.5 h-3.5 text-primary" />
              <h3 className="text-xs font-bold text-white/70 uppercase tracking-wider">Problems Solved — Last {period}</h3>
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
            <DifficultyDonut segments={difficultyDistribution} />

            <div className="flex-1 w-full space-y-4">
              {difficultyDistribution.map((d) => (
                <div key={d.label}>
                  <div className="flex items-center justify-between mb-1.5">
                    <div className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full shrink-0" style={{ background: d.color, boxShadow: `0 0 6px ${d.color}66` }} />
                      <span className="text-sm font-semibold text-white/85">{d.label}</span>
                    </div>
                    <div className="flex items-baseline gap-2">
                      <span className="text-sm font-bold text-white tabular-nums">{d.count}</span>
                      <span className="text-[11px] text-white/35 tabular-nums">{difficultyPercent(d.count, overview.total)}%</span>
                    </div>
                  </div>
                  <div className="h-1.5 rounded-full bg-white/[0.05] overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${difficultyPercent(d.count, overview.total)}%` }}
                      transition={{ duration: 0.9, delay: 0.3, ease: [0.25, 0.46, 0.45, 0.94] }}
                      className="h-full rounded-full"
                      style={{ background: d.color, boxShadow: `0 0 6px ${d.color}55` }}
                    />
                  </div>
                </div>
              ))}

              <p className="text-[11px] text-white/30 pt-1 leading-relaxed">
                {anyConnected
                  ? `Counts come from ${profiles.map((p) => (p.platform === "LEETCODE" ? "LeetCode" : "GeeksforGeeks")).join(" and ")}.`
                  : "No platform connected yet."}
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
          <ConsistencyStats active={anyConnected} stats={consistency} />
          <div className="mt-4">
            <ConsistencyHeatmap
              active={anyConnected}
              activity={calendar}
              seed={11}
              weeks={26}
              footerNote="Cells represent days with problem-solving activity across connected platforms — this is practice evidence, not GitHub commit activity."
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

      {/* ── Unconnected state reference ──
          No integration ships yet, so the live render path is the connected
          preview above. This block documents (and previews) the unconnected
          experience: when the real integration lands, `PLATFORMS.connected`
          flips to false and every section renders its muted variant. */}
      <Reveal delay={0.45}>
        <SectionLabel>Platform Connection</SectionLabel>
        <GlassCard hover={false} className="p-6 md:p-8 relative overflow-hidden mb-4">
          <div className="flex flex-col md:flex-row md:items-center gap-6">
            <div className="flex-1">
              <div className="flex items-center gap-2.5 mb-2">
                <Link2 className="w-4 h-4 text-primary" />
                <h3 className="text-base font-bold text-white tracking-tight">Connect your coding platforms</h3>
              </div>
              <p className="text-[13px] leading-relaxed max-w-xl" style={{ color: "var(--text-secondary)" }}>
                Connect LeetCode and GeeksforGeeks to turn your coding activity into measurable problem-solving
                evidence. Until connected, the sections above show illustrative preview data — nothing is synced
                from your accounts yet.
              </p>
              <div className="flex flex-wrap gap-3 mt-5">
                {leetcode ? (
                  <button
                    onClick={() => void runSync("LEETCODE")}
                    disabled={busy !== null}
                    className="text-xs font-bold uppercase tracking-widest px-5 py-2.5 rounded-full transition-all hover:-translate-y-0.5 cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
                    style={{ backgroundColor: "hsl(var(--primary))", color: "hsl(var(--primary-foreground))" }}
                  >
                    {busy === "LEETCODE" ? "Syncing…" : "Sync LeetCode"}
                  </button>
                ) : (
                  <>
                    <input
                      value={handleDraft}
                      onChange={(e) => setHandleDraft(e.target.value)}
                      placeholder="LeetCode username"
                      className="rounded-full border border-white/10 bg-white/[0.03] px-4 py-2.5 text-xs text-white placeholder:text-white/25 outline-none focus:border-white/25"
                    />
                    <button
                      onClick={() => void runConnect("LEETCODE", handleDraft)}
                      disabled={busy !== null || !handleDraft.trim()}
                      className="text-xs font-bold uppercase tracking-widest px-5 py-2.5 rounded-full transition-all hover:-translate-y-0.5 cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
                      style={{ backgroundColor: "hsl(var(--primary))", color: "hsl(var(--primary-foreground))" }}
                    >
                      {busy === "LEETCODE" ? "Connecting…" : "Connect LeetCode"}
                    </button>
                  </>
                )}
                <button
                  className="text-xs font-bold uppercase tracking-widest px-5 py-2.5 rounded-full border border-white/12 bg-white/[0.04] text-white/80 hover:bg-white/[0.08] hover:border-white/25 transition-all cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
                  disabled
                  title="GeeksforGeeks integration is not built yet"
                >
                  Connect GeeksforGeeks
                </button>
              </div>
            </div>

            {/* Small inline preview of the unconnected platform cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 md:w-[420px] shrink-0">
              {platforms.map((p) => (
                <PlatformCard key={`nc-${p.platform}`} profile={{ ...p, connected: false }} />
              ))}
            </div>
          </div>
        </GlassCard>
      </Reveal>

      <PendingNotice>
        <span className="font-semibold text-amber-200/90">Integrations pending.</span> The connect buttons stay
        disabled until the LeetCode / GeeksforGeeks integrations ship. Platform cards, charts, topics, the activity
        table, and the heatmap above render their muted, unconnected variants automatically once the page is driven
        by real platform state instead of preview data.
      </PendingNotice>
    </PageContainer>
  );
}
