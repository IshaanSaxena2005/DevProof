import { motion } from "motion/react";
import { Link } from "react-router-dom";
import { AlertCircle, FolderGit2, Star, GitFork, Users, Activity, Code2 } from "lucide-react";
import GlassCard from "../../components/GlassCard";
import { ErrorBlock, LoadingBlock } from "../../components/StateBlocks";
import { api } from "../../lib/api";
import { useResource } from "../../lib/useResource";
import type { Developer360Response, EvidenceLevel, SkillCategory } from "../../lib/types";

/* ── helpers ─────────────────────────────────────────── */

function scoreColor(n: number) {
  if (n >= 80) return "#77fc75";
  if (n >= 60) return "#f59e0b";
  return "#ef4444";
}

/** ISO -> short date for GitHub activity rows, em-dash when absent. */
function formatWhen(iso: string | null) {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
}

/** Distinct-enough colors for stacked language bars; cycles for long lists. */
const LANG_PALETTE = ["#77fc75", "#60a5fa", "#a78bfa", "#f59e0b", "#34d399", "#fb923c", "#f472b6", "#94a3b8"];

const CATEGORY_COLOR: Record<SkillCategory, string> = {
  FRONTEND: "#77fc75",
  BACKEND: "#60a5fa",
  DATABASE: "#a78bfa",
  TESTING: "#ef4444",
  DEVOPS: "#f59e0b",
  SECURITY: "#34d399",
  ML: "#fb923c",
  GENERAL: "#94a3b8",
};

/** FRONTEND -> Frontend, DEPENDENCY_HEALTH -> Dependency health */
function humanize(value: string) {
  const lower = value.replace(/_/g, " ").toLowerCase();
  return lower.charAt(0).toUpperCase() + lower.slice(1);
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

/** score=null renders an empty track and a dash — "nothing measured", not a 0. */
function ScoreRing({ score, size = 156 }: { score: number | null; size?: number }) {
  const r = (size - 24) / 2;
  const c = 2 * Math.PI * r;
  const offset = score !== null ? c - (score / 100) * c : c;
  const col = score !== null ? scoreColor(score) : "rgba(255,255,255,0.15)";
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="10" />
      <circle
        cx={size / 2} cy={size / 2} r={r}
        fill="none" stroke={col} strokeWidth="10" strokeLinecap="round"
        strokeDasharray={c} strokeDashoffset={offset}
        transform={`rotate(-90 ${size / 2} ${size / 2})`}
        style={score !== null ? { filter: `drop-shadow(0 0 8px ${col}88)`, transition: "stroke-dashoffset 1.2s cubic-bezier(0.34,1.56,0.64,1)" } : undefined}
      />
      <text x="50%" y="44%" dominantBaseline="middle" textAnchor="middle" fontSize="30" fontWeight="800" fill="white" fontFamily="Sora,sans-serif">
        {score ?? "—"}
      </text>
      <text x="50%" y="61%" dominantBaseline="middle" textAnchor="middle" fontSize="11" fill="rgba(255,255,255,0.35)" fontFamily="Sora,sans-serif">
        /100
      </text>
    </svg>
  );
}

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

/* ── page ────────────────────────────────────────────── */

