import { useState } from "react";
import { motion } from "motion/react";
import {
  Sparkles,
  RefreshCw,
  Plus,
  Trash2,
  ChevronDown,
  Loader2,
  BadgeCheck,
  FolderGit2,
} from "lucide-react";
import PageContainer from "../../components/PageContainer";
import GlassCard from "../../components/GlassCard";
import EmptyState from "../../components/EmptyState";
import { ErrorBlock, LoadingBlock } from "../../components/StateBlocks";
import { ApiError } from "../../lib/api";
import { useResource } from "../../lib/useResource";
import { skillsService } from "../../services/skills";
import type {
  EvidenceLevel,
  SkillCategory,
  SkillWithEvidence,
  SkillsResponse,
} from "../../lib/types";

/* ── presentation helpers ────────────────────────────── */

const CATEGORY_ORDER: SkillCategory[] = [
  "FRONTEND",
  "BACKEND",
  "DATABASE",
  "TESTING",
  "DEVOPS",
  "SECURITY",
  "ML",
  "GENERAL",
];

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

const LEVEL_LABEL: Record<EvidenceLevel, string> = {
  CLAIMED: "Claimed",
  LEARNED: "Learned",
  CREDENTIAL_VERIFIED: "Credential verified",
  PRACTICALLY_EVIDENCED: "Practically evidenced",
};

