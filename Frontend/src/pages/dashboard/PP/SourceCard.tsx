import GlassCard from "../../../components/GlassCard";
import { LinkedinGlyph, ResumeGlyph } from "./icons";

/**
 * Large evidence-source card (LinkedIn / Resume) with connected / empty states.
 * Reuses the Credentials.tsx card anatomy: glass panel, icon tile, top
 * hairline reflection, hover glow.
 */
export default function SourceCard({
  kind,
  title,
  purpose,
  state,
  stateLabel,
  bullets,
  cta,
  onCta,
  footer,
}: {
  kind: "linkedin" | "resume";
  title: string;
  purpose: string;
  /** connected = real data exists; empty = awaiting user action; pending = backend not built. */
  state: "connected" | "empty" | "pending";
  stateLabel: string;
  /** What this source will contribute once available. */
  bullets: string[];
  cta: string;
  onCta?: () => void;
  footer?: React.ReactNode;
}) {
  const Glyph = kind === "linkedin" ? LinkedinGlyph : ResumeGlyph;
  const tint = kind === "linkedin" ? "#60a5fa" : "#a78bfa";

  const statusStyles: Record<typeof state, string> = {
    connected: "border-primary/25 bg-primary/10 text-primary",
    empty: "border-white/10 bg-white/[0.04] text-white/40",
    pending: "border-amber-400/25 bg-amber-400/10 text-amber-300",
  };
  const statusDot: Record<typeof state, string> = {
    connected: "bg-primary",
    empty: "bg-white/25",
    pending: "bg-amber-400 animate-pulse",
  };

  return (
    <GlassCard className="p-6 md:p-7 relative overflow-hidden h-full flex flex-col">
      {/* Hairline top reflection + restrained brand glow */}
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/[0.12] to-transparent pointer-events-none" />
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            state === "connected"
              ? `radial-gradient(ellipse at 85% -10%, ${tint}12 0%, transparent 55%)`
              : "none",
        }}
      />

      <div className="relative flex flex-col gap-5 h-full">
        {/* Header: icon, title, status */}
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-3.5 min-w-0">
            <div
              className="w-11 h-11 rounded-xl border flex items-center justify-center shrink-0"
              style={{
                borderColor: state === "connected" ? `${tint}33` : "rgba(255,255,255,0.1)",
                background: state === "connected" ? `${tint}0d` : "rgba(255,255,255,0.03)",
                color: state === "connected" ? tint : "rgba(255,255,255,0.35)",
              }}
            >
              <Glyph className="w-5 h-5" />
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
          <>
            {/* What this source contributes — sets expectations without faking data */}
            <ul className="flex-1 space-y-2">
              {bullets.map((b) => (
                <li key={b} className="flex items-start gap-2.5 text-[12px] text-white/45 leading-relaxed">
                  <span className="mt-[6px] w-1.5 h-1.5 rounded-full shrink-0" style={{ background: `${tint}66` }} />
                  {b}
                </li>
              ))}
            </ul>

            <button
              onClick={onCta}
              disabled={state === "pending"}
              title={state === "pending" ? "Integration coming soon" : undefined}
              className={
                state === "pending"
                  ? "w-full text-xs font-bold uppercase tracking-widest px-5 py-3 rounded-full border border-white/10 bg-white/[0.03] text-white/35 cursor-not-allowed"
                  : "w-full flex items-center justify-center gap-2 text-xs font-bold uppercase tracking-widest px-5 py-3 rounded-full border transition-all cursor-pointer hover:-translate-y-0.5"
              }
              style={
                state === "pending"
                  ? undefined
                  : { borderColor: `${tint}44`, background: `${tint}14`, color: tint }
              }
            >
              {state === "pending" ? `${cta} — coming soon` : cta}
            </button>
          </>
        )}
      </div>
    </GlassCard>
  );
}
