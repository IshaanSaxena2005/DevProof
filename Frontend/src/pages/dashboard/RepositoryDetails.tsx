import { useState } from "react";
import { motion } from "motion/react";
import { useNavigate, useParams } from "react-router-dom";
import {
  ArrowLeft, Clock, Globe, Lock, Star, GitFork, HardDrive, GitBranch,
  Loader2, Play, ExternalLink, ShieldAlert, CheckCircle2, FileCode2,
  Code2, FileText, FlaskConical, Shield, Wrench, Package, Activity,
} from "lucide-react";
import GlassCard from "../../components/GlassCard";
import EmptyState from "../../components/EmptyState";
import { ErrorBlock, LoadingBlock } from "../../components/StateBlocks";
import { ApiError } from "../../lib/api";
import { useResource } from "../../lib/useResource";
import { githubService } from "../../services/github";
import type {
  Finding, MetricCategory, RepositoryResponse, SeverityLevel,
} from "../../lib/types";

/* ── helpers ─────────────────────────────────────────── */

function scoreColor(score: number) {
  if (score >= 80) return "#16ff00";
  if (score >= 60) return "#f59e0b";
  return "#ef4444";
}

const CATEGORY_ICON: Record<MetricCategory, typeof Code2> = {
  ENGINEERING_HEALTH: Activity,
  CODE_QUALITY: Code2,
  SECURITY: Shield,
  TESTING: FlaskConical,
  MAINTAINABILITY: Wrench,
  DOCUMENTATION: FileText,
  DEPENDENCY_HEALTH: Package,
};

const SEVERITY_STYLE: Record<SeverityLevel, { color: string; bg: string; border: string }> = {
  CRITICAL: { color: "#f87171", bg: "rgba(239,68,68,0.08)",   border: "rgba(239,68,68,0.20)" },
  HIGH:     { color: "#fb923c", bg: "rgba(251,146,60,0.08)",  border: "rgba(251,146,60,0.20)" },
  MEDIUM:   { color: "#fbbf24", bg: "rgba(245,158,11,0.08)",  border: "rgba(245,158,11,0.20)" },
  LOW:      { color: "#93c5fd", bg: "rgba(96,165,250,0.08)",  border: "rgba(96,165,250,0.20)" },
  GOOD:     { color: "#16ff00", bg: "rgba(22,255,0,0.07)", border: "rgba(22,255,0,0.20)" },
};

/** Order findings worst-first so the most urgent work is on top. */
const SEVERITY_RANK: Record<SeverityLevel, number> = {
  CRITICAL: 0, HIGH: 1, MEDIUM: 2, LOW: 3, GOOD: 4,
};

function formatDate(iso: string | null) {
  if (!iso) return "never";
  return new Date(iso).toLocaleString(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

function formatSize(kb: number) {
  if (kb >= 1024) return `${(kb / 1024).toFixed(1)} MB`;
  return `${kb} KB`;
}

/* ── sub-components ──────────────────────────────────── */

function ScoreRing({ score, size = 140 }: { score: number; size?: number }) {
  const r = (size - 24) / 2;
  const c = 2 * Math.PI * r;
  const offset = c - (score / 100) * c;
  const color = scoreColor(score);
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="10" />
      <circle
        cx={size / 2} cy={size / 2} r={r}
        fill="none" stroke={color} strokeWidth="10" strokeLinecap="round"
        strokeDasharray={c} strokeDashoffset={offset}
        transform={`rotate(-90 ${size / 2} ${size / 2})`}
        style={{ filter: `drop-shadow(0 0 8px ${color}88)`, transition: "stroke-dashoffset 1s cubic-bezier(0.34,1.56,0.64,1)" }}
      />
      <text x="50%" y="46%" dominantBaseline="middle" textAnchor="middle" fontSize="28" fontWeight="700" fill="white" fontFamily="Sora, sans-serif">
        {score}
      </text>
      <text x="50%" y="63%" dominantBaseline="middle" textAnchor="middle" fontSize="10" fill="rgba(255,255,255,0.4)" fontFamily="Sora, sans-serif">
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
        style={{ background: color, boxShadow: `0 0 8px ${color}66` }}
      />
    </div>
  );
}

function SectionLabel({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <p className={`text-[11px] font-bold uppercase tracking-[0.2em] text-white/30 mb-4 ${className}`}>
      {children}
    </p>
  );
}

function StatTile({ icon: Icon, label, value }: { icon: typeof Star; label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-white/[0.08] bg-white/[0.03] p-4 flex flex-col gap-1.5">
      <div className="flex items-center gap-2 text-white/35">
        <Icon className="w-3.5 h-3.5" />
        <span className="text-[10px] font-semibold uppercase tracking-widest">{label}</span>
      </div>
      <p className="text-lg font-bold text-white tabular-nums">{value}</p>
    </div>
  );
}

function FindingCard({ finding, index }: { finding: Finding; index: number }) {
  const s = SEVERITY_STYLE[finding.severity];
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05, duration: 0.4 }}
      className="rounded-2xl border p-5 flex flex-col gap-2.5"
      style={{ background: s.bg, borderColor: s.border }}
    >
      <div className="flex items-start gap-2.5 flex-wrap">
        <span
          className="text-[9px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-full border shrink-0"
          style={{ color: s.color, borderColor: `${s.color}44`, background: `${s.color}14` }}
        >
          {finding.severity}
        </span>
        <span className="text-[10px] font-bold uppercase tracking-widest text-white/30">
          {finding.category}
        </span>
      </div>

      <h4 className="text-sm font-semibold text-white/90">{finding.title}</h4>
      <p className="text-[12px] leading-relaxed text-white/45 font-light">{finding.description}</p>

      {finding.filePath && (
        <div className="flex items-center gap-1.5 text-[11px] text-white/35 font-mono">
          <FileCode2 className="w-3.5 h-3.5 shrink-0" />
          <span className="truncate">
            {finding.filePath}
            {finding.lineNumber ? `:${finding.lineNumber}` : ""}
          </span>
        </div>
      )}

      {finding.recommendation && (
        <p className="text-[12px] leading-relaxed pt-2.5 mt-0.5 border-t border-white/[0.06]" style={{ color: "var(--text-secondary)" }}>
          <span className="font-semibold" style={{ color: "hsl(var(--primary))" }}>Fix: </span>
          {finding.recommendation}
        </p>
      )}
    </motion.div>
  );
}

