import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "motion/react";
import { FolderGit2, Plus, ArrowRight, X } from "lucide-react";
import PageContainer from "../../components/PageContainer";
import GlassCard from "../../components/GlassCard";
import { SampleDataNotice } from "../../components/StateBlocks";

// TEMP DEVELOPMENT BYPASS: Using mock data instead of API calls
// Remove this and restore API calls when backend is ready

function scoreColor(score: number) {
  if (score >= 80) return "#77fc75";
  if (score >= 60) return "#f59e0b";
  return "#ef4444";
}

// Mock repository data
const mockRepositories = [
  {
    id: "1",
    name: "devproof-web",
    fullName: "devproof/devproof-web",
    description: "Main web application for DevProof platform with React and TypeScript",
    language: "TypeScript",
    isPrivate: false,
    analyses: [{ overallScore: 78 }]
  },
  {
    id: "2",
    name: "devproof-api",
    fullName: "devproof/devproof-api",
    description: "Backend API service built with Node.js and Express",
    language: "TypeScript",
    isPrivate: true,
    analyses: [{ overallScore: 82 }]
  },
  {
    id: "3",
    name: "portfolio-site",
    fullName: "devproof/portfolio-site",
    description: "Personal portfolio website showcasing projects and skills",
    language: "JavaScript",
    isPrivate: false,
    analyses: [{ overallScore: 65 }]
  },
  {
    id: "4",
    name: "ml-experiments",
    fullName: "devproof/ml-experiments",
    description: "Machine learning experiments and model training notebooks",
    language: "Python",
    isPrivate: true,
    analyses: null
  },
  {
    id: "5",
    name: "cli-tools",
    fullName: "devproof/cli-tools",
    description: "Collection of command-line utilities for development workflows",
    language: "Go",
    isPrivate: false,
    analyses: [{ overallScore: 71 }]
  },
  {
    id: "6",
    name: "design-system",
    fullName: "devproof/design-system",
    description: "Component library and design tokens for consistent UI",
    language: "TypeScript",
    isPrivate: false,
    analyses: [{ overallScore: 88 }]
  }
];

export default function Repositories() {
  const navigate = useNavigate();
  const [showForm, setShowForm] = useState(false);

  return (
    <PageContainer
      title="Repositories"
      description="Connect a GitHub repository to generate evidence-based analysis metrics."
    >
      <SampleDataNotice what="Repository list uses sample data for development." />

      <div className="flex flex-col gap-6">
        {/* Toolbar */}
        <div className="flex justify-end">
          <button
            onClick={() => setShowForm((v) => !v)}
            className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest px-5 py-3 rounded-full transition-all duration-300 hover:-translate-y-0.5 active:translate-y-0 active:scale-[0.97] shadow-[0_0_16px_rgba(119,252,117,0.25)] hover:shadow-[0_0_24px_rgba(119,252,117,0.45)] hover:brightness-110 cursor-pointer"
            style={{ backgroundColor: "hsl(var(--primary))", color: "hsl(var(--primary-foreground))" }}
          >
            {showForm ? <X className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
            {showForm ? "Cancel" : "Add Repository"}
          </button>
        </div>

        {/* Connect form (mock) */}
        {showForm && (
          <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}>
            <GlassCard hover={false} className="p-6">
              <div className="flex flex-col gap-3">
                <label className="text-[11px] font-bold uppercase tracking-widest text-white/40">
                  GitHub repository URL
                </label>
                <input
                  placeholder="https://github.com/owner/repo  ·  or  owner/repo"
                  className="rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3 text-sm text-white placeholder-white/25 outline-none focus:border-primary/40 focus:bg-white/[0.05] transition-all"
                />
                <p className="text-[12px]" style={{ color: "var(--text-tertiary)" }}>
                  This is a demo form. Repository connection requires backend integration.
                </p>
              </div>
            </GlassCard>
          </motion.div>
        )}

        {/* List */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {mockRepositories.map((repo, i) => {
            const analysis = repo.analyses?.[0] ?? null;
            const color = analysis ? scoreColor(analysis.overallScore) : "#94a3b8";
            return (
              <motion.div
                key={repo.id}
                initial={{ opacity: 0, y: 14 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05, duration: 0.4 }}
              >
                <GlassCard
                  className="p-6 flex flex-col justify-between min-h-[210px] h-full"
                  onClick={() => navigate(`/dashboard/repositories/${repo.id}`)}
                >
                  <div className="min-w-0">
                    <div className="flex items-center justify-between mb-4">
                      <div className="w-8 h-8 rounded-lg bg-white/[0.04] border border-white/10 flex items-center justify-center text-white/50">
                        <FolderGit2 className="w-4 h-4" />
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-bold tracking-widest uppercase px-2.5 py-1 rounded-full border border-white/10 text-white/40">
                          {repo.isPrivate ? "Private" : "Public"}
                        </span>
                      </div>
                    </div>

                    <h3 className="text-base font-bold text-white tracking-tight truncate" title={repo.fullName}>
                      {repo.name}
                    </h3>
                    <p className="text-xs text-white/35 mb-1.5">{repo.language ?? "Unknown language"}</p>
                    <p className="text-xs line-clamp-2" style={{ color: "var(--text-tertiary)" }}>
                      {repo.description ?? "No description provided."}
                    </p>
                  </div>

                  <div className="flex items-center justify-between mt-6 pt-4 border-t border-white/[0.05]">
                    <div className="text-xs">
                      {analysis ? (
                        <>
                          <span className="text-white/35">Score: </span>
                          <span className="font-bold tabular-nums" style={{ color }}>
                            {analysis.overallScore}/100
                          </span>
                        </>
                      ) : (
                        <span className="text-white/30">Not analyzed yet</span>
                      )}
                    </div>
                    <span className="text-xs font-bold text-primary flex items-center gap-1">
                      Details
                      <ArrowRight className="w-3.5 h-3.5" />
                    </span>
                  </div>
                </GlassCard>
              </motion.div>
            );
          })}
        </div>
      </div>
    </PageContainer>
  );
}
