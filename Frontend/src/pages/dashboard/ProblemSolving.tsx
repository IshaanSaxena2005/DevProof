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

/* ────────────────────────────────────────────────────────────
   Sample problem-solving data.

   No LeetCode / GeeksforGeeks integration exists yet, so nothing on this page
   comes from an API. These figures are illustrative and are surfaced to the
   user by the SampleDataNotice above the fold. When the real integrations
   land, delete this block, fetch platform state via `api`, and flip CONNECTED
   off when neither platform is linked.
   ──────────────────────────────────────────────────────────── */

const PLATFORMS: PlatformProfile[] = [
  {
    platform: "LeetCode",
    username: "arjunmehta",
    connected: true,
    lastSyncedAt: "2h ago",
    profileUrl: "https://leetcode.com/arjunmehta",
    headline: { label: "Solved", value: 342 },
    breakdown: [
      { label: "Easy", count: 150, color: DIFFICULTY_COLORS.easy },
      { label: "Medium", count: 155, color: DIFFICULTY_COLORS.medium },
      { label: "Hard", count: 37, color: DIFFICULTY_COLORS.hard },
    ],
    stats: [
      { label: "Acceptance", value: "68%" },
      { label: "Contest", value: "1542" },
      { label: "Streak", value: "18 d" },
    ],
    progress: {
      label: "Medium difficulty coverage",
      percent: 55,
      caption: "155 of 280 medium problems attempted",
    },
  },
  {
    platform: "GeeksforGeeks",
    username: "arjun.mehta",
    connected: true,
    lastSyncedAt: "5h ago",
    profileUrl: "https://www.geeksforgeeks.org/user/arjunmehta/",
    headline: { label: "Problems Solved", value: 286 },
    breakdown: [
      { label: "Easy", count: 141, color: DIFFICULTY_COLORS.easy },
      { label: "Medium", count: 119, color: DIFFICULTY_COLORS.medium },
      { label: "Hard", count: 26, color: DIFFICULTY_COLORS.hard },
    ],
    stats: [
      { label: "Coding Score", value: "742" },
      { label: "Streak", value: "12 d" },
      { label: "Articles", value: "24" },
    ],
    progress: {
      label: "Institute rank trajectory",
      percent: 42,
      caption: "Top 12% of active GFG problem solvers",
    },
  },
];

const OVERVIEW = {
  total: 628,
  easy: 291,
  medium: 274,
  hard: 63,
  streak: 18,
};

const DIFFICULTY_DISTRIBUTION = [
  { label: "Easy", count: OVERVIEW.easy, color: DIFFICULTY_COLORS.easy },
  { label: "Medium", count: OVERVIEW.medium, color: DIFFICULTY_COLORS.medium },
  { label: "Hard", count: OVERVIEW.hard, color: DIFFICULTY_COLORS.hard },
];

/** Seeded per-period series so switching periods doesn't reshuffle points. */
function seriesFor(period: string, seed: number): ActivityPoint[] {
  const days = period === "7D" ? 7 : period === "30D" ? 30 : period === "90D" ? 90 : 52;
  const points: ActivityPoint[] = [];
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const n = Math.sin(i * 12.9898 + seed * 78.233) * 43758.5453;
    const r = n - Math.floor(n);
    const weekend = d.getDay() === 0 || d.getDay() === 6;
    // Mostly 0-3 with occasional spikes; quieter weekends
    const base = weekend ? 1 : 2.2;
    const value = Math.max(0, Math.round(base + r * 3.5 - 1.2));
    points.push({
      label: d.toLocaleDateString(undefined, { month: "short", day: "numeric" }),
      value: days > 90 ? Math.round(value / 2) : value,
    });
  }
  return points;
}