export default function Developer360() {
  const { data, loading, error, reload } = useResource<Developer360Response>(
    () => api.get<Developer360Response>("/developer360/overview")
  );

  if (loading) return <LoadingBlock label="Compiling your developer profile…" />;
  if (error) return <ErrorBlock message={error} onRetry={reload} />;
  if (!data?.overview) return <ErrorBlock message="No overview data returned." />;

  const o = data.overview;
  // null means "nothing measured yet" — the backend no longer substitutes a
  // placeholder number, so this is a real absence, not a low score.
  const score = o.developer360Score !== null ? Math.round(o.developer360Score) : null;
  const hasAnalyses = score !== null;
  const hasSkills = o.skillsList.length > 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: "easeOut" }}
      className="w-full flex flex-col gap-8 pb-8"
    >
      <div>
        <h1 className="text-2xl md:text-3xl font-bold text-white uppercase tracking-tight">Developer 360</h1>
        <p className="text-sm mt-1" style={{ color: "var(--text-secondary)" }}>
          Your engineering profile, compiled from analyzed repositories and recorded skill evidence.
        </p>
      </div>

      {/* No completed analyses — the ring below renders as an empty dash, this
          just explains why rather than leaving it unexplained. */}
      {!hasAnalyses && (
        <div className="flex items-start gap-3 rounded-2xl border border-amber-400/20 bg-amber-400/[0.06] px-5 py-4">
          <AlertCircle className="w-4 h-4 text-amber-300 shrink-0 mt-0.5" />
          <div className="text-[12px] leading-relaxed text-amber-100/70">
            <span className="font-semibold text-amber-200/90">Nothing measured yet.</span>{" "}
            No completed repository analyses, so there is no score to show.{" "}
            <Link to="/dashboard/repositories" className="font-semibold text-primary hover:underline">
              Connect and analyze a repository
            </Link>{" "}
            to generate one.
          </div>
        </div>
      )}

      {/* Score + identity */}
      <GlassCard hover={false} className="p-6 md:p-8 relative overflow-hidden">
        <div
          className="absolute inset-0 pointer-events-none"
          style={{ background: "radial-gradient(ellipse at 80% 50%, rgba(119,252,117,0.07) 0%, transparent 60%)" }}
        />
        <div className="relative flex flex-col md:flex-row items-center md:items-start gap-8">
          <div className="flex flex-col items-center gap-3 shrink-0">
            <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-white/30">Developer Score</p>
            <ScoreRing score={score} />
            <p
              className="text-[12px] font-bold uppercase tracking-widest text-center"
              style={{ color: score !== null ? scoreColor(score) : "rgba(255,255,255,0.3)" }}
            >
              {hasAnalyses ? "Average across analyses" : "No data yet"}
            </p>
          </div>

          <div className="flex-1 min-w-0 flex flex-col justify-center gap-5 md:pt-2">
            <div>
              <h2 className="text-2xl font-bold text-white tracking-tight">
                {o.user.name || o.user.email}
              </h2>
              <p className="text-sm text-white/40 mt-0.5">
                {o.user.githubUsername ? `@${o.user.githubUsername}` : o.user.email}
              </p>
            </div>

            <div className="flex flex-wrap gap-3">
              {[
                { label: "Repositories", value: String(o.totalRepositories) },
                { label: "Analyzed", value: String(o.totalAnalyzed) },
                { label: "Skills Recorded", value: String(o.skillsList.length) },
                { label: "Certifications", value: String(o.recentCertifications.length) },
              ].map((s) => (
                <div key={s.label} className="rounded-xl border border-white/[0.08] bg-white/[0.03] px-4 py-2.5">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-white/30">{s.label}</p>
                  <p className="text-base font-bold text-white mt-0.5">{s.value}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </GlassCard>

      {/* Evidence tiers */}
      <div>
        <SLabel>Evidence Ladder</SLabel>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {TIER_ORDER.map((tier, i) => {
            const count = o.evidenceTiers[tier] ?? 0;
            const color = TIER_COLOR[tier];
            return (
              <motion.div
                key={tier}
                initial={{ opacity: 0, y: 14 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.06 * i, duration: 0.4 }}
                className="rounded-2xl border border-white/[0.08] bg-white/[0.03] p-5 flex flex-col gap-2"
              >
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full shrink-0" style={{ background: color, boxShadow: `0 0 6px ${color}88` }} />
                  <p className="text-[10px] font-bold uppercase tracking-widest text-white/35 leading-tight">
                    {humanize(tier)}
                  </p>
                </div>
                <p className="text-3xl font-bold tabular-nums" style={{ color }}>{count}</p>
                <p className="text-[11px] text-white/25">{count === 1 ? "skill" : "skills"}</p>
              </motion.div>
            );
          })}
        </div>
      </div>

      {/* Category breakdown */}
      <div>
        <SLabel>Skill Categories</SLabel>
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
          {o.categoryBreakdown.map((cat, i) => {
            // No skills recorded in this category — null, not a measured 0.
            const empty = cat.score === null;
            const color = empty ? "rgba(255,255,255,0.25)" : CATEGORY_COLOR[cat.category] ?? "#94a3b8";
            return (
              <motion.div
                key={cat.category}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.06 * i, duration: 0.42 }}
                className="rounded-2xl border border-white/[0.08] bg-white/[0.03] p-5 flex flex-col gap-3 hover:border-white/[0.16] transition-all duration-300"
              >
                <div className="flex items-center justify-between gap-2">
                  <h3 className="text-sm font-semibold text-white/85">{humanize(cat.category)}</h3>
                  <span
                    className="text-[11px] font-bold px-2 py-0.5 rounded-full shrink-0"
                    style={{ color, background: `${color}15` }}
                  >
                    {cat.skillCount}
                  </span>
                </div>
                {empty ? (
                  <p className="text-[12px] text-white/25 italic">No skills recorded yet</p>
                ) : (
                  <>
                    <div className="flex items-baseline gap-1">
                      <span className="text-2xl font-bold tabular-nums" style={{ color }}>{cat.score}</span>
                      <span className="text-xs text-white/30 font-medium">/ 100</span>
                    </div>
                    <Bar score={cat.score as number} color={color} />
                  </>
                )}
              </motion.div>
            );
          })}
        </div>
      </div>

      {/* GitHub evidence — directly observed GitHub metadata, not inferred skill */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <SLabel className="mb-0">GitHub Evidence</SLabel>
          <span className="text-[10px] font-semibold uppercase tracking-widest text-white/25">
            Source: GitHub
          </span>
        </div>

        {o.github.connected ? (
          <div className="flex flex-col gap-4">
            {/* Account stats */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
              {[
                { icon: FolderGit2, label: "Public repos", value: o.github.publicRepos ?? 0 },
                { icon: Users, label: "Followers", value: o.github.followers ?? 0 },
                { icon: Users, label: "Following", value: o.github.following ?? 0 },
                { icon: Star, label: "Total stars", value: o.github.totalStars },
                { icon: GitFork, label: "Total forks", value: o.github.totalForks },
                { icon: FolderGit2, label: "Tracked", value: o.github.repositoriesTracked },
              ].map((s) => (
                <div key={s.label} className="rounded-2xl border border-white/[0.08] bg-white/[0.03] p-4 flex flex-col gap-1.5">
                  <div className="flex items-center gap-2 text-white/35">
                    <s.icon className="w-3.5 h-3.5" />
                    <span className="text-[10px] font-semibold uppercase tracking-widest">{s.label}</span>
                  </div>
                  <p className="text-lg font-bold text-white tabular-nums">{s.value}</p>
                </div>
              ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {/* Language distribution */}
              <GlassCard hover={false} className="p-6">
                <h3 className="text-xs font-bold text-white/70 uppercase tracking-wider mb-4 flex items-center gap-2">
                  <Code2 className="w-3.5 h-3.5 text-primary" /> Language Distribution
                </h3>
                {o.github.languageDistribution.length > 0 ? (
                  <div className="flex flex-col gap-3">
                    {o.github.languageDistribution.map((l, i) => {
                      const color = LANG_PALETTE[i % LANG_PALETTE.length];
                      return (
                        <div key={l.language} className="flex flex-col gap-1.5">
                          <div className="flex items-center justify-between text-[12px]">
                            <span className="text-white/70">{l.language}</span>
                            <span className="text-white/35 tabular-nums">{l.percentage}% · {l.count}</span>
                          </div>
                          <Bar score={l.percentage} color={color} />
                        </div>
                      );
                    })}
                    <p className="text-[10px] text-white/25 mt-1 leading-relaxed">
                      Share of your authored repositories by primary language — a repository count,
                      not a byte-level breakdown.
                    </p>
                  </div>
                ) : (
                  <p className="text-xs text-white/30">No language data yet.</p>
                )}
              </GlassCard>

              {/* Recent activity */}
              <GlassCard hover={false} className="p-6">
                <h3 className="text-xs font-bold text-white/70 uppercase tracking-wider mb-4 flex items-center gap-2">
                  <Activity className="w-3.5 h-3.5 text-primary" /> Recent GitHub Activity
                </h3>
                {o.github.recentActivity.length > 0 ? (
                  <div className="flex flex-col divide-y divide-white/[0.05]">
                    {o.github.recentActivity.map((r) => (
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
                        <span className="text-[11px] text-white/30 shrink-0">{formatWhen(r.pushedAt)}</span>
                      </a>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-white/30">No recent pushes recorded.</p>
                )}
              </GlassCard>
            </div>

            {/* Primary technologies */}
            {o.github.primaryTechnologies.length > 0 && (
              <GlassCard hover={false} className="p-6">
                <h3 className="text-xs font-bold text-white/70 uppercase tracking-wider mb-4">
                  Primary Technologies
                </h3>
                <div className="flex flex-wrap gap-2">
                  {o.github.primaryTechnologies.map((t) => (
                    <span
                      key={t}
                      className="text-xs font-semibold px-3 py-1.5 rounded-full border border-white/10 bg-white/[0.03] text-white/70"
                    >
                      {t}
                    </span>
                  ))}
                </div>
              </GlassCard>
            )}
          </div>
        ) : (
          <GlassCard hover={false} className="flex flex-col items-center gap-3 p-8 text-center">
            <div className="w-11 h-11 rounded-2xl border border-white/10 bg-white/[0.03] flex items-center justify-center text-white/40">
              <FolderGit2 className="w-5 h-5" />
            </div>
            <p className="text-sm font-semibold text-white">
              Connect GitHub to unlock repository intelligence.
            </p>
            <Link
              to="/dashboard/settings"
              className="mt-1 text-xs font-bold uppercase tracking-widest px-5 py-2.5 rounded-full transition-all hover:-translate-y-0.5"
              style={{ backgroundColor: "hsl(var(--primary))", color: "hsl(var(--primary-foreground))" }}
            >
              Link GitHub
            </Link>
          </GlassCard>
        )}
      </div>

      {/* Skills */}
      {hasSkills && (
        <div>
          <SLabel>Recorded Skills</SLabel>
          <GlassCard hover={false} className="p-6">
            <div className="flex flex-wrap gap-2.5">
              {o.skillsList.map((skill) => {
                const color = TIER_COLOR[skill.currentLevel] ?? "#94a3b8";
                return (
                  <div
                    key={skill.id}
                    title={`${humanize(skill.category)} · ${humanize(skill.currentLevel)}`}
                    className="flex items-center gap-2.5 px-4 py-2.5 rounded-xl border border-white/[0.08] bg-white/[0.03]"
                  >
                    <span className="text-sm font-semibold text-white/80">{skill.name}</span>
                    <span
                      className="text-[9px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-full border"
                      style={{ color, borderColor: `${color}44`, background: `${color}12` }}
                    >
                      {humanize(skill.currentLevel)}
                    </span>
                  </div>
                );
              })}
            </div>
          </GlassCard>
        </div>
      )}

      {/* Nothing recorded at all */}
      {!hasSkills && !hasAnalyses && (
        <GlassCard hover={false} className="flex flex-col items-center gap-4 p-10 text-center">
          <div className="w-12 h-12 rounded-2xl border border-white/10 bg-white/[0.03] flex items-center justify-center text-white/40">
            <FolderGit2 className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-base font-bold text-white uppercase tracking-wider mb-2">
              Nothing to profile yet
            </h3>
            <p className="text-sm max-w-md" style={{ color: "var(--text-secondary)" }}>
              Your Developer 360 fills in as repositories are analyzed and skill evidence accumulates.
            </p>
          </div>
          <Link
            to="/dashboard/repositories"
            className="text-xs font-bold uppercase tracking-widest px-6 py-3 rounded-full transition-all hover:-translate-y-0.5 cursor-pointer"
            style={{ backgroundColor: "hsl(var(--primary))", color: "hsl(var(--primary-foreground))" }}
          >
            Connect a Repository
          </Link>
        </GlassCard>
      )}
    </motion.div>
  );
}
