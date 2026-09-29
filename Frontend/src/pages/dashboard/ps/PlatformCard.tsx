import { motion } from "motion/react";
import { ArrowUpRight } from "lucide-react";
import GlassCard from "../../../components/GlassCard";
import { CountUp, StatLabel } from "./shared";

export interface PlatformProfile {
  platform: "LeetCode" | "GeeksforGeeks";
  username: string;
  connected: boolean;
  lastSyncedAt?: string;
  profileUrl?: string;
  headline: { label: string; value: number };
  stats: { label: string; value: string }[];
  breakdown?: { label: string; count: number; color: string }[];
  progress?: { label: string; percent: number; caption: string };
}

const BRAND: Record<PlatformProfile["platform"], { name: string; icon: React.ReactNode; tint: string }> = {
  LeetCode: {
    name: "LeetCode",
    // Stack+checkmark glyph, echoing the brand's code-symbol identity
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="w-6 h-6">
        <path d="M13.5 3 8 8.5a3.2 3.2 0 0 0 0 4.5l5.5 5.5" />
        <path d="M9 15.5 12.5 19a1.5 1.5 0 0 1-2.1 2.1l-3.2-3.2" />
        <path d="M12 12h8" />
        <path d="M16.5 9.5 19 12l-2.5 2.5" />
      </svg>
    ),
    tint: "#fbbf24",
  },
  GeeksforGeeks: {
    name: "GeeksforGeeks",
    // Layered "leaf/green" glyph echoing the GFG mark
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="w-6 h-6">
        <path d="M4 8.5 12 4l8 4.5-8 4.5-8-4.5Z" />
        <path d="m4 15.5 8 4.5 8-4.5" />
        <path d="M4 12l8 4.5 8-4.5" />
      </svg>
    ),
    tint: "#34d399",
  },
};

/**
 * Large platform profile card. When `connected` is false, renders muted
 * placeholder shapes and a connect CTA instead of fabricated numbers.
 */
