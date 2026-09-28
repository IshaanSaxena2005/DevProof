import { motion } from "motion/react";
import { useNavigate } from "react-router-dom";
import {
  Sparkles,
  AlertTriangle,
  Lightbulb,
  CheckCircle2,
  FolderGit2,
  RefreshCw,
} from "lucide-react";
import PageContainer from "../../components/PageContainer";
import GlassCard from "../../components/GlassCard";
import EmptyState from "../../components/EmptyState";
import { ErrorBlock, LoadingBlock } from "../../components/StateBlocks";
import { api } from "../../lib/api";
import { useResource } from "../../lib/useResource";
import type { AiInsightsResponse, InsightPriority } from "../../lib/types";

/* ── helpers ─────────────────────────────────────────── */

function scoreColor(n: number) {
  if (n >= 80) return "#77fc75";
  if (n >= 60) return "#f59e0b";
  return "#ef4444";
}

const PRIORITY_COLOR: Record<InsightPriority, string> = {
  HIGH: "#ef4444",
  MEDIUM: "#f59e0b",
  LOW: "#60a5fa",
};

/** HIGH -> High */
function humanizePriority(value: InsightPriority) {
  return value.charAt(0) + value.slice(1).toLowerCase();
}

/**
 * Average analysis score across the user's analyzed repositories.
 *
 * score=null renders an empty track and a dash rather than a zero — the backend
 * returns null when nothing has been analyzed, and a 0 on this dial would read
 * as a measured result of "terrible" instead of "not measured".
 */
function ScoreRing({ score, size = 148 }: { score: number | null; size?: number }) {
  const r = (size - 24) / 2;
  const c = 2 * Math.PI * r;
  const offset = score !== null ? c - (score / 100) * c : c;
  const col = score !== null ? scoreColor(score) : "rgba(255,255,255,0.15)";

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="-rotate-90">
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="10" />
      <motion.circle
        cx={size / 2}
        cy={size / 2}
        r={r}
        fill="none"
        stroke={col}
        strokeWidth="10"
        strokeLinecap="round"
        strokeDasharray={c}
        initial={{ strokeDashoffset: c }}
        animate={{ strokeDashoffset: offset }}
        transition={{ duration: 0.9, ease: "easeOut" }}
      />
    </svg>
  );
}

/* ── page ────────────────────────────────────────────── */

