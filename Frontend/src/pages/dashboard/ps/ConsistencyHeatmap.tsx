import { Flame, CalendarDays, Zap, CalendarRange, Activity } from "lucide-react";
import { motion } from "motion/react";
import GlassCard from "../../../components/GlassCard";
import { Reveal } from "./shared";
import { ACTIVITY_RAMP } from "./shared";

/** Deterministic pseudo-random from a seed, so previews don't reshuffle per render. */
function seeded(n: number, seed: number) {
  const x = Math.sin(n * 12.9898 + seed * 78.233) * 43758.5453;
  return x - Math.floor(x);
}

function levelFor(n: number, seed: number, max: number) {
  const r = seeded(n, seed);
  if (r > 0.72) return max;
  if (r > 0.5) return max - 1;
  if (r > 0.28) return max - 2;
  if (r > 0.1) return 1;
  return 0;
}

/**
 * GitHub-style heatmap of problem-solving activity (days solved problems), NOT
 * commits. Trailing weeks of the current month render as empty cells, like
 * GitHub does for future dates.
 */
export default function ConsistencyHeatmap({
  seed,
  weeks = 26,
  active = true,
  footerNote,
}: {
  seed: number;
  weeks?: number;
  /** False renders an all-empty grid — no platform connected yet. */
  active?: boolean;
  footerNote?: string;
}) {
  const today = new Date();
  const totalDays = weeks * 7;
  // Grid starts (weeks*7 - 1) days ago, aligned so the last column is the current week.
  const dayOffset = (today.getDay() + 6) % 7; // Monday-first column index of today
  const cells: (number | null)[] = [];

  for (let i = 0; i < totalDays; i++) {
    const daysAgo = totalDays - 1 - i;
    const date = new Date(today);
    date.setDate(today.getDate() - daysAgo);
    // Cells after today stay empty
    if (daysAgo < 0) {
      cells.push(null);
      continue;
    }
    // Weekends trend quieter, like real practice patterns
    const weekend = date.getDay() === 0 || date.getDay() === 6;
    cells.push(active ? levelFor(i, seed, weekend ? 3 : 4) : 0);
  }

  // Group into weeks of 7 for column layout
  const columns: (number | null)[][] = [];
  for (let w = 0; w < weeks; w++) {
    columns.push(cells.slice(w * 7, w * 7 + 7));
  }

  // Month labels above the first week of each month
  const monthMarks: { index: number; label: string }[] = [];
  let lastMonth = -1;
  columns.forEach((col, idx) => {
    const firstReal = col.find((c) => c !== null);
    if (firstReal === undefined) return;
    const cellIndex = col.indexOf(firstReal);
    const daysAgo = totalDays - 1 - (idx * 7 + cellIndex);
    const date = new Date(today);
    date.setDate(today.getDate() - Math.max(daysAgo, 0));
    if (date.getMonth() !== lastMonth) {
      lastMonth = date.getMonth();
      monthMarks.push({ index: idx, label: date.toLocaleString(undefined, { month: "short" }) });
    }
  });

  return (
    <GlassCard hover={false} className="p-6 relative overflow-hidden">
      <div
        className="absolute inset-0 pointer-events-none"
        style={{ background: "radial-gradient(ellipse at 90% 0%, rgba(119,252,117,0.05) 0%, transparent 55%)" }}
      />
      <div className="relative">
        <div className="flex items-center justify-between mb-5 gap-3">
          <div className="flex items-center gap-2 min-w-0">
            <CalendarDays className="w-3.5 h-3.5 text-primary shrink-0" />
            <h3 className="text-xs font-bold text-white/70 uppercase tracking-wider truncate">
              Problem-Solving Activity
            </h3>
          </div>
          <span className="text-[10px] font-semibold uppercase tracking-widest text-white/25 shrink-0">
            Last {weeks} weeks
          </span>
        </div>

        <div className="overflow-x-auto main-scroll pb-1">
          <div className="min-w-max">
            {/* Month labels */}
            <div className="flex gap-[3px] mb-1.5">
              {columns.map((_, idx) => {
                const mark = monthMarks.find((m) => m.index === idx);
                return (
                  <div key={idx} className="w-3 shrink-0 relative">
                    {mark && (
                      <span className="absolute left-0 top-0 text-[9px] font-semibold text-white/30 whitespace-nowrap">
                        {mark.label}
                      </span>
                    )}
                  </div>
                );
              })}
            </div>

            <div className="flex gap-[3px]">
              {/* Day labels */}
              <div className="flex flex-col gap-[3px] pr-1.5 shrink-0">
                {["Mon", "", "Wed", "", "Fri", "", "Sun"].map((d, i) => (
                  <div key={i} className="w-6 h-3 flex items-center">
                    <span className="text-[9px] font-medium text-white/25 leading-none">{d}</span>
                  </div>
                ))}
              </div>

              {/* Cells */}
              {columns.map((col, ci) => (
                <div key={ci} className="flex flex-col gap-[3px]">
                  {col.map((level, ri) => {
                    const idx = ci * 7 + ri;
                    const date = new Date(today);
                    date.setDate(today.getDate() - (totalDays - 1 - idx));
                    return (
                      <motion.div
                        key={ri}
                        initial={{ opacity: 0, scale: 0.5 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ duration: 0.25, delay: 0.05 + ci * 0.008 + ri * 0.004 }}
                        className="w-3 h-3 rounded-[3px] shrink-0 hover:ring-1 hover:ring-white/30 transition-shadow"
                        style={{ background: level === null ? "transparent" : ACTIVITY_RAMP[level] }}
                        title={
                          level === null
                            ? "No data"
                            : `${date.toLocaleDateString(undefined, { month: "short", day: "numeric" })} — activity level ${level}/4`
                        }
                      />
                    );
                  })}
                </div>
              ))}

              {/* "future" tail: fold dayOffset into right edge by leaving nulls (already handled) */}
              <span className="sr-only">{dayOffset /* keeps Mon-first alignment intent explicit */}</span>
            </div>

            {/* Legend */}
            <div className="flex items-center justify-end gap-1.5 mt-3">
              <span className="text-[9px] text-white/25 mr-1">Less</span>
              {ACTIVITY_RAMP.map((c) => (
                <span key={c} className="w-3 h-3 rounded-[3px]" style={{ background: c }} />
              ))}
              <span className="text-[9px] text-white/25 ml-1">More</span>
            </div>

            {footerNote && (
              <p className="text-[11px] text-white/30 mt-4 leading-relaxed">{footerNote}</p>
            )}
          </div>
        </div>
      </div>
    </GlassCard>
  );
}