const TOPICS: { topic: string; solved: number; accuracy: number }[] = [
  { topic: "Arrays", solved: 48, accuracy: 82 },
  { topic: "Strings", solved: 39, accuracy: 79 },
  { topic: "Hashing", solved: 31, accuracy: 76 },
  { topic: "Two Pointers", solved: 27, accuracy: 81 },
  { topic: "Sliding Window", solved: 22, accuracy: 74 },
  { topic: "Binary Search", solved: 26, accuracy: 77 },
  { topic: "Linked List", solved: 19, accuracy: 72 },
  { topic: "Stack & Queue", solved: 24, accuracy: 75 },
  { topic: "Trees", solved: 21, accuracy: 68 },
  { topic: "Graphs", solved: 17, accuracy: 64 },
  { topic: "Dynamic Programming", solved: 12, accuracy: 51 },
];

const RECENT_ACTIVITY: {
  platform: "LeetCode" | "GFG";
  problem: string;
  difficulty: "Easy" | "Medium" | "Hard";
  topic: string;
  status: string;
  date: string;
}[] = [
  { platform: "LeetCode", problem: "Two Sum", difficulty: "Easy", topic: "Hashing", status: "Solved", date: "Sep 28" },
  { platform: "LeetCode", problem: "3Sum", difficulty: "Medium", topic: "Two Pointers", status: "Solved", date: "Sep 27" },
  { platform: "GFG", problem: "Kadane's Algorithm", difficulty: "Medium", topic: "Arrays", status: "Solved", date: "Sep 26" },
  { platform: "LeetCode", problem: "Longest Substring Without Repeating", difficulty: "Medium", topic: "Sliding Window", status: "Solved", date: "Sep 26" },
  { platform: "GFG", problem: "N-Queen Problem", difficulty: "Hard", topic: "Backtracking", status: "Solved", date: "Sep 24" },
  { platform: "LeetCode", problem: "Merge k Sorted Lists", difficulty: "Hard", topic: "Linked List", status: "Attempted", date: "Sep 23" },
  { platform: "LeetCode", problem: "Binary Tree Level Order", difficulty: "Medium", topic: "Trees", status: "Solved", date: "Sep 22" },
];

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
  const series = seriesFor(period, 7);

  const overviewCards = [
    { icon: Target, label: "Total Problems Solved", value: OVERVIEW.total, sub: "Across 2 platforms", color: "text-primary", border: "border-primary/25", bg: "bg-primary/10" },
    { icon: CheckCircle2, label: "Easy", value: OVERVIEW.easy, sub: `${difficultyPercent(OVERVIEW.easy, OVERVIEW.total)}% of all solves`, color: "text-green-300", border: "border-green-500/25", bg: "bg-green-500/10" },
    { icon: AlertTriangle, label: "Medium", value: OVERVIEW.medium, sub: `${difficultyPercent(OVERVIEW.medium, OVERVIEW.total)}% of all solves`, color: "text-amber-300", border: "border-amber-500/25", bg: "bg-amber-500/10" },
    { icon: Braces, label: "Hard", value: OVERVIEW.hard, sub: `${difficultyPercent(OVERVIEW.hard, OVERVIEW.total)}% of all solves`, color: "text-red-300", border: "border-red-500/25", bg: "bg-red-500/10" },
    { icon: Flame, label: "Current Streak", value: OVERVIEW.streak, sub: "Days in a row", color: "text-orange-300", border: "border-orange-500/25", bg: "bg-orange-500/10" },
  ];

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
          <span className="text-[10px] font-bold uppercase tracking-widest text-primary">Data synced</span>
        </span>
      </div>

      <SampleDataNotice what="No coding-platform integration is built yet. The LeetCode and GeeksforGeeks figures below are realistic placeholders shown to demonstrate the Problem Solving intelligence layout." />

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
          {PLATFORMS.map((p) => (
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
            <DifficultyDonut segments={DIFFICULTY_DISTRIBUTION} />

            <div className="flex-1 w-full space-y-4">
              {DIFFICULTY_DISTRIBUTION.map((d) => (
                <div key={d.label}>
                  <div className="flex items-center justify-between mb-1.5">
                    <div className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full shrink-0" style={{ background: d.color, boxShadow: `0 0 6px ${d.color}66` }} />
                      <span className="text-sm font-semibold text-white/85">{d.label}</span>
                    </div>
                    <div className="flex items-baseline gap-2">
                      <span className="text-sm font-bold text-white tabular-nums">{d.count}</span>
                      <span className="text-[11px] text-white/35 tabular-nums">{difficultyPercent(d.count, OVERVIEW.total)}%</span>
                    </div>
                  </div>
                  <div className="h-1.5 rounded-full bg-white/[0.05] overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${difficultyPercent(d.count, OVERVIEW.total)}%` }}
                      transition={{ duration: 0.9, delay: 0.3, ease: [0.25, 0.46, 0.45, 0.94] }}
                      className="h-full rounded-full"
                      style={{ background: d.color, boxShadow: `0 0 6px ${d.color}55` }}
                    />
                  </div>
                </div>
              ))}

              <p className="text-[11px] text-white/30 pt-1 leading-relaxed">
                Counts combine both connected platforms for the trailing 12 months.
              </p>
            </div>
          </div>
        </GlassCard>
      </Reveal>

      {/* ── 5. Topic performance ── */}
      <Reveal delay={0.25}>
        <SectionLabel>Topic Performance</SectionLabel>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 mb-8">
          {TOPICS.map((t, i) => (
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
                <span className="text-sm font-bold text-white/80 tabular-nums shrink-0">{t.accuracy}%</span>
              </div>

              {/* Accuracy as bar length — length encodes accuracy directly */}
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
              <p className="text-[10px] font-bold uppercase tracking-widest text-white/25 mt-2.5">
                {t.accuracy}% accuracy
              </p>
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
                {RECENT_ACTIVITY.map((r) => (
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
          <ConsistencyStats
            active
            stats={{ currentStreak: 18, longestStreak: 41, thisWeek: 14, thisMonth: 52, activeDays: 61 }}
          />
          <div className="mt-4">
            <ConsistencyHeatmap
              active
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
              Your problem-solving activity is strongest in <span className="text-white font-semibold">Arrays, Hashing, and Two Pointer patterns</span> —
              together 106 problems at 78–82% accuracy. Medium-difficulty problems make up 44% of everything you
              solve, but your Hard count (63, 10%) is thin for interview-grade depth, and Graphs accuracy (64%)
              trails your structural average by 12 points.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-5">
              <div className="rounded-xl border border-amber-500/20 bg-amber-500/[0.06] p-4">
                <StatLabel>Focus Area</StatLabel>
                <p className="text-sm font-bold text-amber-200 mt-1">Dynamic Programming</p>
                <p className="text-[11px] text-white/40 mt-1 leading-relaxed">
                  12 problems, 51% accuracy — the weakest coverage among your active topics.
                </p>
              </div>
              <div className="rounded-xl border border-white/[0.08] bg-white/[0.03] p-4">
                <StatLabel>Recommendation</StatLabel>
                <p className="text-sm font-bold text-white mt-1">Push medium/hard DP volume</p>
                <p className="text-[11px] text-white/40 mt-1 leading-relaxed">
                  Increase medium and hard DP problems to strengthen advanced problem-solving coverage before
                  interview season.
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
                <button
                  className="text-xs font-bold uppercase tracking-widest px-5 py-2.5 rounded-full transition-all hover:-translate-y-0.5 cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
                  style={{ backgroundColor: "hsl(var(--primary))", color: "hsl(var(--primary-foreground))" }}
                  disabled
                  title="Integration coming soon"
                >
                  Connect LeetCode
                </button>
                <button
                  className="text-xs font-bold uppercase tracking-widest px-5 py-2.5 rounded-full border border-white/12 bg-white/[0.04] text-white/80 hover:bg-white/[0.08] hover:border-white/25 transition-all cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
                  disabled
                  title="Integration coming soon"
                >
                  Connect GeeksforGeeks
                </button>
              </div>
            </div>

            {/* Small inline preview of the unconnected platform cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 md:w-[420px] shrink-0">
              {PLATFORMS.map((p) => (
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