export default function AiInsights() {
  const navigate = useNavigate();
  const { data, loading, error, reload } = useResource<AiInsightsResponse>(
    () => api.get<AiInsightsResponse>("/ai/insights"),
    []
  );

  return (
    <PageContainer
      title="DevProof Intelligence"
      description="AI-powered engineering analysis, generated only from your analyzed repositories."
    >
      {loading && <LoadingBlock label="Generating insights from your analysis evidence…" />}

      {!loading && error && <ErrorBlock message={error} onRetry={reload} />}

      {!loading && !error && data && !data.hasEvidence && (
        <EmptyState
          icon={FolderGit2}
          title="No analysis evidence yet"
          description="DevProof Intelligence reports only on repositories that have actually been analyzed. Run an analysis on at least one repository and the model will summarize what the evidence shows."
          actionText="Go to repositories"
          onAction={() => navigate("/dashboard/repositories")}
        />
      )}

      {!loading && !error && data?.hasEvidence && data.insights && (
        <>
          {/* Evidence header. The two numbers here are measured, not generated. */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="glass-panel p-8 mb-6 flex flex-col md:flex-row items-center gap-8"
          >
            <div className="relative shrink-0">
              <ScoreRing score={data.evidence.averageScore} />
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-4xl font-bold text-white">
                  {data.evidence.averageScore ?? "—"}
                </span>
                <span className="text-[11px] uppercase tracking-widest text-white/40 mt-1">
                  Avg score
                </span>
              </div>
            </div>

            <div className="flex-1 text-center md:text-left">
              <div className="flex items-center justify-center md:justify-start gap-2 mb-3">
                <Sparkles className="w-5 h-5 text-primary" />
                <h2 className="text-lg font-semibold text-white">Executive Summary</h2>
              </div>
              <p className="text-base leading-relaxed" style={{ color: "var(--text-secondary)" }}>
                {data.insights.summary}
              </p>
              <p className="text-xs mt-4" style={{ color: "var(--text-tertiary)" }}>
                Based on {data.evidence.repositoriesAnalyzed} analyzed{" "}
                {data.evidence.repositoriesAnalyzed === 1 ? "repository" : "repositories"}.
              </p>
            </div>

            <button
              onClick={reload}
              className="shrink-0 flex items-center gap-2 text-xs font-bold uppercase tracking-widest px-5 py-2.5 rounded-full border border-white/10 bg-white/[0.04] text-white/80 hover:bg-white/[0.08] hover:border-white/20 transition-all cursor-pointer"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              Regenerate
            </button>
          </motion.div>

          {/* Strengths */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="glass-panel p-6 mb-6"
          >
            <div className="flex items-center gap-3 mb-4">
              <CheckCircle2 className="w-5 h-5 text-[#77fc75]" />
              <h2 className="text-lg font-semibold text-white">Key Strengths</h2>
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
              {data.insights.strengths.map((strength, index) => (
                <motion.div
                  key={strength.title}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.3, delay: 0.2 + index * 0.05 }}
                  className="glass-inset p-4"
                >
                  <h3 className="text-white font-medium text-sm mb-1.5">{strength.title}</h3>
                  <p className="text-[13px] leading-relaxed" style={{ color: "var(--text-secondary)" }}>
                    {strength.detail}
                  </p>
                </motion.div>
              ))}
            </div>
          </motion.div>

          {/* Risks. The model may legitimately return none, so this hides entirely. */}
          {data.insights.risks.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="glass-panel p-6 mb-6"
            >
              <div className="flex items-center gap-3 mb-4">
                <AlertTriangle className="w-5 h-5 text-amber-400" />
                <h2 className="text-lg font-semibold text-white">Risk Analysis</h2>
              </div>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
                {data.insights.risks.map((risk, index) => (
                  <motion.div
                    key={risk.title}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.3, delay: 0.3 + index * 0.05 }}
                    className="glass-inset p-4"
                  >
                    <div className="flex items-start justify-between gap-3 mb-2">
                      <h3 className="text-white font-medium text-sm">{risk.title}</h3>
                      <span
                        className="text-[11px] px-2 py-1 rounded-full shrink-0 font-medium"
                        style={{
                          background: `${PRIORITY_COLOR[risk.severity]}20`,
                          color: PRIORITY_COLOR[risk.severity],
                        }}
                      >
                        {humanizePriority(risk.severity)}
                      </span>
                    </div>
                    <p className="text-[13px] leading-relaxed" style={{ color: "var(--text-secondary)" }}>
                      {risk.detail}
                    </p>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          )}

          {/* Recommendations */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="glass-panel p-6 mb-6"
          >
            <div className="flex items-center gap-3 mb-4">
              <Lightbulb className="w-5 h-5 text-primary" />
              <h2 className="text-lg font-semibold text-white">Recommendations</h2>
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
              {data.insights.recommendations.map((rec, index) => (
                <motion.div
                  key={rec.title}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.3, delay: 0.4 + index * 0.05 }}
                  className="glass-inset p-4"
                >
                  <div className="flex items-start justify-between gap-3 mb-2">
                    <h3 className="text-white font-medium text-sm">{rec.title}</h3>
                    <span
                      className="text-[11px] px-2 py-1 rounded-full shrink-0 font-medium"
                      style={{
                        background: `${PRIORITY_COLOR[rec.priority]}20`,
                        color: PRIORITY_COLOR[rec.priority],
                      }}
                    >
                      {humanizePriority(rec.priority)}
                    </span>
                  </div>
                  <p className="text-[13px] leading-relaxed" style={{ color: "var(--text-secondary)" }}>
                    {rec.rationale}
                  </p>
                </motion.div>
              ))}
            </div>
          </motion.div>

          <GlassCard hover={false} className="p-5">
            <p className="text-[12px] leading-relaxed" style={{ color: "var(--text-tertiary)" }}>
              Every item above is generated from the metrics and findings stored by your
              repository analyses. The model is instructed to restate that evidence only, and is
              not called at all when there is nothing to report.
            </p>
          </GlassCard>
        </>
      )}
    </PageContainer>
  );
}
