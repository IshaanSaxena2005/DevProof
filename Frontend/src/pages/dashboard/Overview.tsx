import { Link, useNavigate } from "react-router-dom";
import { FolderGit2, Code2, Award, Activity, Plus, ArrowRight, AlertCircle } from "lucide-react";
import PageContainer from "../../components/PageContainer";
import GlassCard from "../../components/GlassCard";
import { ErrorBlock, LoadingBlock } from "../../components/StateBlocks";
import { api } from "../../lib/api";
import { useResource } from "../../lib/useResource";
import { useAuth } from "../../context/AuthContext";
import type { Developer360Response } from "../../lib/types";

function scoreColor(n: number) {
  if (n >= 80) return "#77fc75";
  if (n >= 60) return "#f59e0b";
  return "#ef4444";
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
  const { user } = useAuth();
  const { data, loading, error, reload } = useResource<Developer360Response>(
    () => api.get<Developer360Response>("/developer360/overview")
  );

  const firstName = (user?.name ?? "").trim().split(/\s+/)[0];

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
  const score = Math.round(o.developer360Score);
  const hasAnalyses = o.totalAnalyzed > 0;

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
              <span className="text-5xl font-extrabold text-white">{score}</span>
              <span className="text-sm" style={{ color: "var(--text-tertiary)" }}>/100</span>
              <div
                className="text-xs uppercase tracking-widest font-semibold mt-2"
                style={{ color: scoreColor(score) }}
              >
                {hasAnalyses ? "Measured" : "Placeholder"}
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
                No completed analyses yet — this is a backend placeholder, not a measurement.
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

          <div className="text-[11px]" style={{ color: "var(--text-tertiary)" }}>
            {o.user.githubUsername ? (
              <>
                GitHub linked as{" "}
                <span className="text-white/60 font-medium">@{o.user.githubUsername}</span>.
              </>
            ) : (
              <>
                No GitHub account linked —{" "}
                <Link to="/dashboard/settings" className="text-primary hover:underline font-medium">
                  connect one
                </Link>{" "}
                to analyze private repositories.
              </>
            )}
          </div>
        </GlassCard>
      </div>
    </PageContainer>
  );
}
