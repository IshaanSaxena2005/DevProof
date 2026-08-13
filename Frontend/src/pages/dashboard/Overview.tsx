import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { FolderGit2, Code2, Award, Activity, Plus, ArrowRight, AlertCircle, RefreshCw, CheckCircle2, Star } from "lucide-react";
import PageContainer from "../../components/PageContainer";
import GlassCard from "../../components/GlassCard";
import { ErrorBlock, LoadingBlock } from "../../components/StateBlocks";
import { api, ApiError } from "../../lib/api";
import { useResource } from "../../lib/useResource";
import { useAuth } from "../../hooks/useAuth";
import { githubService } from "../../services/github";
import type { Developer360Response } from "../../lib/types";

function scoreColor(n: number) {
  if (n >= 80) return "#77fc75";
  if (n >= 60) return "#f59e0b";
  return "#ef4444";
}

/** ISO -> short date, or an em-dash when GitHub gave us no timestamp. */
function formatWhen(iso: string | null) {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
}

function StatCard({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof FolderGit2;
  label: string;
  value: string;
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
      </div>
    </GlassCard>
  );
}

export default function Overview() {
  const navigate = useNavigate();
  const { user, refresh: refreshAuth } = useAuth();
  const { data, loading, error, reload } = useResource<Developer360Response>(
    () => api.get<Developer360Response>("/developer360/overview")
  );

  const firstName = (user?.name ?? "").trim().split(/\s+/)[0];

  type SyncState = { kind: "idle" } | { kind: "loading" } | { kind: "ok" } | { kind: "err"; message: string };
  const [syncState, setSyncState] = useState<SyncState>({ kind: "idle" });

  const handleSync = async () => {
    setSyncState({ kind: "loading" });
    try {
      await githubService.syncGithub();
      await refreshAuth();
      await reload();
      setSyncState({ kind: "ok" });
      // Auto-clear success indicator after 3 s
      setTimeout(() => setSyncState({ kind: "idle" }), 3000);
    } catch (err) {
      const msg =
        err instanceof ApiError ? err.message : "Sync failed. Please try again.";
      setSyncState({ kind: "err", message: msg });
    }
  };

  if (loading) {
    return (
      <PageContainer title="Overview" description="Loading your engineering summary…">
        <LoadingBlock />
      </PageContainer>
    );
  }

  if (error || !data?.overview) {
    return (
      <PageContainer title="Overview" description="Your evidence-based engineering metrics.">
        <ErrorBlock message={error ?? "No overview data returned."} onRetry={reload} />
      </PageContainer>
    );
  }

  const o = data.overview;
  // null means nothing has been measured yet — the backend no longer
  // substitutes a placeholder number for a missing score.
  const score = o.developer360Score !== null ? Math.round(o.developer360Score) : null;
  const hasAnalyses = score !== null;

  return (
    <PageContainer
      title="Overview"
      description={
        firstName
          ? `Welcome back, ${firstName}. Here is a summary of your engineering evidence.`
          : "Here is a summary of your engineering evidence."
      }
    >
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard
          icon={FolderGit2}
          label="Repositories"
          value={`${o.totalRepositories} connected`}
        />
        <StatCard icon={Activity} label="Analyzed" value={`${o.totalAnalyzed} complete`} />
        <StatCard icon={Code2} label="Skills Recorded" value={String(o.skillsList.length)} />
        <StatCard icon={Award} label="Certifications" value={String(o.recentCertifications.length)} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Engineering index */}
        <GlassCard hover={false} className="p-6 lg:col-span-2 flex flex-col justify-between min-h-[300px]">
          <div>
            <h3 className="text-sm font-bold text-white uppercase tracking-wider mb-2">
              Engineering Quality Index
            </h3>
            <p className="text-xs" style={{ color: "var(--text-secondary)" }}>
              Averaged across documentation, testing, security, code quality, maintainability and
              dependency health for every analyzed repository.
            </p>
          </div>

          <div className="flex items-center justify-center py-8">
            <div className="text-center">
              <span className="text-5xl font-extrabold text-white">{score ?? "—"}</span>
              {score !== null && (
                <span className="text-sm" style={{ color: "var(--text-tertiary)" }}>/100</span>
              )}
              <div
                className="text-xs uppercase tracking-widest font-semibold mt-2"
                style={{ color: score !== null ? scoreColor(score) : "var(--text-tertiary)" }}
              >
                {hasAnalyses ? "Measured" : "No data yet"}
              </div>
            </div>
          </div>

          {hasAnalyses ? (
            <div className="text-[11px] text-center" style={{ color: "var(--text-tertiary)" }}>
              Based on {o.totalAnalyzed} completed{" "}
              {o.totalAnalyzed === 1 ? "analysis" : "analyses"}.
            </div>
          ) : (
            <div className="flex items-start gap-2.5 rounded-xl border border-amber-400/20 bg-amber-400/[0.06] px-4 py-3">
              <AlertCircle className="w-3.5 h-3.5 text-amber-300 shrink-0 mt-0.5" />
              <p className="text-[11px] leading-relaxed text-amber-100/70">
                No completed analyses yet, so there is nothing to measure here.
              </p>
            </div>
          )}
        </GlassCard>

        {/* Quick actions */}
        <GlassCard hover={false} className="p-6 flex flex-col justify-between min-h-[300px]">
          <div>
            <h3 className="text-sm font-bold text-white uppercase tracking-wider mb-4">
              Quick Actions
            </h3>
            <div className="space-y-2.5">
              <button
                onClick={() => navigate("/dashboard/repositories")}
                className="w-full flex items-center justify-between p-3.5 rounded-xl border border-white/5 bg-white/[0.02] hover:bg-white/[0.04] text-xs font-semibold text-white/90 transition-all cursor-pointer"
              >
                <span>Connect a Repository</span>
                <Plus className="w-4 h-4 text-primary" />
              </button>
              <button
                onClick={() => navigate("/dashboard/developer-360")}
                className="w-full flex items-center justify-between p-3.5 rounded-xl border border-white/5 bg-white/[0.02] hover:bg-white/[0.04] text-xs font-semibold text-white/90 transition-all cursor-pointer"
              >
                <span>View Developer 360</span>
                <ArrowRight className="w-4 h-4 text-primary" />
              </button>
            </div>
          </div>

          <div className="flex items-center justify-between gap-3 text-[11px]" style={{ color: "var(--text-tertiary)" }}>
            {o.user.githubUsername ? (
              <>
                <span className="truncate">
                  GitHub linked as{" "}
                  <span className="text-white/60 font-medium">@{o.user.githubUsername}</span>
                </span>
                <div className="flex flex-col items-end gap-1">
                  {syncState.kind === "ok" && (
                    <span className="flex items-center gap-1 text-primary text-[10px] font-semibold">
                      <CheckCircle2 className="w-3 h-3" /> Synced
                    </span>
                  )}
                  {syncState.kind === "err" && (
                    <span className="flex items-center gap-1 text-red-400 text-[10px] font-semibold">
                      <AlertCircle className="w-3 h-3" /> {syncState.message}
                    </span>
                  )}
                  <button
                    onClick={handleSync}
                    disabled={syncState.kind === "loading"}
                    className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-white/5 hover:bg-white/10 text-white transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <RefreshCw className={`w-3 h-3 ${syncState.kind === "loading" ? "animate-spin" : ""}`} />
                    Sync
                  </button>
                </div>
              </>
            ) : (
              <>
                <span>
                  No GitHub account linked —{" "}
                  <Link to="/dashboard/settings" className="text-primary hover:underline font-medium">
                    connect one
                  </Link>{" "}
                  to analyze private repositories.
                </span>
              </>
            )}
          </div>
        </GlassCard>
      </div>

      {/* Repository intelligence — sourced entirely from synced GitHub data */}
      <div className="mt-6">
        <div className="flex items-center gap-2 mb-4">
          <FolderGit2 className="w-4 h-4 text-white/40" />
          <h3 className="text-sm font-bold text-white uppercase tracking-wider">Repository Intelligence</h3>
          {o.github.connected && o.github.lastSyncedAt && (
            <span className="text-[11px]" style={{ color: "var(--text-tertiary)" }}>
              · synced {formatWhen(o.github.lastSyncedAt)}
            </span>
          )}
        </div>

        {o.github.connected ? (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Primary technologies */}
            <GlassCard hover={false} className="p-6">
              <h4 className="text-xs font-bold text-white/70 uppercase tracking-wider mb-4 flex items-center gap-2">
                <Code2 className="w-3.5 h-3.5 text-primary" /> Primary Technologies
              </h4>
              {o.github.primaryTechnologies.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {o.github.primaryTechnologies.map((tech) => (
                    <span
                      key={tech}
                      className="text-xs font-semibold px-3 py-1.5 rounded-full border border-white/10 bg-white/[0.03] text-white/70"
                    >
                      {tech}
                    </span>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-white/30">
                  No language data yet — sync your GitHub repositories to populate this.
                </p>
              )}
            </GlassCard>

            {/* Recent activity */}
            <GlassCard hover={false} className="p-6">
              <h4 className="text-xs font-bold text-white/70 uppercase tracking-wider mb-4 flex items-center gap-2">
                <Activity className="w-3.5 h-3.5 text-primary" /> Recent Activity
              </h4>
              {o.github.recentActivity.length > 0 ? (
                <div className="flex flex-col divide-y divide-white/[0.05]">
                  {o.github.recentActivity.map((r) => (
                    <a
                      key={r.fullName}
                      href={r.url}
                      target="_blank"
                      rel="noreferrer"
                      className="flex items-center justify-between gap-3 py-2 group first:pt-0 last:pb-0"
                    >
                      <span className="text-[13px] text-white/70 group-hover:text-white truncate transition-colors" title={r.fullName}>
                        {r.name}
                      </span>
                      <span className="flex items-center gap-3 shrink-0 text-[11px] text-white/30">
                        {r.starsCount > 0 && (
                          <span className="flex items-center gap-1">
                            <Star className="w-3 h-3" /> {r.starsCount}
                          </span>
                        )}
                        <span>{formatWhen(r.pushedAt)}</span>
                      </span>
                    </a>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-white/30">No recent pushes recorded yet.</p>
              )}
            </GlassCard>
          </div>
        ) : (
          <GlassCard hover={false} className="flex flex-col items-center gap-3 p-8 text-center">
            <div className="w-11 h-11 rounded-2xl border border-white/10 bg-white/[0.03] flex items-center justify-center text-white/40">
              <FolderGit2 className="w-5 h-5" />
            </div>
            <p className="text-sm font-semibold text-white">
              Connect GitHub to unlock repository intelligence.
            </p>
            <p className="text-xs max-w-md" style={{ color: "var(--text-secondary)" }}>
              Link your account to surface your primary technologies, recent activity, and
              language footprint here.
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
    </PageContainer>
  );
}
