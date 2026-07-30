import { AlertCircle, Loader2 } from "lucide-react";
import GlassCard from "./GlassCard";

/** Centered spinner for a whole panel or page section. */
export function LoadingBlock({ label = "Loading…" }: { label?: string }) {
  return (
    <GlassCard hover={false} className="flex flex-col items-center justify-center gap-3 p-12">
      <Loader2 className="w-5 h-5 animate-spin text-primary" />
      <p className="text-[13px]" style={{ color: "var(--text-tertiary)" }}>
        {label}
      </p>
    </GlassCard>
  );
}

/** Error panel with an optional retry. */
export function ErrorBlock({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return (
    <GlassCard hover={false} className="flex flex-col items-center gap-4 p-10 text-center">
      <div className="w-11 h-11 rounded-2xl border border-red-500/25 bg-red-500/[0.08] flex items-center justify-center">
        <AlertCircle className="w-5 h-5 text-red-400" />
      </div>
      <div>
        <h3 className="text-sm font-bold text-white uppercase tracking-wider mb-1.5">
          Could not load
        </h3>
        <p className="text-[13px] max-w-sm" style={{ color: "var(--text-secondary)" }}>
          {message}
        </p>
      </div>
      {onRetry && (
        <button
          onClick={onRetry}
          className="text-xs font-bold uppercase tracking-widest px-5 py-2.5 rounded-full border border-white/10 bg-white/[0.04] text-white/80 hover:bg-white/[0.08] hover:border-white/20 transition-all cursor-pointer"
        >
          Try again
        </button>
      )}
    </GlassCard>
  );
}

/**
 * Marks a panel whose numbers are illustrative because no endpoint backs it yet.
 * Prevents sample figures from reading as real analysis output.
 */
export function SampleDataNotice({ what }: { what: string }) {
  return (
    <div className="mb-5 flex items-start gap-3 rounded-2xl border border-amber-400/20 bg-amber-400/[0.06] px-5 py-3.5">
      <AlertCircle className="w-4 h-4 text-amber-300 shrink-0 mt-0.5" />
      <p className="text-[12px] leading-relaxed text-amber-100/70">
        <span className="font-semibold text-amber-200/90">Sample data.</span> {what} These figures
        are placeholders for layout purposes and are not derived from your repositories.
      </p>
    </div>
  );
}
