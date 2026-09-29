import { motion } from "motion/react";
import { Briefcase, GraduationCap, Braces, CheckCircle2, Minus, AlertCircle } from "lucide-react";

export type CoverageState = "available" | "awaiting" | "missing";

/**
 * Status chip copy is deliberately literal: "available" means a real source
 * exists today; "awaiting" means the source (resume/LinkedIn) hasn't been
 * provided yet; "missing" means no backend source exists at all.
 */
const CHIP: Record<CoverageState, { label: string; cls: string; dot: string }> = {
  available: { label: "Available", cls: "text-primary border-primary/25 bg-primary/10", dot: "bg-primary" },
  awaiting: { label: "Awaiting source", cls: "text-amber-300 border-amber-400/25 bg-amber-400/10", dot: "bg-amber-400" },
  missing: { label: "Not available", cls: "text-white/35 border-white/10 bg-white/[0.03]", dot: "bg-white/25" },
};

export default function EvidenceCoverage({
  items,
}: {
  items: { icon: "linkedin" | "resume" | "experience" | "education" | "skills"; name: string; state: CoverageState; note: string }[];
}) {
  const icons = { linkedin: null, resume: null, experience: Briefcase, education: GraduationCap, skills: Braces };
  const glyphs = { linkedin: "in", resume: "CV" };

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
      {items.map((item, i) => {
        const chip = CHIP[item.state];
        const Icon = icons[item.icon];
        return (
          <motion.div
            key={item.name}
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.05 * i, duration: 0.4 }}
            className="relative rounded-2xl border border-white/[0.08] bg-white/[0.03] backdrop-blur-sm p-5 flex flex-col gap-3 overflow-hidden"
          >
            <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/[0.10] to-transparent pointer-events-none" />

            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-9 h-9 rounded-lg border border-white/10 bg-white/[0.04] flex items-center justify-center text-white/50 shrink-0">
                  {Icon ? (
                    <Icon className="w-4 h-4" />
                  ) : (
                    <span className="text-[10px] font-bold tracking-wider" aria-hidden="true">
                      {glyphs[item.icon as "linkedin" | "resume"]}
                    </span>
                  )}
                </div>
                <h3 className="text-sm font-semibold text-white/85 truncate">{item.name}</h3>
              </div>

              <span className={`inline-flex items-center gap-1.5 text-[9px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-full border shrink-0 ${chip.cls}`}>
                <span className={`w-1 h-1 rounded-full ${chip.dot}`} />
                {chip.label}
              </span>
            </div>

            <p className="text-[12px] text-white/40 leading-relaxed flex items-start gap-2">
              {item.state === "missing" ? (
                <Minus className="w-3 h-3 mt-0.5 shrink-0 text-white/25" />
              ) : (
                <AlertCircle className="w-3 h-3 mt-0.5 shrink-0 opacity-40" />
              )}
              {item.note}
            </p>
          </motion.div>
        );
      })}
    </div>
  );
}

/** Small check row for sources that already contribute evidence. */
export function CoverageDone({ text }: { text: string }) {
  return (
    <p className="flex items-center gap-2 text-[12px] text-primary/80">
      <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
      {text}
    </p>
  );
}
