import { motion } from "motion/react";
import { BookOpen, Trophy, Sparkles, CircleDashed } from "lucide-react";
import GlassCard from "../../../components/GlassCard";
import { LAStatLabel } from "./shared";

/** Shared empty-section anatomy: icon tile, title, explanation, muted CTA. */
function SectionEmpty({
  icon,
  title,
  description,
  cta,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
  cta: string;
}) {
  return (
    <GlassCard hover={false} className="flex flex-col items-center gap-3 py-10 text-center relative overflow-hidden">
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/[0.10] to-transparent pointer-events-none" />
      <div className="w-11 h-11 rounded-2xl border border-white/10 bg-white/[0.03] flex items-center justify-center text-white/40 relative">
        {icon}
      </div>
      <h3 className="text-sm font-bold text-white uppercase tracking-wider">{title}</h3>
      <p className="text-[12px] max-w-md leading-relaxed" style={{ color: "var(--text-secondary)" }}>
        {description}
      </p>
      <button
        disabled
        title="Coming soon"
        className="mt-1 text-xs font-bold uppercase tracking-widest px-5 py-2.5 rounded-full border border-white/10 bg-white/[0.03] text-white/35 cursor-not-allowed"
      >
        {cta} — coming soon
      </button>
    </GlassCard>
  );
}

export function CoursesEmpty() {
  return (
    <SectionEmpty
      icon={<BookOpen className="w-5 h-5" />}
      title="No courses added yet"
      description="Add your learning history to connect your skills with the knowledge behind them. Course records will show platform, progress, and certificate availability."
      cta="Add course"
    />
  );
}

export function HackathonsEmpty() {
  return (
    <SectionEmpty
      icon={<Trophy className="w-5 h-5" />}
      title="No hackathon experiences added yet"
      description="Competitive projects and hackathons can strengthen the evidence behind your engineering experience — placements, teams, and project links included."
      cta="Add hackathon"
    />
  );
}

/**
 * Skills-derived-from-learning panel. Skill chips render only from real skill
 * data (user-recorded or repository-derived) — never invented course topics.
 * With no learning records there is nothing to attribute, so the section
 * explains the future flow instead of listing anything.
 */
export function SkillsFromLearning({
  skills,
  loading,
}: {
  skills: { id: string; name: string; sources: number }[];
  loading: boolean;
}) {
  if (loading) {
    return (
      <GlassCard hover={false} className="p-6">
        <div className="h-4 w-40 rounded bg-white/[0.05] mb-4" aria-hidden="true" />
        <div className="flex gap-2.5">
          {[0, 1, 2].map((i) => (
            <div key={i} className="h-9 w-24 rounded-xl bg-white/[0.04]" aria-hidden="true" />
          ))}
        </div>
      </GlassCard>
    );
  }

  if (skills.length === 0) {
    return (
      <GlassCard hover={false} className="p-6 md:p-7 relative overflow-hidden">
        <div className="flex items-center gap-2.5 mb-3">
          <Sparkles className="w-4 h-4 text-primary" />
          <h3 className="text-sm font-bold text-white uppercase tracking-wider">Skills Developed</h3>
        </div>
        <p className="text-[13px] leading-relaxed max-w-2xl" style={{ color: "var(--text-secondary)" }}>
          Once courses, certifications, and hackathon projects are recorded, DevProof connects them
          to your skill profile — showing which skills each learning source supports and how the
          evidence adds up. Your repository-derived skills are available on the Skills page today.
        </p>
        <div className="grid grid-cols-3 items-center gap-2 mt-5 max-w-lg">
          <div className="rounded-xl border border-white/[0.07] bg-white/[0.02] px-3 py-2.5 text-center">
            <LAStatLabel>Learning</LAStatLabel>
          </div>
          <p className="text-white/20 text-center text-lg leading-none">→</p>
          <div className="rounded-xl border border-primary/25 bg-primary/[0.06] px-3 py-2.5 text-center">
            <LAStatLabel>Skills</LAStatLabel>
          </div>
        </div>
      </GlassCard>
    );
  }

  return (
    <div className="flex flex-wrap gap-2.5">
      {skills.map((s) => (
        <div
          key={s.id}
          className="flex items-center gap-2.5 px-4 py-2.5 rounded-xl border border-white/[0.08] bg-white/[0.03]"
        >
          <span className="text-sm font-semibold text-white/80">{s.name}</span>
          <span className="text-[9px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-full border border-primary/25 bg-primary/10 text-primary">
            {s.sources} {s.sources === 1 ? "source" : "sources"}
          </span>
        </div>
      ))}
    </div>
  );
}

/* ── Learning timeline ── */

export interface TimelineEvent {
  date: string | null;
  /** Issuer for certifications, platform for hackathons, etc. */
  context?: string | null;
  title: string;
}

/**
 * Vertical growth record of real events only. When the list is empty the
 * section renders its explained placeholder instead of fabricated history.
 */
export function LearningTimeline({ events }: { events: TimelineEvent[] }) {
  if (events.length === 0) {
    return (
      <GlassCard hover={false} className="p-6 md:p-8">
        <div className="flex flex-col items-center text-center gap-3 py-6">
          <div className="w-11 h-11 rounded-2xl border border-white/10 bg-white/[0.03] flex items-center justify-center text-white/35">
            <CircleDashed className="w-5 h-5" />
          </div>
          <h3 className="text-sm font-bold text-white uppercase tracking-wider">
            Your learning timeline will appear here
          </h3>
          <p className="text-[12px] max-w-md leading-relaxed" style={{ color: "var(--text-secondary)" }}>
            As credentials and achievements are added, DevProof builds a chronological growth record
            from them — courses, certifications, hackathons, and milestones in one line.
          </p>
        </div>
      </GlassCard>
    );
  }

  const sorted = [...events]
    .sort((a, b) => (b.date ?? "").localeCompare(a.date ?? ""))
    .slice(0, 8);

  return (
    <div className="relative pl-5">
      {/* Spine */}
      <div className="absolute left-[5px] top-2 bottom-2 w-px bg-gradient-to-b from-primary/40 via-white/[0.08] to-transparent" />
      <div className="space-y-5">
        {sorted.map((e, i) => (
          <motion.div
            key={`${e.title}-${i}`}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.08 * i, duration: 0.4 }}
            className="relative"
          >
            <span className="absolute -left-5 top-1.5 w-2.5 h-2.5 rounded-full bg-primary shadow-[0_0_8px_rgba(22,255,0,0.5)]" />
            <div className="flex flex-wrap items-baseline gap-x-3">
              <span className="text-[10px] font-bold uppercase tracking-widest text-white/35 tabular-nums">
                {e.date ? new Date(e.date).toLocaleDateString(undefined, { month: "short", year: "numeric" }) : "Undated"}
              </span>
              {e.context && <span className="text-[11px] text-white/40">{e.context}</span>}
            </div>
            <p className="text-sm font-semibold text-white/85 mt-0.5">{e.title}</p>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
