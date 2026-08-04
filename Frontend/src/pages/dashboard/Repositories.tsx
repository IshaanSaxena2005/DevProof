import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "motion/react";
import { FolderGit2, Plus, ArrowRight, Loader2, Trash2, X, Search as SearchIcon } from "lucide-react";
import PageContainer from "../../components/PageContainer";
import GlassCard from "../../components/GlassCard";
import EmptyState from "../../components/EmptyState";
import { ErrorBlock } from "../../components/StateBlocks";
import { ApiError } from "../../lib/api";
import { useResource } from "../../lib/useResource";
import { githubService } from "../../services/github";
import type { RepositoriesResponse, Repository } from "../../lib/types";

function scoreColor(score: number) {
  if (score >= 80) return "#16ff00";
  if (score >= 60) return "#f59e0b";
  return "#ef4444";
}

function latestAnalysis(repo: Repository) {
  return repo.analyses?.[0] ?? null;
}

export default function Repositories() {
  const navigate = useNavigate();
  const { data, loading, error, reload } = useResource<RepositoriesResponse>(
    () => githubService.getRepositories()
  );

  const [showForm, setShowForm] = useState(false);
  const [repoUrl, setRepoUrl] = useState("");
  const [connecting, setConnecting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // Search & Filter state
  const [search, setSearch] = useState("");
  const [visibility, setVisibility] = useState<"all" | "public" | "private">("all");
  const [sortBy, setSortBy] = useState<"updated" | "stars" | "name">("updated");
  const [selectedLanguage, setSelectedLanguage] = useState<string>("all");

  const repositories = data?.repositories ?? [];

  async function handleConnect(e: React.FormEvent) {
    e.preventDefault();
    setConnecting(true);
    setFormError(null);
    try {
      await githubService.connectRepository(repoUrl.trim());
      setRepoUrl("");
      setShowForm(false);
      reload();
    } catch (err) {
      setFormError(err instanceof ApiError ? err.message : "Could not connect that repository.");
    } finally {
      setConnecting(false);
    }
  }

  async function handleDelete(repo: Repository) {
    setDeletingId(repo.id);
    try {
      await githubService.deleteRepository(repo.id);
      reload();
    } catch {
      // Keep UI responsive
    } finally {
      setDeletingId(null);
    }
  }

  // Extract unique languages
  const languages = Array.from(
    new Set(repositories.map((r) => r.language).filter(Boolean))
  ) as string[];

  // Filter & Sort logic
  const filteredRepositories = repositories
    .filter((repo) => {
      const matchesSearch = repo.name.toLowerCase().includes(search.toLowerCase()) || 
        (repo.description ?? "").toLowerCase().includes(search.toLowerCase());
      const matchesVisibility = 
        visibility === "all" ? true : visibility === "private" ? repo.isPrivate : !repo.isPrivate;
      const matchesLanguage = 
        selectedLanguage === "all" ? true : repo.language === selectedLanguage;

      return matchesSearch && matchesVisibility && matchesLanguage;
    })
    .sort((a, b) => {
      if (sortBy === "name") return a.name.localeCompare(b.name);
      if (sortBy === "stars") return b.starsCount - a.starsCount;
      // Default: recently updated
      return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
    });

  return (
    <PageContainer
      title="Repositories"
      description="Connect a GitHub repository to generate evidence-based analysis metrics."
    >
      <div className="flex flex-col gap-6">
        {/* Toolbar */}
        <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
          <div className="relative w-full sm:max-w-xs">
            <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
            <input
              type="text"
              placeholder="Search repositories..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2 border border-white/10 rounded-full bg-white/[0.02] text-xs text-white placeholder-white/30 transition-all focus:bg-white/[0.04]"
            />
          </div>

          <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto justify-end">
            {/* Visibility toggle */}
            <select
              value={visibility}
              onChange={(e) => setVisibility(e.target.value as any)}
              className="bg-white/[0.02] border border-white/10 text-xs rounded-full px-3 py-2 text-white/70 outline-none focus:border-primary/40"
            >
              <option value="all">All Visibility</option>
              <option value="public">Public</option>
              <option value="private">Private</option>
            </select>

            {/* Language filter */}
            <select
              value={selectedLanguage}
              onChange={(e) => setSelectedLanguage(e.target.value)}
              className="bg-white/[0.02] border border-white/10 text-xs rounded-full px-3 py-2 text-white/70 outline-none focus:border-primary/40"
            >
              <option value="all">All Languages</option>
              {languages.map((lang) => (
                <option key={lang} value={lang}>{lang}</option>
              ))}
            </select>

            {/* Sort filter */}
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="bg-white/[0.02] border border-white/10 text-xs rounded-full px-3 py-2 text-white/70 outline-none focus:border-primary/40"
            >
              <option value="updated">Recently Updated</option>
              <option value="stars">Stars</option>
              <option value="name">Name</option>
            </select>

            <button
              onClick={() => { setShowForm((v) => !v); setFormError(null); }}
              className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest px-5 py-2.5 rounded-full transition-all duration-300 hover:-translate-y-0.5 active:translate-y-0 active:scale-[0.97] shadow-[0_0_16px_rgba(22,255,0,0.2)] hover:shadow-[0_0_24px_rgba(22,255,0,0.35)] cursor-pointer shrink-0"
              style={{ backgroundColor: "#16ff00", color: "#000" }}
            >
              {showForm ? <X className="w-4.5 h-4.5" /> : <Plus className="w-4.5 h-4.5" />}
              {showForm ? "Cancel" : "Add Repository"}
            </button>
          </div>
        </div>

        {/* Connect form */}
        {showForm && (
          <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}>
            <GlassCard hover={false} className="p-6">
              <form onSubmit={handleConnect} className="flex flex-col gap-3">
                <label htmlFor="repoUrl" className="text-[11px] font-bold uppercase tracking-widest text-white/40">
                  GitHub repository URL
                </label>
                <div className="flex flex-col sm:flex-row gap-3">
                  <input
                    id="repoUrl"
                    value={repoUrl}
                    onChange={(e) => setRepoUrl(e.target.value)}
                    required
                    placeholder="https://github.com/owner/repo  ·  or  owner/repo"
                    className="flex-1 rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3 text-sm text-white placeholder-white/25 outline-none focus:border-primary/40 focus:bg-white/[0.05] transition-all"
                  />
                  <button
                    type="submit"
                    disabled={connecting || !repoUrl.trim()}
                    className="flex items-center justify-center gap-2 rounded-xl px-6 py-3 text-xs font-bold uppercase tracking-widest transition-all disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer shrink-0"
                    style={{ backgroundColor: "#16ff00", color: "#000" }}
                  >
                    {connecting && <Loader2 className="w-4 h-4 animate-spin" />}
                    {connecting ? "Connecting…" : "Connect"}
                  </button>
                </div>
                <p className="text-[11px]" style={{ color: "var(--text-tertiary)" }}>
                  Public repositories work without linking GitHub. Private ones need a linked account.
                </p>
                {formError && <p className="text-[13px] text-red-400/90">{formError}</p>}
              </form>
            </GlassCard>
          </motion.div>
        )}

        {/* List */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {[1, 2, 3].map((n) => (
              <GlassCard key={n} hover={false} className="p-6 min-h-[210px] animate-pulse flex flex-col justify-between">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="w-8 h-8 rounded-lg bg-white/5" />
                    <div className="w-16 h-5 rounded-full bg-white/5" />
                  </div>
                  <div className="h-5 w-2/3 rounded bg-white/5" />
                  <div className="h-4 w-5/6 rounded bg-white/5" />
                </div>
                <div className="h-8 w-full rounded bg-white/5 mt-4" />
              </GlassCard>
            ))}
          </div>
        ) : error ? (
          <ErrorBlock message={error} onRetry={reload} />
        ) : filteredRepositories.length === 0 ? (
          <EmptyState
            title="No Repositories Found"
            description={repositories.length === 0 ? "Connect your first repository to start generating engineering evidence." : "No repositories match your active search filter options."}
            icon={FolderGit2}
            actionText={repositories.length === 0 ? "Add Repository" : undefined}
            onAction={repositories.length === 0 ? () => setShowForm(true) : undefined}
          />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {filteredRepositories.map((repo, i) => {
              const analysis = latestAnalysis(repo);
              const color = analysis ? scoreColor(analysis.overallScore) : "#94a3b8";
              return (
                <motion.div
                  key={repo.id}
                  initial={{ opacity: 0, y: 14 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.03, duration: 0.35, type: "spring", stiffness: 280, damping: 22 }}
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
                          <button
                            title="Remove repository"
                            onClick={(e) => { e.stopPropagation(); void handleDelete(repo); }}
                            disabled={deletingId === repo.id}
                            className="p-1.5 rounded-lg text-white/25 hover:text-red-400 hover:bg-red-500/10 transition-all cursor-pointer disabled:opacity-40"
                          >
                            {deletingId === repo.id
                              ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
                              : <Trash2 className="w-3.5 h-3.5" />}
                          </button>
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
        )}
      </div>
    </PageContainer>
  );
}
