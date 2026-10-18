import { Flame, CalendarDays, Zap, CalendarRange, Activity } from "lucide-react";
import { motion } from "motion/react";
import GlassCard from "../../../components/GlassCard";
import { Reveal } from "./shared";
import { ACTIVITY_RAMP } from "./shared";
import { addUtcDays, formatUtcDay, utcDayKey, utcToday } from "./activityDays.mts";

/**
 * GitHub-style heatmap of recorded submissions per day, NOT commits and not
 * distinct problems solved. The grid ends on today, so no future day is shown.
 */
/** Submissions on a day mapped onto the 0..4 intensity ramp. */
function levelForCount(count: number) {
  if (count <= 0) return 0;
  if (count === 1) return 1;
  if (count <= 3) return 2;
  if (count <= 6) return 3;
  return 4;
}

export default function ConsistencyHeatmap({
  weeks = 26,
  active = true,
  footerNote,
  activity,
}: {
  weeks?: number;
  /** False renders an all-empty grid — no platform connected yet. */
  active?: boolean;
  footerNote?: string;
  /**
   * Real activity as ISO date -> submissions that day. Always supplied by the
   * page (an unconnected user renders an all-empty grid); there is no seeded
   * preview fallback — cells only ever reflect real submission data.
   */
  activity: Record<string, number>;
}) {
  // UTC days, matching the stored calendar keys and the chart and consistency
  // windows on this page (see activityDays.mts). A local-day grid would look up
  // the wrong cell for anyone who is not on UTC.
  const today = utcToday();
  const totalDays = weeks * 7;
  const cells: (number | null)[] = [];

  // Check if any platform provides submission calendar data
  const hasCalendarData = Object.keys(activity).length > 0;

  for (let i = 0; i < totalDays; i++) {
    // The grid ends on today, so it spans exactly `totalDays` past days.
    const date = addUtcDays(today, -(totalDays - 1 - i));
    const key = utcDayKey(date);
    // Only show data if platform is connected AND provides calendar data
    cells.push(active && hasCalendarData ? levelForCount(activity[key] ?? 0) : 0);
  }

  // Group into weeks of 7 for column layout
  const columns: (number | null)[][] = [];
  for (let w = 0; w < weeks; w++) {
    columns.push(cells.slice(w * 7, w * 7 + 7));
  }

  // Compute weekday labels from the actual first column's weekday so the labels
  // always match the rows regardless of what day the grid starts on.
  const firstCellDate = addUtcDays(today, -(totalDays - 1));
  const firstWeekday = firstCellDate.getUTCDay(); // 0=Sun .. 6=Sat
  const DAY_LABELS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  const dayLabels: (string | null)[] = [];
  for (let i = 0; i < 7; i++) {
    const actualDay = (firstWeekday + i) % 7;
    // Show only Mon, Wed, Fri, Sun — skip Tue, Thu, Sat to keep the labels
    // sparse and readable, matching the original intent.
    dayLabels.push(["Mon", "Wed", "Fri", "Sun"].includes(DAY_LABELS[actualDay])
      ? DAY_LABELS[actualDay]
      : "");
  }

  // Month labels above the first week of each month
  const monthMarks: { index: number; label: string }[] = [];
  let lastMonth = -1;
  columns.forEach((col, idx) => {
    const firstReal = col.find((c) => c !== null);
    if (firstReal === undefined) return;
    const cellIndex = col.indexOf(firstReal);
    const date = addUtcDays(today, -(totalDays - 1 - (idx * 7 + cellIndex)));
    if (date.getUTCMonth() !== lastMonth) {
      lastMonth = date.getUTCMonth();
      monthMarks.push({ index: idx, label: formatUtcDay(date, { month: "short" }) });
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
            <h3 className="text-xs font-bold text-white/70 truncate">
              Problem-Solving Activity
            </h3>
          </div>
          <span className="text-[10px] font-semibold uppercase tracking-widest text-white/25 shrink-0">
            Last {weeks} weeks
          </span>
        </div>

        <div className="overflow-x-auto main-scroll pb-1">
          <div className="min-w-max">
            {!active || !hasCalendarData ? (
              <div className="flex items-center justify-center py-12">
                <p className="text-[12px] text-white/40">
                  {!active ? "Connect a platform to see your activity history" : "No submission calendar data available from connected platforms"}
                </p>
              </div>
            ) : (
              <>
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
                  {/* Day labels — computed from the actual first column's weekday */}
                  <div className="flex flex-col gap-[3px] pr-1.5 shrink-0">
                    {dayLabels.map((d, i) => (
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
                        const date = addUtcDays(today, -(totalDays - 1 - idx));
                        const key = utcDayKey(date);
                        const count = activity[key] ?? 0;
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
                                : `${formatUtcDay(date, { month: "short", day: "numeric", year: "numeric" })} — ${count} submission${count === 1 ? "" : "s"}`
                            }
                          />
                        );
                      })}
                    </div>
                  ))}

                </div>

                {/* Legend */}
                <div className="flex items-center justify-end gap-1.5 mt-3">
                  <span className="text-[9px] text-white/25 mr-1">Less</span>
                  {ACTIVITY_RAMP.map((c) => (
                    <span key={c} className="w-3 h-3 rounded-[3px]" style={{ background: c }} />
                  ))}
                  <span className="text-[9px] text-white/25 ml-1">More</span>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Footer notes rendered outside the scroll container so they are never
            clipped on mobile, while the heatmap grid itself can still scroll. */}
        {footerNote && (
          <p className="text-[11px] text-white/30 mt-4 leading-relaxed">{footerNote}</p>
        )}
        {!hasCalendarData && active && (
          <p className="text-[11px] text-white/30 mt-4 leading-relaxed">
            Connected platforms do not provide submission calendar data. The heatmap requires platforms like LeetCode that publish daily submission history.
          </p>
        )}
      </div>
    </GlassCard>
  );
}

/** The five consistency stats shown beside the heatmap. */
export function ConsistencyStats({
  stats,
  active = true,
  hasCalendarData = true,
}: {
  stats: { currentStreak: number; longestStreak: number; thisWeek: number; thisMonth: number; activeDays: number };
  active?: boolean;
  hasCalendarData?: boolean;
}) {
  const items = [
    { icon: Flame, label: "Current Streak", value: active && hasCalendarData ? `${stats.currentStreak} days` : "—" },
    { icon: Zap, label: "Longest Streak", value: active && hasCalendarData ? `${stats.longestStreak} days` : "—" },
    // The calendar counts submissions, so these two do as well — a week in which
    // one problem was submitted four times reads as four, not one.
    { icon: CalendarDays, label: "This Week", value: active && hasCalendarData ? `${stats.thisWeek} submissions` : "—" },
    { icon: CalendarRange, label: "This Month", value: active && hasCalendarData ? `${stats.thisMonth} submissions` : "—" },
    // No platform publishes an all-time active-day window, so the raw count of
    // recorded active days is shown without an invented "of N" denominator.
    { icon: Activity, label: "Active Days", value: active && hasCalendarData ? `${stats.activeDays}` : "—" },
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
