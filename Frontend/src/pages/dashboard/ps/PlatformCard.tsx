import { motion } from "motion/react";
import { ArrowUpRight, RefreshCw, LogOut } from "lucide-react";
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
  /** GFG-specific metrics when available */
  gfgStats?: {
    codingScore: number | null;
    monthlyScore: number | null;
    longestStreak: number | null;
    articlesPublished: number | null;
  };
  /** Whether difficulty breakdown is unavailable */
  difficultyUnavailable?: boolean;
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
 * One metric tile on a platform card.
 *
 * A `null`/`undefined` value means the platform never published that figure,
 * and it renders as a muted em dash. That keeps "not published" visually
 * distinct from a real zero, which is a number and renders as `0`.
 */
function MetricTile({ label, value }: { label: string; value: number | null | undefined }) {
  const available = value !== null && value !== undefined;

  return (
    <div
      className="flex flex-col rounded-xl border border-white/[0.07] bg-white/[0.03] px-3 py-2.5"
      title={available ? undefined : `${label} is not published by this platform`}
    >
      <StatLabel>{label}</StatLabel>
      {/* `mt-auto` bottom-aligns the figure, so a tile whose label wraps to two
       *   lines keeps its value on the same baseline as its row neighbour. */}
      <p
        className={`text-sm font-bold mt-auto pt-1.5 tabular-nums ${
          available ? "text-white" : "text-white/25"
        }`}
      >
        {available ? value.toLocaleString() : "—"}
      </p>
    </div>
  );
}

/**
 * Column count for the secondary-stat row, so one reported figure does not sit
 * alone in a three-column grid padded out with nothing.
 */
function statsRowClass(count: number): string {
  if (count === 1) return "grid-cols-1";
  if (count === 2) return "grid-cols-2";
  return "grid-cols-3";
}

/**
 * Large platform profile card. When `connected` is false, renders muted
 * placeholder shapes and a connect CTA instead of fabricated numbers.
 *
 * `onConnect` makes the unconnected CTA functional for platforms whose
 * backend integration is live; when it is absent the button stays visible
 * but disabled — a placeholder the user can act on would lie about the
 * integration state.
 */
