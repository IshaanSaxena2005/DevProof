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
  Circle,
} from "lucide-react";
import PageContainer from "../../components/PageContainer";
import GlassCard from "../../components/GlassCard";
import { ErrorBlock, LoadingBlock } from "../../components/StateBlocks";
import { api } from "../../lib/api";
import { certificationsService } from "../../services/certifications";
import { careerService } from "../../services/career";
import type { Developer360Response, RoleReadiness } from "../../lib/types";
import { useDemoMode, useDemoResource } from "../../demo/DemoContext";
import { sampleData } from "../../demo/sampleData.mts";
import { DemoNotice } from "../../demo/DemoNotice";

/* ── helpers ─────────────────────────────────────────── */

function scoreColor(n: number) {
  if (n >= 80) return "#77fc75";
  if (n >= 60) return "#f59e0b";
  return "#ef4444";
}

/** Weight 1-3 read back as the words it encodes, rather than as a bare number. */
const WEIGHT_LABEL: Record<number, string> = {
  3: "core",
  2: "important",
  1: "supporting",
};

/** Thin progress bar, the same anatomy used by the category bars below. */
function Bar({ score, color }: { score: number; color: string }) {
  return (
    <div className="h-1.5 rounded-full bg-white/[0.05] overflow-hidden">
      <motion.div
        initial={{ width: 0 }}
        animate={{ width: `${score}%` }}
        transition={{ duration: 0.9, delay: 0.2 }}
        className="h-full rounded-full"
        style={{ background: color, boxShadow: `0 0 6px ${color}55` }}
      />
    </div>
  );
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
  const isDemo = useDemoMode();
  const { data, loading, error, reload } = useDemoResource<Developer360Response>(
    () => api.get<Developer360Response>("/developer360/overview"),
    sampleData.developer360
  );
  // Certifications load independently; a failure here degrades to zero tiles
  // rather than failing the whole page (the overview data is the primary read).
  const { data: certData, loading: certsLoading } = useDemoResource(
    () => certificationsService.list(),
    sampleData.certificationsResponse
  );
  // Readiness is its own endpoint and its own failure: losing it costs the two
  // role panels, not the measured-evidence panels that come from the overview.
  // In the demo the scores are computed by the same role definitions over the
  // sample profile, since the endpoint is authenticated and cannot be called.
  const { data: readinessData, error: readinessError } = useDemoResource(
    () => careerService.readiness(),
    sampleData.career
  );

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
  const sampleNotice = isDemo ? (
    <DemoNotice className="mb-6">
      These role scores are illustrative sample output. They are computed from the demo's own sample
      skills, repository metrics and solve count using the same requirement weights the product uses —
      which is why the gaps below (no CI/CD pipeline, 29 of 100 problems solved) match the repositories
      and coding profile elsewhere in the demo.
    </DemoNotice>
  ) : null;
  const credentialVerified = o.evidenceTiers.CREDENTIAL_VERIFIED ?? 0;
  const practicallyEvidenced = o.evidenceTiers.PRACTICALLY_EVIDENCED ?? 0;

  // Evidence Summary — every tile measured from live endpoints.
  const evidenceTiles = [
    { icon: FolderGit2, label: "Repositories", value: String(o.totalRepositories), source: "connected" },
    // Not a count of analyses: the overview takes the latest analysis per
    // repository, so this is repositories that have one. See totalAnalyzed.
    { icon: Target, label: "Repos analyzed", value: String(o.totalAnalyzed), source: "at least once" },
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

  // Sorted highest-first by the backend; `bestMatch` is null when nothing has
  // been demonstrated yet, which is why the top role alone is not enough.
  const roles: RoleReadiness[] = readinessData?.readiness.roles ?? [];
  const best = readinessData?.readiness.bestMatch
    ? roles.find((r) => r.role === readinessData.readiness.bestMatch) ?? null
    : null;

  return (
    <PageContainer
      title="Career Readiness"
      description={
        isDemo
          ? "The sample profile's readiness against each role — illustrative output, computed from its own sample evidence."
          : "Role readiness matching and evidence-based career signals."
      }
    >
      {sampleNotice}

      {/* ── Readiness against the best-matching role ── */}
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
          {best ? (
            <>
              <p className="text-5xl font-extrabold tabular-nums" style={{ color: scoreColor(best.score) }}>
                {best.score}
                <span className="text-xl text-white/25 font-bold">/100</span>
              </p>
              <p className="text-[13px] max-w-md leading-relaxed" style={{ color: "var(--text-secondary)" }}>
                Your strongest match is <span className="text-white/80 font-semibold">{best.role}</span>, with{" "}
                {best.requirementsMet} of {best.requirementsTotal} requirements met. The score is the share of
                requirement weight you meet — not a model's opinion — and every requirement behind it is
                listed below.
              </p>
              <div className="max-w-sm w-full mt-1">
                <Bar score={best.score} color={scoreColor(best.score)} />
              </div>
            </>
          ) : (
            <>
              <p className="text-5xl font-extrabold text-white/25 select-none">—</p>
              <p className="text-[13px] max-w-md leading-relaxed" style={{ color: "var(--text-secondary)" }}>
                Readiness is computed from evidence you have recorded, and there is none yet. Analyze a
                repository, record a skill or add a certification and a score appears here — it is never
                estimated in the meantime.
              </p>
            </>
          )}
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

      {/* ── Role readiness, role by role, with the requirements behind each ── */}
      <div className="mb-6">
        <SLabel>Role Readiness Breakdown</SLabel>
        <GlassCard hover={false} className="p-6 md:p-8">
          {readinessError ? (
            <UnavailableNote>
              Readiness could not be loaded: {readinessError}. Every other figure on this page is
              unaffected.
            </UnavailableNote>
          ) : roles.length === 0 ? (
            <UnavailableNote>No roles are defined to assess against.</UnavailableNote>
          ) : (
            <div className="flex flex-col gap-8">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {roles.map((role) => (
                  <div
                    key={role.roleId}
                    className="rounded-xl border px-4 py-3.5"
                    style={{
                      borderColor: role === best ? `${scoreColor(role.score)}40` : "rgba(255,255,255,0.07)",
                      background: role === best ? `${scoreColor(role.score)}0d` : "rgba(255,255,255,0.02)",
                    }}
                  >
                    <div className="flex items-baseline justify-between gap-2 mb-2">
                      <p className="text-[10px] font-bold uppercase tracking-widest text-white/35 truncate" title={role.role}>
                        {role.role}
                      </p>
                      <p className="text-sm font-bold tabular-nums shrink-0" style={{ color: scoreColor(role.score) }}>
                        {role.score}%
                      </p>
                    </div>
                    <Bar score={role.score} color={scoreColor(role.score)} />
                    <p className="text-[10px] text-white/25 mt-2">
                      {role.requirementsMet} of {role.requirementsTotal} requirements met
                    </p>
                  </div>
                ))}
              </div>

              {best && (
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-widest text-white/35 mb-1">
                    What {best.role} asks for
                  </p>
                  <p className="text-[11px] text-white/25 mb-4">{best.summary}</p>
                  <div className="flex flex-col divide-y divide-white/[0.05]">
                    {best.requirements.map((r) => (
                      <div key={r.id} className="flex items-start gap-3 py-2.5 first:pt-0 last:pb-0">
                        {r.met ? (
                          <CheckCircle className="w-3.5 h-3.5 text-primary shrink-0 mt-0.5" />
                        ) : (
                          <Circle className="w-3.5 h-3.5 text-white/20 shrink-0 mt-0.5" />
                        )}
                        <span className="min-w-0 flex-1">
                          <span className={`text-[12px] block ${r.met ? "text-white/70" : "text-white/45"}`}>
                            {r.label}
                          </span>
                          <span className="text-[11px] text-white/25 block">{r.evidence}</span>
                        </span>
                        <span className="text-[10px] text-white/20 shrink-0 mt-0.5 uppercase tracking-widest">
                          {WEIGHT_LABEL[r.weight] ?? `weight ${r.weight}`}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </GlassCard>
      </div>

      {/* ── Footnote ── */}
      <GlassCard hover={false} className="p-5">
        <p className="text-[12px] leading-relaxed" style={{ color: "var(--text-tertiary)" }}>
          Every count on this page is measured from your connected repositories, completed analyses,
          recorded skills, and saved certifications. The readiness percentages are arithmetic over
          those records, not a prediction: each one is the share of requirement weight met, and every
          requirement names the evidence that did or did not satisfy it.
        </p>
      </GlassCard>
    </PageContainer>
  );
}
