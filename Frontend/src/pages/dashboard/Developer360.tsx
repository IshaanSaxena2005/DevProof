import { motion } from "motion/react";
import { Link } from "react-router-dom";
import { AlertCircle, FolderGit2 } from "lucide-react";
import GlassCard from "../../components/GlassCard";
import { SampleDataNotice } from "../../components/StateBlocks";

// TEMP DEVELOPMENT BYPASS: Using mock data instead of API calls
// Remove this and restore API calls when backend is ready

/* ── helpers ─────────────────────────────────────────── */

function scoreColor(n: number) {
  if (n >= 80) return "#77fc75";
  if (n >= 60) return "#f59e0b";
  return "#ef4444";
}

const CATEGORY_COLOR: Record<string, string> = {
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

const TIER_ORDER: string[] = [
  "CLAIMED",
  "LEARNED",
  "CREDENTIAL_VERIFIED",
  "PRACTICALLY_EVIDENCED",
];

const TIER_COLOR: Record<string, string> = {
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

// Mock data for development
const mockData = {
  developer360Score: 76,
  totalRepositories: 12,
  totalAnalyzed: 8,
  skillsList: [
    { id: "1", name: "React", category: "FRONTEND", currentLevel: "PRACTICALLY_EVIDENCED" },
    { id: "2", name: "TypeScript", category: "FRONTEND", currentLevel: "PRACTICALLY_EVIDENCED" },
    { id: "3", name: "Node.js", category: "BACKEND", currentLevel: "CREDENTIAL_VERIFIED" },
    { id: "4", name: "Python", category: "GENERAL", currentLevel: "LEARNED" },
    { id: "5", name: "PostgreSQL", category: "DATABASE", currentLevel: "CREDENTIAL_VERIFIED" },
  ],
  recentCertifications: ["AWS Solutions Architect", "Google Cloud Professional"],
  evidenceTiers: {
    CLAIMED: 3,
    LEARNED: 5,
    CREDENTIAL_VERIFIED: 8,
    PRACTICALLY_EVIDENCED: 12,
  },
  categoryBreakdown: [
    { category: "FRONTEND", score: 92, skillCount: 7 },
    { category: "BACKEND", score: 74, skillCount: 5 },
    { category: "DATABASE", score: 68, skillCount: 3 },
    { category: "TESTING", score: 45, skillCount: 2 },
    { category: "DEVOPS", score: 58, skillCount: 3 },
  ],
  user: {
    name: "Developer User",
    email: "developer@example.com",
    githubUsername: "devproof-user"
  }
};

export default function Developer360() {
  const o = mockData;
  const score = o.developer360Score;
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

      <SampleDataNotice what="Developer 360 profile uses sample data for development." />

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
            const count = o.evidenceTiers[tier as keyof typeof o.evidenceTiers] ?? 0;
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
