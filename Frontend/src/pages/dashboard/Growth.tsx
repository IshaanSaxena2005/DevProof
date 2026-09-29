import { motion } from "motion/react";
import {
  FolderGit2,
  Code2,
  Activity,
  Gauge,
  BadgeCheck,
  History,
  Info,
} from "lucide-react";
import { api } from "../../lib/api";
import PageContainer from "../../components/PageContainer";
import GlassCard from "../../components/GlassCard";
import EmptyState from "../../components/EmptyState";
import { ErrorBlock, LoadingBlock } from "../../components/StateBlocks";
import { useResource } from "../../lib/useResource";
import { useAuth } from "../../hooks/useAuth";
import { relativeTime } from "../../lib/utils";
import type { Developer360Response, EvidenceLevel } from "../../lib/types";

/* ── presentation helpers ────────────────────────────── */

function scoreColor(n: number) {
  if (n >= 80) return "#77fc75";
  if (n >= 60) return "#f59e0b";
  return "#ef4444";
}

const TIER_ORDER: EvidenceLevel[] = [
  "CLAIMED",
  "LEARNED",
  "CREDENTIAL_VERIFIED",
  "PRACTICALLY_EVIDENCED",
];

const TIER_COLOR: Record<EvidenceLevel, string> = {
  CLAIMED: "#94a3b8",
  LEARNED: "#60a5fa",
  CREDENTIAL_VERIFIED: "#a78bfa",
  PRACTICALLY_EVIDENCED: "#77fc75",
};

/** FRONTEND -> Frontend, DEPENDENCY_HEALTH -> Dependency health */
function humanize(value: string) {
  const lower = value.replace(/_/g, " ").toLowerCase();
  return lower.charAt(0).toUpperCase() + lower.slice(1);
}

/** Thin bar in the same anatomy as Developer360's category bars. */
function Bar({ score, color }: { score: number; color: string }) {
  return (
    <div className="relative w-full h-1.5 rounded-full overflow-hidden" style={{ background: "rgba(255,255,255,0.06)" }}>
      <motion.div
        initial={{ width: 0 }}
        animate={{ width: `${score}%` }}
        transition={{ duration: 0.9, delay: 0.2, ease: [0.34, 1.56, 0.64, 1] }}
        className="absolute inset-y-0 left-0 rounded-full"
        style={{ background: color, boxShadow: `0 0 8px ${color}55` }}
      />
    </div>
  );
}