/* ── page ────────────────────────────────────────────── */

export default function RepositoryDetails() {
  const { repoId } = useParams<{ repoId: string }>();
  const navigate = useNavigate();

  const { data, loading, error, reload } = useResource<RepositoryResponse>(
    () => githubService.getRepository(repoId!),
    [repoId]
  );

  const [analyzing, setAnalyzing] = useState(false);
  const [analyzeError, setAnalyzeError] = useState<string | null>(null);

  async function runAnalysis() {
    setAnalyzing(true);
    setAnalyzeError(null);
    try {
      await githubService.triggerAnalysis(repoId!);
      reload();
    } catch (err) {
      setAnalyzeError(
        err instanceof ApiError ? err.message : "Analysis failed. Please try again."
      );
    } finally {
      setAnalyzing(false);
    }
  }

  if (loading) return <LoadingBlock label="Loading repository…" />;
  if (error) return <ErrorBlock message={error} onRetry={reload} />;
  if (!data?.repository) return <ErrorBlock message="Repository not found." />;

  const repo = data.repository;
  const analyses = repo.analyses ?? [];
  const latest = analyses[0] ?? null;
  const metrics = latest?.metrics ?? [];
  const findings = [...(latest?.findings ?? [])].sort(
    (a, b) => SEVERITY_RANK[a.severity] - SEVERITY_RANK[b.severity]
  );

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: "easeOut" }}
      className="w-full flex flex-col gap-8 pb-8"
    >
      {/* Breadcrumb */}
      <button
        onClick={() => navigate("/dashboard/repositories")}
        className="flex items-center gap-2 text-[13px] font-medium text-white/40 hover:text-white/80 transition-colors w-fit cursor-pointer"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>Repositories</span>
        <span className="text-white/20">/</span>
        <span className="text-white/70">{repo.name}</span>
      </button>

      {/* Header */}
      <GlassCard hover={false} className="p-6 md:p-8">
        <div className="flex flex-col md:flex-row md:items-start gap-6 justify-between">
          <div className="flex-1 min-w-0">
            <div className="flex flex-wrap items-center gap-3 mb-3">
              <h1 className="text-2xl md:text-3xl font-bold text-white tracking-tight">{repo.name}</h1>
              <span
                className="inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest px-2.5 py-1 rounded-full border"
                style={repo.isPrivate
                  ? { color: "#a78bfa", borderColor: "rgba(167,139,250,0.25)", background: "rgba(167,139,250,0.08)" }
                  : { color: "#77fc75", borderColor: "rgba(119,252,117,0.25)", background: "rgba(119,252,117,0.08)" }}
              >
                {repo.isPrivate ? <Lock className="w-3 h-3" /> : <Globe className="w-3 h-3" />}
                {repo.isPrivate ? "Private" : "Public"}
              </span>
              <a
                href={repo.url}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-white/40 hover:text-primary transition-colors"
              >
                <ExternalLink className="w-3.5 h-3.5" />
                View on GitHub
              </a>
            </div>

            <p className="text-sm text-white/50 mb-4 leading-relaxed max-w-2xl">
              {repo.description ?? "No description provided."}
            </p>

            <div className="flex flex-wrap gap-x-6 gap-y-2 text-[12px] text-white/35">
              <span><span className="text-white/50">Owner:</span> {repo.owner}</span>
              <span><span className="text-white/50">Language:</span> {repo.language ?? "—"}</span>
              <span className="flex items-center gap-1">
                <Clock className="w-3.5 h-3.5" />
                Last analyzed {formatDate(latest?.analyzedAt ?? null)}
              </span>
            </div>

            <button
              onClick={runAnalysis}
              disabled={analyzing}
              className="mt-6 flex items-center gap-2 text-xs font-bold uppercase tracking-widest px-5 py-3 rounded-full transition-all duration-300 hover:-translate-y-0.5 active:scale-[0.97] disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer shadow-[0_0_16px_rgba(119,252,117,0.25)]"
              style={{ backgroundColor: "hsl(var(--primary))", color: "hsl(var(--primary-foreground))" }}
            >
              {analyzing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4" />}
              {analyzing ? "Analyzing…" : latest ? "Re-run Analysis" : "Run Analysis"}
            </button>

            {analyzing && (
              <p className="mt-3 text-[12px]" style={{ color: "var(--text-tertiary)" }}>
                Fetching the file tree and scanning source files — this can take a moment.
              </p>
            )}
            {analyzeError && <p className="mt-3 text-[13px] text-red-400/90">{analyzeError}</p>}
          </div>

          {latest && (
            <div className="flex flex-col items-center gap-2 shrink-0">
              <ScoreRing score={Math.round(latest.overallScore)} />
              <p
                className="text-[11px] font-bold uppercase tracking-widest text-center"
                style={{ color: scoreColor(latest.overallScore) }}
              >
                {latest.healthStatus.replace(/_/g, " ")}
              </p>
            </div>
          )}
        </div>
      </GlassCard>

      {/* No analysis yet */}
      {!latest && (
        <EmptyState
          title="No Analysis Yet"
          description="Run an analysis to score this repository across documentation, testing, security, code quality, maintainability and dependencies."
          icon={Activity}
        />
      )}

      {/* Metrics */}
      {metrics.length > 0 && (
        <div>
          <SectionLabel>Evidence Analysis</SectionLabel>
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
            {metrics.map((metric, i) => {
              const Icon = CATEGORY_ICON[metric.category] ?? Activity;
              const color = scoreColor(metric.score);
              return (
                <motion.div
                  key={metric.id}
                  initial={{ opacity: 0, y: 18 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.06 * i, duration: 0.42 }}
                  className="group rounded-2xl border border-white/[0.08] bg-white/[0.03] p-5 flex flex-col gap-3 hover:border-white/[0.16] hover:bg-white/[0.055] transition-all duration-300"
                >
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div
                        className="w-9 h-9 rounded-xl border border-white/[0.08] bg-white/[0.04] flex items-center justify-center shrink-0"
                        style={{ color }}
                      >
                        <Icon className="w-4.5 h-4.5" />
                      </div>
                      <span className="text-sm font-semibold text-white/80 truncate" title={metric.name}>
                        {metric.name}
                      </span>
                    </div>
                    <span className="text-xl font-bold tabular-nums shrink-0" style={{ color }}>
                      {Math.round(metric.score)}
                    </span>
                  </div>
                  <Bar score={metric.score} color={color} />
                  {metric.detail && (
                    <p className="text-[12px] leading-relaxed text-white/40 font-light">{metric.detail}</p>
                  )}
                </motion.div>
              );
            })}
          </div>
        </div>
      )}

      {/* Repo stats */}
      <div>
        <SectionLabel>Repository Statistics</SectionLabel>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <StatTile icon={Star} label="Stars" value={String(repo.starsCount)} />
          <StatTile icon={GitFork} label="Forks" value={String(repo.forksCount)} />
          <StatTile icon={HardDrive} label="Size" value={formatSize(repo.sizeKb)} />
          <StatTile icon={GitBranch} label="Branch" value={repo.defaultBranch} />
        </div>
      </div>

      {/* Findings */}
      {latest && (
        <div>
          <SectionLabel>
            Findings &amp; Recommendations
            {findings.length > 0 && <span className="ml-2 text-white/20">({findings.length})</span>}
          </SectionLabel>
          {findings.length === 0 ? (
            <GlassCard hover={false} className="flex items-center gap-3 p-6">
              <CheckCircle2 className="w-5 h-5 text-primary shrink-0" />
              <p className="text-sm" style={{ color: "var(--text-secondary)" }}>
                No findings recorded for this analysis run.
              </p>
            </GlassCard>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {findings.map((finding, i) => (
                <FindingCard key={finding.id} finding={finding} index={i} />
              ))}
            </div>
          )}
        </div>
      )}

      {/* History */}
      {analyses.length > 1 && (
        <div>
          <SectionLabel>Analysis History</SectionLabel>
          <GlassCard hover={false} className="p-6 flex flex-col gap-3">
            {analyses.map((a) => (
              <div
                key={a.id}
                className="flex items-center justify-between gap-4 py-2.5 border-b border-white/[0.05] last:border-0"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <ShieldAlert className="w-3.5 h-3.5 text-white/25 shrink-0" />
                  <span className="text-[13px] text-white/70 truncate">
                    {a.healthStatus.replace(/_/g, " ")}
                  </span>
                  <span className="text-[11px] text-white/25 shrink-0">{formatDate(a.analyzedAt ?? a.createdAt)}</span>
                </div>
                <span className="text-sm font-bold tabular-nums shrink-0" style={{ color: scoreColor(a.overallScore) }}>
                  {Math.round(a.overallScore)}
                </span>
              </div>
            ))}
          </GlassCard>
        </div>
      )}
    </motion.div>
  );
}
