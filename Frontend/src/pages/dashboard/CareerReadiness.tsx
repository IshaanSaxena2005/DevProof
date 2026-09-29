import { motion } from "motion/react";
import {
  Briefcase,
  CheckCircle,
  AlertTriangle,
  FolderGit2,
  Target,
  Award,
  Code2,
  Info,
  Gauge,
  TrendingUp,
} from "lucide-react";
import PageContainer from "../../components/PageContainer";
import GlassCard from "../../components/GlassCard";
import { ErrorBlock, LoadingBlock } from "../../components/StateBlocks";
import { api } from "../../lib/api";
import { useResource } from "../../lib/useResource";
import { certificationsService } from "../../services/certifications";
import type { Developer360Response } from "../../lib/types";

/* ── helpers ─────────────────────────────────────────── */

function scoreColor(n: number) {
  if (n >= 80) return "#77fc75";
  if (n >= 60) return "#f59e0b";
  return "#ef4444";
}

function SLabel({ children }: { children: React.ReactNode }) {
  return <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-white/30 mb-4">{children}</p>;
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

export default function CareerReadiness() {
  const { data, loading, error, reload } = useResource<Developer360Response>(
    () => api.get<Developer360Response>("/developer360/overview")
  );
  // Certifications load independently; a failure here degrades to zero tiles
  // rather than failing the whole page (the overview data is the primary read).
  const { data: certData, loading: certsLoading } = useResource(() => certificationsService.list());

  if (loading || certsLoading) {
    return (
      <PageContainer title="Career Readiness" description="Role readiness matching and evidence-based career signals.">
        <LoadingBlock label="Loading your career evidence…" />
      </PageContainer>
    );
  }

  if (error || !data?.overview) {
    return (
      <PageContainer title="Career Readiness" description="Role readiness matching and evidence-based career signals.">
        <ErrorBlock message={error ?? "No overview data returned."} onRetry={reload} />
      </PageContainer>
    );
  }

  const o = data.overview;
  const score = o.developer360Score !== null ? Math.round(o.developer360Score) : null;
  const certifications = certData?.certifications ?? [];
  const credentialVerified = o.evidenceTiers.CREDENTIAL_VERIFIED ?? 0;
  const practicallyEvidenced = o.evidenceTiers.PRACTICALLY_EVIDENCED ?? 0;

  // Evidence Summary — every tile measured from live endpoints.
  const evidenceTiles = [
    { icon: FolderGit2, label: "Repositories", value: String(o.totalRepositories), source: "connected" },
    { icon: Target, label: "Analyses", value: String(o.totalAnalyzed), source: "completed" },
    { icon: Code2, label: "Skills", value: String(o.skillsList.length), source: `${practicallyEvidenced} evidenced` },
    { icon: Award, label: "Certifications", value: String(certifications.length), source: certifications.length > 0 ? "recorded" : "none yet" },
    { icon: CheckCircle, label: "Credential-Verified", value: String(credentialVerified), source: "skill tier" },
    {
      icon: Gauge,
      label: "Developer Score",
      value: score !== null ? String(score) : "—",
      source: score !== null ? "/ 100 average" : "not measured",
    },
  ];

  // Strongest categories — real averaged scores from the evidence ladder.
  const strongestCategories = [...o.categoryBreakdown]
    .filter((c) => c.score !== null)
    .sort((a, b) => (b.score as number) - (a.score as number))
    .slice(0, 3);
  const weakestCategories = [...o.categoryBreakdown]
    .filter((c) => c.score !== null)
    .sort((a, b) => (a.score as number) - (b.score as number))
    .slice(0, 2);

  const hasAnyEvidence = o.totalAnalyzed > 0 || o.skillsList.length > 0 || certifications.length > 0;

  return (
    <PageContainer
      title="Career Readiness"
      description="Role readiness matching and evidence-based career signals."
    >
      {/* ── Readiness score: honestly unavailable — no backend model exists ── */}
      <GlassCard hover={false} className="p-8 mb-6 text-center relative overflow-hidden">
        <div
          className="absolute inset-0 pointer-events-none"
          style={{ background: "radial-gradient(ellipse at 50% 0%, rgba(119,252,117,0.05) 0%, transparent 55%)" }}
        />
        <div className="relative flex flex-col items-center gap-3">
          <div className="w-12 h-12 rounded-2xl border border-white/10 bg-white/[0.03] flex items-center justify-center text-white/35">
            <Briefcase className="w-6 h-6" />
          </div>
          <h2 className="text-lg font-bold text-white uppercase tracking-wider">Career Readiness Score</h2>
          <p className="text-5xl font-extrabold text-white/25 select-none">—</p>
          <p className="text-[13px] max-w-md leading-relaxed" style={{ color: "var(--text-secondary)" }}>
            DevProof does not compute a readiness score yet — there is no role-matching model in the
            backend, so no number is shown here rather than an invented one.
          </p>
          <div className="rounded-xl border border-amber-400/20 bg-amber-400/[0.06] px-4 py-2.5 mt-1">
            <p className="text-[11px] text-amber-100/70 font-semibold uppercase tracking-widest">
              Role matching — coming soon
            </p>
          </div>
        </div>
      </GlassCard>

      {/* ── Measured evidence standing ── */}
      <div className="mb-6">
        <SLabel>Evidence Summary</SLabel>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          {evidenceTiles.map((tile, i) => (
            <motion.div
              key={tile.label}
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.05 * i, duration: 0.4 }}
              className="rounded-2xl border border-white/[0.08] bg-white/[0.03] p-4 text-center"
            >
              <tile.icon className="w-5 h-5 text-primary mx-auto mb-2" />
              <p className="text-xl font-bold text-white tabular-nums">{tile.value}</p>
              <p className="text-[11px] text-white/40 mt-0.5">{tile.label}</p>
              <p className="text-[10px] text-white/25 mt-0.5">{tile.source}</p>
            </motion.div>
          ))}
        </div>
      </div>

      {/* ── Strongest / weakest categories — real category averages ── */}
      {strongestCategories.length > 0 && (
        <div className="mb-6">
          <SLabel>Measured Skill Standing</SLabel>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <GlassCard hover={false} className="p-6">
              <h3 className="text-sm font-bold text-white uppercase tracking-wider mb-4 flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-primary" /> Strongest Categories
              </h3>
              <div className="space-y-3">
                {strongestCategories.map((c) => (
                  <div key={c.category}>
                    <div className="flex items-center justify-between text-[12px] mb-1.5">
                      <span className="text-white/70">{c.category.charAt(0) + c.category.slice(1).toLowerCase().replace(/_/g, " ")}</span>
                      <span className="text-white/45 tabular-nums font-semibold">{c.score}/100 · {c.skillCount} skills</span>
                    </div>
                    <div className="h-1.5 rounded-full bg-white/[0.05] overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${c.score}%` }}
                        transition={{ duration: 0.9, delay: 0.2 }}
                        className="h-full rounded-full"
                        style={{ background: scoreColor(c.score as number), boxShadow: `0 0 6px ${scoreColor(c.score as number)}55` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </GlassCard>

            <GlassCard hover={false} className="p-6">
              <h3 className="text-sm font-bold text-white uppercase tracking-wider mb-4 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-400" /> Development Areas
              </h3>
              {weakestCategories.length > 0 ? (
                <div className="space-y-3">
                  {weakestCategories.map((c) => (
                    <div key={c.category}>
                      <div className="flex items-center justify-between text-[12px] mb-1.5">
                        <span className="text-white/70">{c.category.charAt(0) + c.category.slice(1).toLowerCase().replace(/_/g, " ")}</span>
                        <span className="text-white/45 tabular-nums font-semibold">{c.score}/100 · {c.skillCount} skills</span>
                      </div>
                      <div className="h-1.5 rounded-full bg-white/[0.05] overflow-hidden">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${c.score}%` }}
                          transition={{ duration: 0.9, delay: 0.3 }}
                          className="h-full rounded-full"
                          style={{ background: scoreColor(c.score as number), boxShadow: `0 0 6px ${scoreColor(c.score as number)}55` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <UnavailableNote>No recorded skill categories yet.</UnavailableNote>
              )}
            </GlassCard>
          </div>
        </div>
      )}

      {/* ── Evidence ladder ── */}
      <div className="mb-6">
        <SLabel>Skill Evidence Ladder</SLabel>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {(
            [
              ["CLAIMED", "Claimed", "#94a3b8"],
              ["LEARNED", "Learned", "#60a5fa"],
              ["CREDENTIAL_VERIFIED", "Credential verified", "#a78bfa"],
              ["PRACTICALLY_EVIDENCED", "Practically evidenced", "#77fc75"],
            ] as const
          ).map(([tier, label, color], i) => (
            <motion.div
              key={tier}
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.05 * i, duration: 0.4 }}
              className="rounded-2xl border border-white/[0.08] bg-white/[0.03] p-5"
            >
              <div className="flex items-center gap-2 mb-2">
                <span className="w-2 h-2 rounded-full" style={{ background: color, boxShadow: `0 0 6px ${color}88` }} />
                <span className="text-[10px] font-bold uppercase tracking-widest text-white/35">{label}</span>
              </div>
              <p className="text-3xl font-bold tabular-nums" style={{ color }}>{o.evidenceTiers[tier] ?? 0}</p>
              <p className="text-[11px] text-white/25 mt-1">{(o.evidenceTiers[tier] ?? 0) === 1 ? "skill" : "skills"}</p>
            </motion.div>
          ))}
        </div>
      </div>

      {/* ── Readiness breakdown: unavailable until the model exists ── */}
      <div className="mb-6">
        <SLabel>Role Readiness Breakdown</SLabel>
        <GlassCard hover={false} className="p-6 md:p-8">
          <div className="flex flex-col items-center text-center gap-3 py-4">
            <div className="w-11 h-11 rounded-2xl border border-white/10 bg-white/[0.03] flex items-center justify-center text-white/35">
              <TrendingUp className="w-5 h-5" />
            </div>
            <h3 className="text-sm font-bold text-white uppercase tracking-wider">
              {hasAnyEvidence ? "Awaiting the readiness model" : "No evidence to assess yet"}
            </h3>
            <p className="text-[12px] max-w-md leading-relaxed" style={{ color: "var(--text-secondary)" }}>
              {hasAnyEvidence
                ? "Your evidence base is growing — analyses, skills, and credentials are recorded. Role-by-role readiness percentages require the role-matching model, which is not built yet."
                : "Analyze repositories, record skills, and add certifications — the readiness model will consume exactly this evidence when it ships."}
            </p>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-3 w-full">
              {["Frontend", "Backend", "Full Stack", "SDE-1"].map((role) => (
                <div key={role} className="rounded-xl border border-white/[0.07] bg-white/[0.02] px-3 py-3">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-white/30">{role}</p>
                  <p className="text-sm font-bold text-white/25 mt-1.5">—</p>
                </div>
              ))}
            </div>
          </div>
        </GlassCard>
      </div>

      {/* ── Footnote ── */}
      <GlassCard hover={false} className="p-5">
        <p className="text-[12px] leading-relaxed" style={{ color: "var(--text-tertiary)" }}>
          Every count on this page is measured from your connected repositories, completed analyses,
          recorded skills, and saved certifications. The career readiness score and role percentages
          are hidden rather than estimated — DevProof will only show them once a real readiness model
          produces them.
        </p>
      </GlassCard>
    </PageContainer>
  );
}
