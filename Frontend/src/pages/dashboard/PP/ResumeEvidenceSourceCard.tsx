import GlassCard from "../../../components/GlassCard";
import { ResumeGlyph } from "./icons";

export function ResumeEvidenceSourceCard({
  title,
  purpose,
  state,
  stateLabel,
  cta,
  onCta,
  footer,
}: {
  title: string;
  purpose: string;
  /** connected = uploaded; empty = not yet uploaded. */
  state: "connected" | "empty";
  stateLabel: string;
  cta: string;
  onCta?: () => void;
  footer?: React.ReactNode;
}) {
  const statusStyles: Record<typeof state, string> = {
    connected: "border-primary/25 bg-primary/10 text-primary",
    empty: "border-white/10 bg-white/[0.04] text-white/40",
  };
  const statusDot: Record<typeof state, string> = {
    connected: "bg-primary",
    empty: "bg-white/25",
  };

  return (
    <GlassCard className="p-6 md:p-7 relative overflow-hidden h-full flex flex-col">
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/[0.12] to-transparent pointer-events-none" />
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            state === "connected"
              ? "radial-gradient(ellipse at 85% -10%, rgba(119,252,117,0.08) 0%, transparent 55%)"
              : "none",
        }}
      />

      <div className="relative flex flex-col gap-5 h-full">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-3.5 min-w-0">
            <div
              className="w-11 h-11 rounded-xl border flex items-center justify-center shrink-0"
              style={{
                borderColor:
                  state === "connected"
                    ? "rgba(119,252,117,0.33)"
                    : "rgba(255,255,255,0.1)",
                background:
                  state === "connected"
                    ? "rgba(119,252,117,0.08)"
                    : "rgba(255,255,255,0.03)",
                color:
                  state === "connected"
                    ? "#77fc75"
                    : "rgba(255,255,255,0.35)",
              }}
            >
              <ResumeGlyph className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <h3 className="text-base font-bold text-white tracking-tight">{title}</h3>
              <p className="text-[12px] text-white/40 leading-snug">{purpose}</p>
            </div>
          </div>

          <span
            className={`inline-flex items-center gap-1.5 text-[9px] font-bold uppercase tracking-widest px-2.5 py-1 rounded-full border shrink-0 ${statusStyles[state]}`}
          >
            <span className={`w-1.5 h-1.5 rounded-full ${statusDot[state]}`} />
            {stateLabel}
          </span>
        </div>

        {state === "connected" ? (
          <div className="flex-1">{footer}</div>
        ) : (
          <button
            onClick={onCta}
            className="w-full flex items-center justify-center gap-2 text-xs font-bold uppercase tracking-widest px-5 py-3 rounded-full border transition-all cursor-pointer hover:-translate-y-0.5"
            style={{
              borderColor: "rgba(119,252,117,0.44)",
              background: "rgba(119,252,117,0.14)",
              color: "#77fc75",
            }}
          >
            {cta}
          </button>
        )}
      </div>
    </GlassCard>
  );
}
