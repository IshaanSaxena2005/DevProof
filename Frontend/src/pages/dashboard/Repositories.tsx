import PageContainer from "../../components/PageContainer";
import GlassCard from "../../components/GlassCard";
import { FolderGit2, Plus, ArrowRight } from "lucide-react";
import { useNavigate } from "react-router-dom";

const REPOS = [
  { name: "SpendWise Pro",            slug: "spendwise-pro",            health: "74/100", status: "Active Analysis",          type: "Private", lang: "TypeScript" },
  { name: "AuthServer Go",            slug: "authserver-go",            health: "88/100", status: "Clean Build",              type: "Public",  lang: "Go" },
  { name: "Dockerized Node Scaffold", slug: "dockerized-node-scaffold", health: "52/100", status: "Testing Gaps Detected",    type: "Public",  lang: "JavaScript" },
];

function scoreColor(raw: string) {
  const n = parseInt(raw);
  if (n >= 80) return "#77fc75";
  if (n >= 60) return "#f59e0b";
  return "#ef4444";
}

export default function Repositories() {
  const navigate = useNavigate();

  return (
    <PageContainer
      title="Repositories"
      description="Manage your scanned repositories and view evidence-based analysis metrics."
    >
      <div className="flex flex-col gap-6">
        {/* Top bar Actions */}
        <div className="flex justify-end">
          <button
            className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest px-5 py-3 rounded-full transition-all duration-300 hover:-translate-y-0.5 active:translate-y-0 active:scale-[0.97] shadow-[0_0_16px_rgba(119,252,117,0.25)] hover:shadow-[0_0_24px_rgba(119,252,117,0.45)] hover:brightness-110 cursor-pointer"
            style={{ backgroundColor: "hsl(var(--primary))", color: "hsl(var(--primary-foreground))" }}
          >
            <Plus className="w-4 h-4" />
            Add Repository
          </button>
        </div>

        {/* Repos Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {REPOS.map((repo) => {
            const color = scoreColor(repo.health);
            return (
              <GlassCard
                key={repo.name}
                className="p-6 flex flex-col justify-between min-h-[200px]"
                onClick={() => navigate(`/dashboard/repositories/${repo.slug}`)}
              >
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <div className="w-8 h-8 rounded-lg bg-white/[0.04] border border-white/10 flex items-center justify-center text-white/50">
                      <FolderGit2 className="w-4 h-4" />
                    </div>
                    <span className="text-[10px] font-bold tracking-widest uppercase px-2.5 py-1 rounded-full border border-white/10 text-white/40">
                      {repo.type}
                    </span>
                  </div>

                  <h3 className="text-base font-bold text-white tracking-tight mb-1">{repo.name}</h3>
                  <p className="text-xs text-white/35 mb-1">{repo.lang}</p>
                  <p className="text-xs" style={{ color: "var(--text-tertiary)" }}>
                    {repo.status}
                  </p>
                </div>

                <div className="flex items-center justify-between mt-6 pt-4 border-t border-white/[0.05]">
                  <div className="text-xs">
                    <span className="text-white/35">Score: </span>
                    <span className="font-bold tabular-nums" style={{ color }}>{repo.health}</span>
                  </div>
                  <button
                    className="text-xs font-bold text-primary flex items-center gap-1 hover:underline cursor-pointer"
                    onClick={(e) => { e.stopPropagation(); navigate(`/dashboard/repositories/${repo.slug}`); }}
                  >
                    Details
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </GlassCard>
            );
          })}
        </div>
      </div>
    </PageContainer>
  );
}