const LEVEL_COLOR: Record<EvidenceLevel, string> = {
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

/** REPOSITORY_LANGUAGE -> Language, ANALYSIS_SIGNAL -> Analysis */
function evidenceLabel(evidenceType: string) {
  if (evidenceType === "REPOSITORY_LANGUAGE") return "Language";
  if (evidenceType === "REPOSITORY_TOPIC") return "Topic";
  if (evidenceType === "ANALYSIS_SIGNAL") return "Analysis";
  return humanize(evidenceType);
}

function confidenceColor(n: number) {
  if (n >= 80) return "#77fc75";
  if (n >= 60) return "#f59e0b";
  return "#94a3b8";
}

/* ── page ────────────────────────────────────────────── */

export default function Skills() {
  const { data, loading, error, reload } = useResource<SkillsResponse>(
    () => skillsService.getSkills(),
    []
  );

  const [deriving, setDeriving] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const [expanded, setExpanded] = useState<string | null>(null);

  const [showAdd, setShowAdd] = useState(false);
  const [newName, setNewName] = useState("");
  const [newCategory, setNewCategory] = useState<SkillCategory>("GENERAL");
  const [adding, setAdding] = useState(false);

  const skills = data?.skills ?? [];

  async function runDerive() {
    setDeriving(true);
    setActionError(null);
    try {
      await skillsService.deriveSkills();
      reload();
    } catch (err) {
      setActionError(
        err instanceof ApiError ? err.message : "Could not derive skills from your repositories."
      );
    } finally {
      setDeriving(false);
    }
  }

  async function addSkill(e: React.FormEvent) {
    e.preventDefault();
    if (!newName.trim()) return;
    setAdding(true);
    setActionError(null);
    try {
      await skillsService.addSkill(newName.trim(), newCategory);
      setNewName("");
      setShowAdd(false);
      reload();
    } catch (err) {
      setActionError(err instanceof ApiError ? err.message : "Could not add that skill.");
    } finally {
      setAdding(false);
    }
  }

  async function removeSkill(skill: SkillWithEvidence) {
    setActionError(null);
    try {
      await skillsService.deleteSkill(skill.id);
      reload();
    } catch (err) {
      setActionError(
        err instanceof ApiError ? err.message : `Could not remove ${skill.name}.`
      );
    }
  }

  // Evidence ladder counts. Every tier is rendered even at zero, so the ladder
  // reads as a scale rather than only the tiers that happen to be populated.
  const tierCounts = (["CLAIMED", "LEARNED", "CREDENTIAL_VERIFIED", "PRACTICALLY_EVIDENCED"] as EvidenceLevel[]).map(
    (tier) => ({ tier, count: skills.filter((s) => s.currentLevel === tier).length })
  );

  // Only categories that actually contain a skill — an empty category is not a
  // measurement of zero, it simply has nothing to say.
  const categories = CATEGORY_ORDER.map((category) => {
    const inCategory = skills.filter((s) => s.category === category);
    return {
      category,
      count: inCategory.length,
      average:
        inCategory.length > 0
          ? Math.round(inCategory.reduce((sum, s) => sum + s.confidence, 0) / inCategory.length)
          : null,
    };
  }).filter((c) => c.count > 0);

  const evidencedCount = skills.filter((s) => s.currentLevel === "PRACTICALLY_EVIDENCED").length;
  const totalEvidence = skills.reduce((sum, s) => sum + s.evidences.length, 0);

  return (
    <PageContainer
      title="Skills Intelligence"
      description="Technologies your repositories actually demonstrate, and the evidence behind each one."
    >
      {loading && <LoadingBlock label="Loading your skills…" />}

      {!loading && error && <ErrorBlock message={error} onRetry={reload} />}

      {!loading && !error && data && (
        <>
          {/* Actions */}
          <div className="flex flex-wrap items-center gap-3 mb-6">
            <button
              onClick={runDerive}
              disabled={deriving}
              className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest px-5 py-2.5 rounded-full border border-white/10 bg-white/[0.04] text-white/80 hover:bg-white/[0.08] hover:border-white/20 transition-all cursor-pointer disabled:opacity-50"
            >
              {deriving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <RefreshCw className="w-3.5 h-3.5" />}
              {deriving ? "Deriving…" : "Derive from repositories"}
            </button>
            <button
              onClick={() => { setShowAdd((v) => !v); setActionError(null); }}
              className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest px-5 py-2.5 rounded-full border border-white/10 bg-white/[0.04] text-white/80 hover:bg-white/[0.08] hover:border-white/20 transition-all cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              {showAdd ? "Cancel" : "Add a skill"}
            </button>
          </div>

          {actionError && (
            <div className="mb-6 rounded-2xl border border-red-500/25 bg-red-500/[0.08] px-5 py-3.5">
              <p className="text-[13px] text-red-300">{actionError}</p>
            </div>
          )}

          {showAdd && (
            <form onSubmit={addSkill} className="mb-6 glass-panel p-5 flex flex-wrap items-end gap-3">
              <div className="flex-1 min-w-[200px]">
                <label className="block text-[11px] uppercase tracking-widest text-white/40 mb-2">
                  Skill name
                </label>
                <input
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  placeholder="e.g. Kubernetes"
                  className="w-full rounded-xl border border-white/10 bg-white/[0.03] px-4 py-2.5 text-sm text-white placeholder:text-white/25 outline-none focus:border-white/25"
                />
              </div>
              <div>
                <label className="block text-[11px] uppercase tracking-widest text-white/40 mb-2">
                  Category
                </label>
                <select
                  value={newCategory}
                  onChange={(e) => setNewCategory(e.target.value as SkillCategory)}
                  className="rounded-xl border border-white/10 bg-white/[0.03] px-4 py-2.5 text-sm text-white outline-none focus:border-white/25"
                >
                  {CATEGORY_ORDER.map((c) => (
                    <option key={c} value={c} className="bg-[#0b0b0b]">
                      {humanize(c)}
                    </option>
                  ))}
                </select>
              </div>
              <button
                type="submit"
                disabled={adding || !newName.trim()}
                className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest px-5 py-2.5 rounded-full transition-all cursor-pointer disabled:opacity-40"
                style={{ backgroundColor: "hsl(var(--primary))", color: "hsl(var(--primary-foreground))" }}
              >
                {adding && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                {adding ? "Adding…" : "Add"}
              </button>
              <p className="w-full text-[12px]" style={{ color: "var(--text-tertiary)" }}>
                Added skills are recorded as <strong className="text-white/60">Claimed</strong> — the
                bottom of the evidence ladder. They are promoted automatically if your repositories
                turn out to demonstrate them.
              </p>
            </form>
          )}

          {skills.length === 0 ? (
            <EmptyState
              icon={FolderGit2}
              title="No skills recorded yet"
              description="Skills are derived from the repositories you have analyzed — their languages, topics and measured signals. Analyze a repository, then derive, and they will appear here with the evidence behind them."
              actionText="Derive from repositories"
              onAction={runDerive}
            />
          ) : (
            <>
              {/* Summary */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
                {[
                  { label: "Skills recorded", value: skills.length, icon: Sparkles },
                  { label: "Practically evidenced", value: evidencedCount, icon: BadgeCheck },
                  { label: "Evidence records", value: totalEvidence, icon: FolderGit2 },
                ].map((stat, i) => (
                  <motion.div
                    key={stat.label}
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.05 * i, duration: 0.4 }}
                    className="glass-panel p-5 flex items-center gap-4"
                  >
                    <div className="w-11 h-11 rounded-2xl border border-white/10 bg-white/[0.03] flex items-center justify-center text-primary shrink-0">
                      <stat.icon className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-white">{stat.value}</p>
                      <p className="text-xs mt-0.5" style={{ color: "var(--text-tertiary)" }}>
                        {stat.label}
                      </p>
                    </div>
                  </motion.div>
                ))}
              </div>

              {/* Evidence ladder */}
              <motion.div
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.45, delay: 0.1 }}
                className="glass-panel p-6 mb-6"
              >
                <h2 className="text-lg font-semibold text-white mb-4">Evidence Ladder</h2>
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                  {tierCounts.map(({ tier, count }) => (
                    <div key={tier} className="glass-inset p-4">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="w-2 h-2 rounded-full" style={{ background: LEVEL_COLOR[tier] }} />
                        <span className="text-[11px] uppercase tracking-widest" style={{ color: "var(--text-tertiary)" }}>
                          {LEVEL_LABEL[tier]}
                        </span>
                      </div>
                      <p className="text-2xl font-bold text-white">{count}</p>
                    </div>
                  ))}
                </div>
              </motion.div>

              {/* Categories */}
              {categories.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.45, delay: 0.15 }}
                  className="glass-panel p-6 mb-6"
                >
                  <h2 className="text-lg font-semibold text-white mb-4">Categories</h2>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                    {categories.map((c) => (
                      <div key={c.category} className="glass-inset p-4">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-white text-sm font-medium">{humanize(c.category)}</span>
                          <span className="text-xs" style={{ color: "var(--text-tertiary)" }}>
                            {c.count} {c.count === 1 ? "skill" : "skills"}
                          </span>
                        </div>
                        <div className="w-full h-1.5 bg-white/10 rounded-full overflow-hidden">
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${c.average ?? 0}%` }}
                            transition={{ duration: 0.7 }}
                            className="h-full rounded-full"
                            style={{ background: CATEGORY_COLOR[c.category] }}
                          />
                        </div>
                        <p className="text-xs mt-2" style={{ color: "var(--text-tertiary)" }}>
                          Average confidence {c.average}/100
                        </p>
                      </div>
                    ))}
                  </div>
                </motion.div>
              )}

              {/* Skills + evidence */}
              <motion.div
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.45, delay: 0.2 }}
                className="glass-panel p-6"
              >
                <h2 className="text-lg font-semibold text-white mb-4">Recorded Skills</h2>
                <div className="flex flex-col gap-2">
                  {skills.map((skill) => {
                    const open = expanded === skill.id;
                    return (
                      <div key={skill.id} className="glass-inset overflow-hidden">
                        <div className="p-4 flex items-center gap-4">
                          <button
                            onClick={() => setExpanded(open ? null : skill.id)}
                            className="flex-1 flex items-center gap-4 text-left cursor-pointer"
                          >
                            <ChevronDown
                              className={`w-4 h-4 shrink-0 transition-transform ${open ? "rotate-180" : ""}`}
                              style={{ color: "var(--text-tertiary)" }}
                            />
                            <div className="flex-1 min-w-0">
                              <div className="flex flex-wrap items-center gap-2">
                                <span className="text-white text-sm font-medium">{skill.name}</span>
                                <span
                                  className="text-[10px] px-2 py-0.5 rounded-full font-medium"
                                  style={{
                                    background: `${LEVEL_COLOR[skill.currentLevel]}20`,
                                    color: LEVEL_COLOR[skill.currentLevel],
                                  }}
                                >
                                  {LEVEL_LABEL[skill.currentLevel]}
                                </span>
                                <span className="text-[10px] px-2 py-0.5 rounded-full bg-white/[0.06] text-white/50">
                                  {humanize(skill.category)}
                                </span>
                              </div>
                              <div className="flex items-center gap-3 mt-2">
                                <div className="flex-1 max-w-[220px] h-1.5 bg-white/10 rounded-full overflow-hidden">
                                  <motion.div
                                    initial={{ width: 0 }}
                                    animate={{ width: `${skill.confidence}%` }}
                                    transition={{ duration: 0.7 }}
                                    className="h-full rounded-full"
                                    style={{ background: confidenceColor(skill.confidence) }}
                                  />
                                </div>
                                <span className="text-xs" style={{ color: "var(--text-tertiary)" }}>
                                  {skill.confidence}/100 · {skill.evidences.length}{" "}
                                  {skill.evidences.length === 1 ? "source" : "sources"}
                                </span>
                              </div>
                            </div>
                          </button>
                          <button
                            onClick={() => removeSkill(skill)}
                            title={`Remove ${skill.name}`}
                            className="shrink-0 w-8 h-8 rounded-lg border border-white/10 flex items-center justify-center text-white/40 hover:text-red-400 hover:border-red-400/30 transition-all cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>

                        {open && (
                          <div className="px-4 pb-4 pl-12 flex flex-col gap-2">
                            {skill.evidences.length === 0 ? (
                              <p className="text-[13px]" style={{ color: "var(--text-tertiary)" }}>
                                No repository evidence yet — this skill is recorded as claimed only.
                              </p>
                            ) : (
                              skill.evidences.map((evidence) => (
                                <div
                                  key={evidence.id}
                                  className="rounded-xl border border-white/[0.06] bg-white/[0.02] px-4 py-3"
                                >
                                  <div className="flex flex-wrap items-center gap-2 mb-1">
                                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-white/[0.06] text-white/50">
                                      {evidenceLabel(evidence.evidenceType)}
                                    </span>
                                    {evidence.sourceUrl ? (
                                      <a
                                        href={evidence.sourceUrl}
                                        target="_blank"
                                        rel="noreferrer"
                                        className="text-[13px] text-white/80 hover:text-primary transition-colors"
                                      >
                                        {evidence.title}
                                      </a>
                                    ) : (
                                      <span className="text-[13px] text-white/80">{evidence.title}</span>
                                    )}
                                  </div>
                                  {evidence.snippet && (
                                    <p className="text-[12px]" style={{ color: "var(--text-secondary)" }}>
                                      {evidence.snippet}
                                    </p>
                                  )}
                                </div>
                              ))
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </motion.div>

              <GlassCard hover={false} className="p-5 mt-6">
                <p className="text-[12px] leading-relaxed" style={{ color: "var(--text-tertiary)" }}>
                  Confidence reflects how many independent repositories support a skill, and
                  saturates below 100 — this is inference from evidence, never certainty. Skills
                  inferred from the absence of a finding, such as a clean security scan, are capped
                  lower still, because the analysis samples a subset of each repository.
                </p>
              </GlassCard>
            </>
          )}
        </>
      )}
    </PageContainer>
  );
}
