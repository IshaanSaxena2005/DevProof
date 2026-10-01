import { useEffect, useRef } from "react";
import { animate, motion } from "motion/react";
import { AlertCircle } from "lucide-react";

/**
 * DevProof green ramp, dark-to-bright — mirrors the GitHub-style ramps already
 * used on Growth.tsx and the old ProblemSolving heatmap so the pages read as
 * one product. Index 0 is the empty cell.
 */
export const ACTIVITY_RAMP = [
  "rgba(255,255,255,0.05)",
  "rgba(22,255,0,0.14)",
  "rgba(22,255,0,0.32)",
  "rgba(22,255,0,0.55)",
  "rgba(22,255,0,0.85)",
];

export const DIFFICULTY_COLORS = {
  easy: "#4ade80",
  medium: "#fbbf24",
  hard: "#f87171",
} as const;

/**
 * Fade/slide-in used for every page section. The page re-mounts per route, so
 * plain initial/animate (no whileInView) stays correct when the user scrolls
 * without a viewport-tracked re-trigger.
 */
export function Reveal({
  children,
  delay = 0,
  className,
}: {
  children: React.ReactNode;
  delay?: number;
  className?: string;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 18 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, delay, ease: [0.25, 0.46, 0.45, 0.94] }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

/** Micro label above each section — same treatment as Developer360's SLabel. */
export function SectionLabel({
  children,
  right,
}: {
  children: React.ReactNode;
  right?: React.ReactNode;
}) {
  return (
    <div className="flex items-center justify-between gap-3 mb-4">
      <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-white/30">{children}</p>
      {right}
    </div>
  );
}

/** Uppercase stat label — shared across metric cards and platform cards. */
export function StatLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-[10px] font-bold uppercase tracking-widest text-white/35">{children}</p>
  );
}

/** Bordered amber callout, matching Developer360/Overview notice styling. */
export function PendingNotice({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex items-start gap-3 rounded-2xl border border-amber-400/20 bg-amber-400/[0.06] px-5 py-3.5">
      <AlertCircle className="w-4 h-4 text-amber-300 shrink-0 mt-0.5" />
      <p className="text-[12px] leading-relaxed text-amber-100/70">{children}</p>
    </div>
  );
}

/**
 * Counts a number up from zero on mount using motion's low-level animate(),
 * the same spring family the rest of the dashboard uses. Text updates happen
 * outside React state so forty cards can count without re-rendering the page.
 */
export function CountUp({ value, duration = 0.9 }: { value: number; duration?: number }) {
  const ref = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const controls = animate(0, value, {
      duration,
      ease: [0.25, 0.46, 0.45, 0.94],
      onUpdate: (v) => {
        if (ref.current) ref.current.textContent = Math.round(v).toLocaleString();
      },
    });
    return () => controls.stop();
  }, [value, duration]);

  return (
    <span ref={ref} className="tabular-nums">
      0
    </span>
  );
}