export default function PlatformCard({ profile }: { profile: PlatformProfile }) {
  const brand = BRAND[profile.platform];

  return (
    <GlassCard className="p-6 md:p-7 relative overflow-hidden group h-full">
      {/* Ambient brand glow, very restrained */}
      <div
        className="absolute inset-0 pointer-events-none opacity-60"
        style={{
          background: profile.connected
            ? `radial-gradient(ellipse at 85% -10%, ${brand.tint}14 0%, transparent 55%)`
            : "none",
        }}
      />

      <div className="relative h-full flex flex-col gap-5">
        {/* Header: brand identity + connection status */}
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-3.5 min-w-0">
            <div
              className="w-11 h-11 rounded-xl border flex items-center justify-center shrink-0"
              style={{
                borderColor: profile.connected ? `${brand.tint}33` : "rgba(255,255,255,0.1)",
                background: profile.connected ? `${brand.tint}0d` : "rgba(255,255,255,0.03)",
                color: profile.connected ? brand.tint : "rgba(255,255,255,0.35)",
              }}
            >
              {brand.icon}
            </div>
            <div className="min-w-0">
              <h3 className="text-base font-bold text-white tracking-tight truncate">{brand.name}</h3>
              <p className="text-[12px] text-white/40 truncate">
                {profile.connected ? `@${profile.username}` : "Not connected"}
              </p>
            </div>
          </div>

          {/* Connection / sync status */}
          {profile.connected ? (
            <div className="flex items-center gap-1.5 shrink-0 border border-primary/20 bg-primary/[0.07] rounded-full px-2.5 py-1">
              <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse shrink-0" />
              <span className="text-[9px] font-bold uppercase tracking-widest text-primary whitespace-nowrap">Synced</span>
            </div>
          ) : (
            <div className="flex items-center gap-1.5 shrink-0 border border-white/10 bg-white/[0.03] rounded-full px-2.5 py-1">
              <span className="w-1.5 h-1.5 rounded-full bg-white/25 shrink-0" />
              <span className="text-[9px] font-bold uppercase tracking-widest text-white/35 whitespace-nowrap">Offline</span>
            </div>
          )}
        </div>

        {profile.connected ? (
          <>
            {/* Headline metric */}
            <div>
              <StatLabel>{profile.headline.label}</StatLabel>
              <p className="text-4xl font-extrabold text-white tracking-tight mt-0.5">
                <CountUp value={profile.headline.value} />
              </p>
            </div>

            {/* Difficulty breakdown bars (LeetCode-style) */}
            {profile.breakdown && (
              <div className="space-y-2">
                {profile.breakdown.map((b, i) => (
                  <div key={b.label}>
                    <div className="flex items-center justify-between text-[11px] mb-1">
                      <span className="text-white/55 font-medium">{b.label}</span>
                      <span className="text-white/40 tabular-nums">{b.count}</span>
                    </div>
                    <div className="h-1.5 rounded-full bg-white/[0.05] overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${Math.min(100, (b.count / Math.max(...profile.breakdown!.map((x) => x.count), 1)) * 100)}%` }}
                        transition={{ duration: 0.8, delay: 0.3 + i * 0.1, ease: [0.25, 0.46, 0.45, 0.94] }}
                        className="h-full rounded-full"
                        style={{ background: b.color, boxShadow: `0 0 6px ${b.color}55` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Secondary stats */}
            <div className="grid grid-cols-3 gap-2.5 mt-auto">
              {profile.stats.map((s) => (
                <div key={s.label} className="rounded-xl border border-white/[0.07] bg-white/[0.03] px-3 py-2.5">
                  <StatLabel>{s.label}</StatLabel>
                  <p className="text-sm font-bold text-white mt-1 tabular-nums">{s.value}</p>
                </div>
              ))}
            </div>

            {/* Optional thin progress visualization */}
            {profile.progress && (
              <div>
                <div className="flex items-center justify-between text-[10px] font-bold uppercase tracking-widest text-white/35 mb-1.5">
                  <span>{profile.progress.label}</span>
                  <span className="text-white/50 tabular-nums">{profile.progress.percent}%</span>
                </div>
                <div className="h-1 rounded-full bg-white/[0.05] overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${profile.progress.percent}%` }}
                    transition={{ duration: 0.9, delay: 0.4 }}
                    className="h-full rounded-full bg-primary"
                    style={{ boxShadow: "0 0 6px rgba(22,255,0,0.4)" }}
                  />
                </div>
                <p className="text-[10px] text-white/30 mt-1.5">{profile.progress.caption}</p>
              </div>
            )}

            {/* Footer: view profile */}
            <div className="flex items-center justify-between gap-3 pt-1">
              <span className="text-[10px] text-white/25">
                {profile.lastSyncedAt ? `Synced ${profile.lastSyncedAt}` : "Just synced"}
              </span>
              <a
                href={profile.profileUrl ?? "#"}
                target={profile.profileUrl ? "_blank" : undefined}
                rel="noreferrer"
                onClick={(e) => !profile.profileUrl && e.preventDefault()}
                className="flex items-center gap-1 text-[11px] font-bold text-white/50 hover:text-primary transition-colors cursor-pointer"
              >
                View Profile <ArrowUpRight className="w-3.5 h-3.5" />
              </a>
            </div>
          </>
        ) : (
          /* ── Unconnected: muted placeholders, no fabricated numbers ── */
          <div className="flex flex-col gap-4 flex-1">
            <div className="flex-1 flex flex-col justify-center gap-4">
              <div>
                <StatLabel>{profile.headline.label}</StatLabel>
                <div className="h-8 w-24 rounded-lg bg-white/[0.05] border border-white/[0.04] mt-1.5" aria-hidden="true" />
              </div>

              {/* Muted difficulty shapes */}
              <div className="space-y-2.5">
                {[76, 88, 62].map((w, i) => (
                  <div key={i} className="h-1.5 rounded-full bg-white/[0.05]" style={{ width: `${w}%` }} aria-hidden="true" />
                ))}
              </div>

              <div className="grid grid-cols-3 gap-2.5">
                {profile.stats.map((s) => (
                  <div key={s.label} className="rounded-xl border border-white/[0.07] bg-white/[0.03] px-3 py-2.5">
                    <StatLabel>{s.label}</StatLabel>
                    <div className="h-4 w-10 rounded bg-white/[0.06] mt-1.5" aria-hidden="true" />
                  </div>
                ))}
              </div>
            </div>

            <button
              className="w-full flex items-center justify-center gap-2 text-xs font-bold uppercase tracking-widest px-5 py-3 rounded-full border border-primary/30 bg-primary/10 text-primary hover:bg-primary/20 hover:border-primary/50 transition-all cursor-pointer hover:-translate-y-0.5"
              title={`Connect ${brand.name} (integration coming soon)`}
            >
              Connect {brand.name}
            </button>
          </div>
        )}
      </div>
    </GlassCard>
  );
}