/** The five consistency stats shown beside the heatmap. */
export function ConsistencyStats({
  stats,
  active = true,
}: {
  stats: { currentStreak: number; longestStreak: number; thisWeek: number; thisMonth: number; activeDays: number };
  active?: boolean;
}) {
  const items = [
    { icon: Flame, label: "Current Streak", value: active ? `${stats.currentStreak} days` : "—" },
    { icon: Zap, label: "Longest Streak", value: active ? `${stats.longestStreak} days` : "—" },
    { icon: CalendarDays, label: "This Week", value: active ? `${stats.thisWeek} problems` : "—" },
    { icon: CalendarRange, label: "This Month", value: active ? `${stats.thisMonth} problems` : "—" },
    { icon: Activity, label: "Active Days", value: active ? `${stats.activeDays} of 90` : "—" },
  ];

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
      {items.map((item, i) => (
        <Reveal key={item.label} delay={0.05 * i}>
          <div className="rounded-xl border border-white/[0.07] bg-white/[0.03] px-4 py-3.5 h-full">
            <div className="flex items-center gap-2 mb-1.5">
              <item.icon className={`w-3.5 h-3.5 ${active && i === 0 ? "text-primary" : "text-white/40"}`} />
              <span className="text-[9px] font-bold uppercase tracking-widest text-white/35">{item.label}</span>
            </div>
            <p className="text-sm font-bold text-white tabular-nums">{item.value}</p>
          </div>
        </Reveal>
      ))}
    </div>
  );
}