function SLabel({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return <p className={`text-[11px] font-bold uppercase tracking-[0.2em] text-white/30 mb-4 ${className}`}>{children}</p>;
}

/** Overview stat card — GlassCard anatomy shared with Overview.tsx. */
function StatCard({
  icon: Icon,
  label,
  value,
  sub,
}: {
  icon: typeof FolderGit2;
  label: string;
  value: string;
  sub: string;
}) {
  return (
    <GlassCard hover className="p-6 flex items-center gap-4">
      <div className="w-10 h-10 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary shrink-0">
        <Icon className="w-5 h-5" />
      </div>
      <div className="min-w-0">
        <div className="text-[10px] font-bold uppercase tracking-widest" style={{ color: "var(--text-tertiary)" }}>
          {label}
        </div>
        <div className="text-xl font-bold text-white mt-0.5">{value}</div>
        <div className="text-[11px] text-white/30 mt-0.5 truncate">{sub}</div>
      </div>
    </GlassCard>
  );
}

/** Explains why a panel shows nothing: the source has no data yet. */
function UnavailableNote({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex items-start gap-2.5 rounded-xl border border-white/[0.07] bg-white/[0.02] px-4 py-3">
      <Info className="w-3.5 h-3.5 text-white/30 shrink-0 mt-0.5" />
      <p className="text-[12px] leading-relaxed text-white/40">{children}</p>
    </div>
  );
}

/* ── page ────────────────────────────────────────────── */

export default function Growth() {
  const { user } = useAuth();
  const { data, loading, error, reload } = useResource<Developer360Response>(
    () => api.get<Developer360Response>("/developer360/overview")
  );

  if (loading) {
    return (
      <PageContainer title="Growth & Analytics" description="Your measured engineering growth across repositories and skills.">
        <LoadingBlock label="Loading your growth evidence…" />
      </PageContainer>
    );
  }

  if (error || !data?.overview) {
    return (
      <PageContainer title="Growth & Analytics" description="Your measured engineering growth across repositories and skills.">
        <ErrorBlock message={error ?? "No overview data returned."} onRetry={reload} />
      </PageContainer>
    );
  }

  const o = data.overview;
  const firstName = (user?.name ?? "").trim().split(/\s+/)[0];
  // null = no completed analyses: "not measured", never a zero.
  const score = o.developer360Score !== null ? Math.round(o.developer360Score) : null;

  // Per-category averages over recorded skills (null when none) — the same
  // derivation Skills.tsx uses, so the two pages can never disagree.
  const categoryRows = o.categoryBreakdown
    .map((c) => ({ ...c }))
    .sort((a, b) => (b.score ?? -1) - (a.score ?? -1))
    .slice(0, 8);

  const tiers = TIER_ORDER.map((tier) => ({ tier, count: o.evidenceTiers[tier] ?? 0 }));

  return (
    <PageContainer
      title="Growth & Analytics"
      description="Your measured engineering growth across repositories, analyses, and skills."
    >
      {/* Overview — every figure measured from live data */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard icon={FolderGit2} label="Repositories" value={`${o.totalRepositories}`} sub="connected to DevProof" />
        <StatCard icon={Activity} label="Analyses Completed" value={`${o.totalAnalyzed}`} sub={score !== null ? `avg score ${score}/100` : "no scores yet"} />
        <StatCard icon={Code2} label="Skills Recorded" value={`${o.skillsList.length}`} sub={`${tiers[3].count} practically evidenced`} />
        <StatCard
          icon={Gauge}
          label="Developer Score"
          value={score !== null ? `${score}/100` : "—"}
          sub={score !== null ? "average across analyses" : "not measured yet"}
        />
      </div>

      {/* Analysis score snapshot */}
      <motion.div initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.45 }} className="mb-6">
        <SLabel>Analysis Score</SLabel>
        <GlassCard hover={false} className="p-6 md:p-8 relative overflow-hidden">
          <div
            className="absolute inset-0 pointer-events-none"
            style={{ background: "radial-gradient(ellipse at 85% 20%, rgba(119,252,117,0.06) 0%, transparent 55%)" }}
          />
          <div className="relative flex flex-col md:flex-row items-center gap-8">
            <div className="text-center shrink-0">
              <span className="text-5xl font-extrabold text-white">{score ?? "—"}</span>
              {score !== null && <span className="text-sm" style={{ color: "var(--text-tertiary)" }}>/100</span>}
              <div
                className="text-xs uppercase tracking-widest font-semibold mt-2"
                style={{ color: score !== null ? scoreColor(score) : "var(--text-tertiary)" }}
              >
                {score !== null ? "Measured" : "No data yet"}
              </div>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[13px] leading-relaxed" style={{ color: "var(--text-secondary)" }}>
                {score !== null
                  ? `${firstName ? `${firstName}, y` : "Y"}our average engineering quality across ${o.totalAnalyzed} completed ${o.totalAnalyzed === 1 ? "analysis" : "analyses"}. Scores move as you connect and analyze more repositories — this is your current standing, not a projection.`
                  : "No repository analyses have completed yet, so there is no score to chart. Analyze a repository to start your measured baseline."}
              </p>
              {score !== null && (
                <div className="mt-4 max-w-sm">
                  <Bar score={score} color={scoreColor(score)} />
                </div>
              )}
            </div>
          </div>
        </GlassCard>
      </motion.div>

      {/* Skill category standing */}
      {categoryRows.length > 0 && (
        <motion.div initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.45, delay: 0.05 }} className="mb-6">
          <SLabel>Skill Category Standing</SLabel>
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
            {categoryRows.map((c) => {
              const empty = c.score === null;
              const color = empty ? "rgba(255,255,255,0.25)" : scoreColor(c.score as number);
              return (
                <div key={c.category} className="rounded-2xl border border-white/[0.08] bg-white/[0.03] p-5 flex flex-col gap-3 hover:border-white/[0.16] transition-all duration-300">
                  <div className="flex items-center justify-between gap-2">
                    <h3 className="text-sm font-semibold text-white/85">{humanize(c.category)}</h3>
                    <span className="text-[11px] font-bold px-2 py-0.5 rounded-full shrink-0" style={{ color, background: `${color}15` }}>
                      {c.skillCount}
                    </span>
                  </div>
                  {empty ? (
                    <p className="text-[12px] text-white/25 italic">No skills recorded yet</p>
                  ) : (
                    <>
                      <div className="flex items-baseline gap-1">
                        <span className="text-2xl font-bold tabular-nums" style={{ color }}>{c.score}</span>
                        <span className="text-xs text-white/30 font-medium">/ 100</span>
                      </div>
                      <Bar score={c.score as number} color={color} />
                    </>
                  )}
                </div>
              );
            })}
          </div>
        </motion.div>
      )}

      {/* Evidence ladder */}
      <motion.div initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.45, delay: 0.1 }} className="mb-6">
        <SLabel>Evidence Ladder</SLabel>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {tiers.map(({ tier, count }, i) => (
            <motion.div
              key={tier}
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.06 * i, duration: 0.4 }}
              className="rounded-2xl border border-white/[0.08] bg-white/[0.03] p-5 flex flex-col gap-2"
            >
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full shrink-0" style={{ background: TIER_COLOR[tier], boxShadow: `0 0 6px ${TIER_COLOR[tier]}88` }} />
                <p className="text-[10px] font-bold uppercase tracking-widest text-white/35 leading-tight">{humanize(tier)}</p>
              </div>
              <p className="text-3xl font-bold tabular-nums" style={{ color: TIER_COLOR[tier] }}>{count}</p>
              <p className="text-[11px] text-white/25">{count === 1 ? "skill" : "skills"}</p>
            </motion.div>
          ))}
        </div>
      </motion.div>

      {/* Recent repository activity — real push timestamps */}
      <motion.div initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.45, delay: 0.15 }} className="mb-6">
        <SLabel>Recent Repository Activity</SLabel>
        <GlassCard hover={false} className="p-6">
          {o.github.connected && o.github.recentActivity.length > 0 ? (
            <div className="flex flex-col divide-y divide-white/[0.05]">
              {o.github.recentActivity.slice(0, 6).map((r) => (
                <a
                  key={r.fullName}
                  href={r.url}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center justify-between gap-3 py-2.5 group first:pt-0 last:pb-0"
                >
                  <span className="min-w-0">
                    <span className="text-[13px] text-white/70 group-hover:text-white truncate block transition-colors" title={r.fullName}>
                      {r.name}
                    </span>
                    {r.language && <span className="text-[10px] text-white/30">{r.language}</span>}
                  </span>
                  <span className="text-[11px] text-white/30 shrink-0">{relativeTime(r.pushedAt)}</span>
                </a>
              ))}
            </div>
          ) : (
            <UnavailableNote>
              {o.github.connected
                ? "No recent pushes recorded on your connected repositories yet."
                : "No GitHub account linked, so repository activity cannot be shown."}
            </UnavailableNote>
          )}
        </GlassCard>
      </motion.div>

      {/* Historical growth — honestly unavailable, no fabricated timeline */}
      <motion.div initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.45, delay: 0.2 }} className="mb-6">
        <SLabel>Growth Over Time</SLabel>
        <EmptyState
          icon={History}
          title="Historical trends not available yet"
          description="DevProof records your repository analyses, skills, and scores as they happen — but the backend does not yet store point-in-time snapshots, so month-over-month trends cannot be shown honestly. Your timeline will begin accumulating as you keep using the dashboard."
        />
      </motion.div>

      {/* Footnote on measurement scope */}
      <GlassCard hover={false} className="p-5">
        <p className="text-[12px] leading-relaxed flex items-start gap-2.5" style={{ color: "var(--text-tertiary)" }}>
          <BadgeCheck className="w-4 h-4 text-primary/60 shrink-0 mt-0.5" />
          <span>
            Every figure on this page is measured from your connected repositories, completed
            analyses, {o.skillsList.length} recorded skills, and your linked GitHub account. Nothing here is
            estimated or simulated — sections without a data source show that they are unavailable instead.
          </span>
        </p>
      </GlassCard>
    </PageContainer>
  );
}
