import { motion } from "motion/react";

/** Shared micro-label — same treatment as Developer360's SLabel. */
export function PPLabel({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <p className={`text-[11px] font-bold uppercase tracking-[0.2em] text-white/30 mb-4 ${className}`}>
      {children}
    </p>
  );
}

/** Uppercase stat label used inside cards. */
export function PPStatLabel({ children }: { children: React.ReactNode }) {
  return <p className="text-[10px] font-bold uppercase tracking-widest text-white/35">{children}</p>;
}

/** Fade/slide-in for sections — matches the Problem Solving page's Reveal. */
export function PPReveal({
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