export default function PlatformCard({
  profile,
  onConnect,
  connectDisabled = false,
  connectHint,
  usernameValue,
  onUsernameChange,
  usernamePlaceholder,
  onSync,
  onDisconnect,
  isSyncing = false,
  isDisconnecting = false,
}: {
  profile: PlatformProfile;
  onConnect?: () => void;
  connectDisabled?: boolean;
  /** Tooltip override for the disabled state — points at the working control or explains why none exists. */
  connectHint?: string;
  /** Username input value to show when not connected */
  usernameValue?: string;
  /** Handler for username input changes */
  onUsernameChange?: (value: string) => void;
  /** Placeholder text for the username input */
  usernamePlaceholder?: string;
  /** Handler for sync action */
  onSync?: () => void;
  /** Handler for disconnect action */
  onDisconnect?: () => void;
  /** Whether sync is in progress */
  isSyncing?: boolean;
  /** Whether disconnect is in progress */
  isDisconnecting?: boolean;
}) {
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
            {/* Headline metric — the platform's total solved count. */}
            <div>
              <StatLabel>{profile.headline.label}</StatLabel>
              <p className="text-4xl font-extrabold text-white tracking-tight mt-0.5 tabular-nums">
                <CountUp value={profile.headline.value} />
              </p>
              {profile.platform === "GeeksforGeeks" && (
                <p className="text-[10px] text-white/30 mt-1">Total solved on GeeksforGeeks</p>
              )}
            </div>

            {/* Difficulty breakdown bars (LeetCode-style) */}
            {profile.breakdown ? (
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
            ) : profile.difficultyUnavailable ? (
              <div className="flex items-center gap-2 rounded-lg border border-dashed border-white/10 bg-white/[0.02] px-3 py-2">
                <span className="w-1.5 h-1.5 rounded-full bg-white/20 shrink-0" aria-hidden="true" />
                <span className="text-[11px] leading-relaxed text-white/35">
                  {profile.platform} publishes no Easy / Medium / Hard split, so those counts are
                  unknown here — not zero.
                </span>
              </div>
            ) : null}

            {/* GeeksforGeeks metrics.
             *
             * A fixed two-column grid rather than a filtered list: the card
             * keeps its shape whichever subset of figures the profile carries,
             * and a metric the source did not publish reads as a dash instead
             * of silently reshaping the layout.
             *
             * Total Solved is not repeated here — it is the headline figure
             * directly above. */}
            {profile.platform === "GeeksforGeeks" && (
              <div className="grid grid-cols-2 gap-2">
                <MetricTile label="Coding Score" value={profile.gfgStats?.codingScore} />
                <MetricTile label="Monthly Score" value={profile.gfgStats?.monthlyScore} />
                <MetricTile label="Longest Streak" value={profile.gfgStats?.longestStreak} />
                <MetricTile label="Articles Published" value={profile.gfgStats?.articlesPublished} />
              </div>
            )}

            {/* Secondary stats (acceptance, rating, current streak, etc.).
             *   Column count follows however many the platform reported. */}
            {profile.stats.length > 0 && (
              <div className={`grid ${statsRowClass(profile.stats.length)} gap-2.5`}>
                {profile.stats.map((s) => (
                  <div key={s.label} className="rounded-xl border border-white/[0.07] bg-white/[0.03] px-3 py-2.5">
                    <StatLabel>{s.label}</StatLabel>
                    <p className="text-sm font-bold text-white mt-1 tabular-nums">{s.value}</p>
                  </div>
                ))}
              </div>
            )}

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

            {/* Footer: sync/disconnect actions + view profile.
             *   Pinned to the bottom of the card so two cards holding
             *   different amounts of data still align along one baseline. */}
            <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-2 pt-1 mt-auto">
              <div className="flex items-center gap-2">
                <span className="text-[10px] text-white/25 whitespace-nowrap">
                  {profile.lastSyncedAt ? `Synced ${profile.lastSyncedAt}` : "—"}
                </span>
                {onSync && (
                  <button
                    onClick={onSync}
                    disabled={isSyncing || isDisconnecting}
                    className="flex items-center gap-1 text-[10px] font-bold text-white/40 hover:text-primary transition-colors whitespace-nowrap disabled:opacity-50 disabled:cursor-not-allowed"
                    title="Sync profile"
                  >
                    <RefreshCw className={`w-3 h-3 ${isSyncing ? "animate-spin" : ""}`} />
                    Sync
                  </button>
                )}
                {onDisconnect && (
                  <button
                    onClick={onDisconnect}
                    disabled={isSyncing || isDisconnecting}
                    className="flex items-center gap-1 text-[10px] font-bold text-white/40 hover:text-red-400 transition-colors whitespace-nowrap disabled:opacity-50 disabled:cursor-not-allowed"
                    title="Disconnect profile"
                  >
                    <LogOut className={`w-3 h-3 ${isDisconnecting ? "animate-pulse" : ""}`} />
                    Disconnect
                  </button>
                )}
              </div>
              {profile.profileUrl ? (
                <a
                  href={profile.profileUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center gap-1 text-[11px] font-bold text-white/50 hover:text-primary transition-colors whitespace-nowrap cursor-pointer"
                >
                  View Profile <ArrowUpRight className="w-3.5 h-3.5" />
                </a>
              ) : (
                <span
                  title="Profile URL not available yet — reconnect to refresh it"
                  className="flex items-center gap-1 text-[11px] font-bold text-white/25 whitespace-nowrap"
                >
                  View Profile <ArrowUpRight className="w-3.5 h-3.5" />
                </span>
              )}
            </div>
          </>
        ) : (
          /* ── Unconnected: username input and connect button ── */
          <div className="flex flex-col gap-4 flex-1">
            {/* Username input with label */}
            {usernameValue !== undefined && onUsernameChange && (
              <div className="space-y-2">
                <label className="text-[10px] font-bold uppercase tracking-widest text-white/50">
                  {profile.platform === "LeetCode" ? "LEETCODE USERNAME" : "GFG USERNAME"}
                </label>
                <input
                  type="text"
                  value={usernameValue}
                  onChange={(e) => onUsernameChange(e.target.value)}
                  placeholder={usernamePlaceholder ?? `Enter your ${brand.name} username`}
                  className="w-full rounded-lg border border-white/20 bg-white/[0.05] px-4 py-3 text-sm text-white placeholder:text-white/35 outline-none focus:border-primary/50 focus:ring-2 focus:ring-primary/20 transition-all"
                />
              </div>
            )}

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
              onClick={onConnect}
              disabled={onConnect === undefined || connectDisabled}
              title={
                onConnect !== undefined && !connectDisabled
                  ? `Connect ${brand.name}`
                  : connectHint ?? `Connect ${brand.name} once its integration is available`
              }
              className="w-full flex items-center justify-center gap-2 text-xs font-bold uppercase tracking-widest px-5 py-3 rounded-full border transition-all hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0 cursor-pointer"
              style={
                onConnect !== undefined && !connectDisabled
                  ? { borderColor: "rgba(119,252,117,0.3)", background: "rgba(119,252,117,0.1)", color: "hsl(var(--primary))" }
                  : undefined
              }
            >
              Connect {brand.name}
            </button>
          </div>
        )}
      </div>
    </GlassCard>
  );
}
