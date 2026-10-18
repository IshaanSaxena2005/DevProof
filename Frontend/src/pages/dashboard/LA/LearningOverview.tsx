import { BookOpen, Award, Trophy, Activity, Plus } from "lucide-react";
import { motion } from "motion/react";
import GlassCard from "../../../components/GlassCard";
import { LAStatLabel } from "./shared";

export interface OverviewMetric {
  icon: "courses" | "certifications" | "hackathons" | "activity";
  label: string;
  /** null renders an em-dash: nothing measured, not zero. */
  value: number | null;
  sub: string;
}

const ICONS = {
  courses: BookOpen,
  certifications: Award,
  hackathons: Trophy,
  activity: Activity,
};

/**
 * Compact overview metrics. Values come only from real data; null renders as
 * an em-dash so absence is never styled as a measured zero.
 */
export function OverviewMetrics({ metrics }: { metrics: OverviewMetric[] }) {
  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {metrics.map((m, i) => {
        const Icon = ICONS[m.icon];
        const value = m.value;
        const hasValue = value !== null;
        return (
          <motion.div
            key={m.label}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.05 * i, duration: 0.4 }}
            whileHover={{ y: -3 }}
            className="glass-panel p-5 relative overflow-hidden"
          >
            <div className="w-9 h-9 rounded-xl border border-primary/25 bg-primary/10 flex items-center justify-center text-primary mb-4">
              <Icon className="w-4 h-4" />
            </div>
            <p className="text-[26px] leading-none font-extrabold text-white tracking-tight tabular-nums">
              {hasValue ? value.toLocaleString() : "—"}
            </p>
            <p className="text-[10px] font-bold uppercase tracking-widest text-white/35 mt-2.5">{m.label}</p>
            <p className="text-[12px] text-white/30 mt-0.5">{m.sub}</p>
          </motion.div>
        );
      })}
    </div>
  );
}

/**
 * Learning-overview panel. Course creation is live against /courses, so the
 * CTA opens the same form the Courses section uses; stats stay em-dashes
 * until backed by data, and learning hours / study streaks have no source.
 */
export function LearningOverviewPanel({
  onAddCourse,
  completedCount,
  inProgressCount,
}: {
  onAddCourse?: () => void;
  /** Real counts; null while loading or when course tracking is unconnected. */
  completedCount?: number | null;
  inProgressCount?: number | null;
}) {
  return (
    <GlassCard hover={false} className="p-6 md:p-8 relative overflow-hidden">
      <div
        className="absolute inset-0 pointer-events-none"
        style={{ background: "radial-gradient(ellipse at 15% 0%, rgba(119,252,117,0.05) 0%, transparent 55%)" }}
      />
      <div className="relative flex flex-col md:flex-row md:items-center gap-6">
        <div className="flex-1 min-w-0">
          <h3 className="text-base font-bold text-white tracking-tight mb-1.5">
            {completedCount == null || inProgressCount == null
              ? "Your course record is loading…"
              : completedCount + inProgressCount > 0
                ? "Your coursework at a glance"
                : "No coursework recorded yet"}
          </h3>
          <p className="text-[13px] leading-relaxed max-w-xl" style={{ color: "var(--text-secondary)" }}>
            Courses you add below are stored in DevProof, and the skills you list for them can be
            promoted on the Skills page. Certifications you record already count toward your
            profile, and learning hours and study streaks have no source yet, so they stay blank
            rather than estimated.
          </p>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-5">
            {[
              { label: "Courses Completed", value: completedCount ?? null },
              { label: "Currently Learning", value: inProgressCount ?? null },
              { label: "Learning Hours", value: null },
              { label: "Study Streak", value: null },
            ].map((box) => (
              <div key={box.label} className="rounded-xl border border-white/[0.07] bg-white/[0.02] px-3.5 py-3">
                <LAStatLabel>{box.label}</LAStatLabel>
                {box.value != null ? (
                  <p className="text-sm font-bold text-white mt-1.5 tabular-nums">{box.value}</p>
                ) : (
                  <p className="text-sm font-bold text-white/25 mt-1.5">—</p>
                )}
              </div>
            ))}
          </div>
        </div>

        {onAddCourse ? (
          <button
            onClick={onAddCourse}
            className="shrink-0 inline-flex items-center justify-center gap-2 text-xs font-bold uppercase tracking-widest px-5 py-2.5 rounded-full border border-primary/30 bg-primary/10 text-primary hover:bg-primary/20 hover:border-primary/50 transition-all cursor-pointer hover:-translate-y-0.5"
          >
            <Plus className="w-3.5 h-3.5" /> Add course
          </button>
        ) : (
          <button
            disabled
            title="Course form is not available on this view"
            className="shrink-0 inline-flex items-center justify-center gap-2 text-xs font-bold uppercase tracking-widest px-5 py-2.5 rounded-full border border-white/10 bg-white/[0.03] text-white/35 cursor-not-allowed"
          >
            <Plus className="w-3.5 h-3.5" /> Add course
          </button>
        )}
      </div>
    </GlassCard>
  );
}
