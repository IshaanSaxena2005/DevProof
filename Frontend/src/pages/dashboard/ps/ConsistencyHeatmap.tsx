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

  // GitHub-style calendar weeks: the grid ends on today, and the start is
  // shifted back to the nearest Sunday, so every column is a real Sun..Sat
  // week. That is what makes the blocks read as "1 Jun → 7, 8 → 14, …":
  // each month's 1st begins a fresh column, the grid is 7 rows of weekdays,
  // and a column never straddles two week ranges.
  const rawStart = addUtcDays(today, -(weeks * 7 - 1));
  const start = addUtcDays(rawStart, -rawStart.getUTCDay());
  const totalDays = Math.round((today.getTime() - start.getTime()) / 86_400_000) + 1;
  const numWeeks = Math.ceil(totalDays / 7);

  // Check if any platform provides submission calendar data
  const hasCalendarData = Object.keys(activity).length > 0;

  const columns: (number | null)[][] = [];
  for (let w = 0; w < numWeeks; w++) {
    const col: (number | null)[] = [];
    for (let d = 0; d < 7; d++) {
      const date = addUtcDays(start, w * 7 + d);
      // Row order is Sun..Sat to match the day labels. Days after today are
      // rendered as empty placeholders, never as zero-activity days — the
      // grid ends on today, so no future day is shown.
      const future = date.getTime() > today.getTime();
      col.push(
        future
          ? null
          : active && hasCalendarData
            ? levelForCount(activity[utcDayKey(date)] ?? 0)
            : 0
      );
    }
    columns.push(col);
  }

  // Weekday labels are now fixed by construction: column rows are always
  // Sun..Sat (each column starts on a Sunday), so labels never drift. Show
  // only Mon, Wed, Fri to keep the label column sparse and readable.
  const dayLabels: (string | null)[] = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((d) =>
    ["Mon", "Wed", "Fri"].includes(d) ? d : ""
  );

  // Month labels above the week column that contains the month's 1st — the
  // same anchor GitHub uses, so "Jun" sits over the 1 Jun → 7 block.
  const monthMarks: { index: number; label: string }[] = [];
  columns.forEach((_, idx) => {
    for (let d = 0; d < 7; d++) {
      const date = addUtcDays(start, idx * 7 + d);
      if (date.getTime() <= today.getTime() && date.getUTCDate() === 1) {
        monthMarks.push({ index: idx, label: formatUtcDay(date, { month: "short" }) });
        break;
      }
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
          <div className="ps-heatmap-grid">
            {!active || !hasCalendarData ? (
              <div className="flex items-center justify-center py-12">
                <p className="text-[12px] text-white/40">
                  {!active ? "Connect a platform to see your activity history" : "No submission calendar data available from connected platforms"}
                </p>
              </div>
            ) : (
              <>
                {/* Month labels — positioned above their week columns */}
                <div className="ps-heatmap-months">
                  {columns.map((_, idx) => {
                    const mark = monthMarks.find((m) => m.index === idx);
                    return (
                      <div key={idx} className="ps-heatmap-month">
                        {mark && (
                          <span className="ps-heatmap-month-label">{mark.label}</span>
                        )}
                      </div>
                    );
                  })}
                </div>

                <div className="ps-heatmap-body">
                  {/* Day labels — computed from the actual first column's weekday */}
                  <div className="ps-heatmap-day-labels">
                    {dayLabels.map((d, i) => (
                      <div key={i} className="ps-heatmap-day-label">
                        {d && <span className="ps-heatmap-day-label-text">{d}</span>}
                      </div>
                    ))}
                  </div>

                  {/* Cells — one calendar week per column, evenly stretched */}
                  <div className="ps-heatmap-cells">
                    {columns.map((col, ci) => (
                      <div key={ci} className="ps-heatmap-week">
                        {col.map((level, ri) => {
                          const date = addUtcDays(start, ci * 7 + ri);
                          const key = utcDayKey(date);
                          const count = activity[key] ?? 0;
                          return (
                            <motion.div
                              key={ri}
                              initial={{ opacity: 0, scale: 0.5 }}
                              animate={{ opacity: 1, scale: 1 }}
                              transition={{ duration: 0.25, delay: 0.05 + ci * 0.008 + ri * 0.004 }}
                              className="ps-heatmap-cell"
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
                </div>

                {/* Legend — aligned to bottom-right of the grid area */}
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
