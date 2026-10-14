import { LinkedinGlyph } from "./icons";

/**
 * Stub that preserves the Professional Profile page render path while
 * LinkedIn has been removed. LinkedIn-specific color treatment and the
 * brand glyph were removed; the card is now a plain "Coming soon" card.
 */
export default function LinkedInSourceCard() {
  return (
    <div className="p-6 md:p-7 relative overflow-hidden flex flex-col">
      <div className="w-11 h-11 rounded-xl border border-white/10 bg-white/[0.03] flex items-center justify-center text-white/30 shrink-0 mb-4">
        <LinkedinGlyph className="w-5 h-5" />
      </div>
      <p className="text-sm font-bold text-white uppercase tracking-wider mb-1">LinkedIn</p>
      <p className="text-[12px] text-white/40 leading-snug mb-4">
        LinkedIn integration is discontinued and is not available.
      </p>
      <span
        className="inline-flex items-center gap-1.5 text-[9px] font-bold uppercase tracking-widest px-2.5 py-1 rounded-full border border-amber-400/25 bg-amber-400/10 text-amber-300"
      >
        <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
        Discontinued
      </span>
    </div>
  );
}

