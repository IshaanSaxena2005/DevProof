import { motion } from "motion/react";
import { CheckCircle2, Minus } from "lucide-react";

/** Fade/slide-in shared by all sections of this page. */
export function LAReveal({
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

/** Section micro-label — matches Developer360/PP label treatment. */
export function LALabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-white/30 mb-4">{children}</p>
  );
}

/** Uppercase micro-label inside cards. */
export function LAStatLabel({ children }: { children: React.ReactNode }) {
  return <p className="text-[10px] font-bold uppercase tracking-widest text-white/35">{children}</p>;
}

/** Status chip — the single source of truth for Available / Not available. */
export function EvidenceChip({ available, label }: { available: boolean; label: string }) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 text-[9px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-full border shrink-0 ${
        available
          ? "text-primary border-primary/25 bg-primary/10"
          : "text-white/35 border-white/10 bg-white/[0.03]"
      }`}
    >
      {available ? <CheckCircle2 className="w-2.5 h-2.5" /> : <Minus className="w-2.5 h-2.5" />}
      {label}
    </span>
  );
}
