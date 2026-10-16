import type { ReactNode } from "react";
import { FlaskConical, Info } from "lucide-react";
import { DEMO_BADGE, SAMPLE_NOTICE } from "./sampleData.mts";

/**
 * The demo's two pieces of chrome.
 *
 * The badge is deliberately loud: a visitor must never mistake this profile for
 * their own data or for a real developer's. The notice is the quieter sibling for
 * pages where a specific section needs its own explanation.
 */

export function DemoBadge({ compact = false }: { compact?: boolean }) {
  return (
    <span
      title={SAMPLE_NOTICE}
      className="inline-flex items-center gap-1.5 rounded-full border border-primary/30 bg-primary/10 px-2.5 py-1 shrink-0"
    >
      <FlaskConical className="w-3 h-3 text-primary shrink-0" />
      <span className="text-[10px] font-bold uppercase tracking-widest text-primary whitespace-nowrap">
        {compact ? "Demo" : DEMO_BADGE}
      </span>
    </span>
  );
}

export function DemoNotice({ children, className = "" }: { children?: ReactNode; className?: string }) {
  return (
    <div
      className={`flex items-start gap-2.5 rounded-xl border border-primary/20 bg-primary/[0.05] px-4 py-3 ${className}`}
    >
      <Info className="w-3.5 h-3.5 text-primary shrink-0 mt-0.5" />
      <p className="text-[11px] leading-relaxed text-white/60">
        {children ?? SAMPLE_NOTICE}
      </p>
    </div>
  );
}
