import { useState } from "react";
import PageContainer from "../../components/PageContainer";
import GlassCard from "../../components/GlassCard";
import { Settings as SettingsIcon, Shield, User as UserIcon, Loader2, AlertCircle, CheckCircle2 } from "lucide-react";
import { useAuth } from "../../hooks/useAuth";
import { githubService } from "../../services/github";
import { ApiError, BASE_URL } from "../../lib/api";

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex justify-between items-center gap-4 py-2.5 border-b border-white/[0.04] last:border-0">
      <span className="text-sm text-white/80 shrink-0">{label}</span>
      <span className="text-xs text-white/50 text-right min-w-0 truncate">{children}</span>
    </div>
  );
}

type FeedbackState =
  | { kind: "idle" }
  | { kind: "loading" }
  | { kind: "success"; message: string }
  | { kind: "error"; message: string };

export default function Settings() {
  const { user, refresh } = useAuth();
  const [disconnectState, setDisconnectState] = useState<FeedbackState>({ kind: "idle" });
  const [syncState, setSyncState] = useState<FeedbackState>({ kind: "idle" });
  const github = user?.githubAccount ?? null;

  const handleDisconnect = async () => {
    setDisconnectState({ kind: "loading" });
    try {
      await githubService.disconnectGithub();
      await refresh();
      setDisconnectState({ kind: "success", message: "GitHub account disconnected successfully." });
    } catch (err) {
      const msg =
        err instanceof ApiError
          ? err.message
          : "Failed to disconnect GitHub. Please try again.";
      setDisconnectState({ kind: "error", message: msg });
    }
  };

  const handleSync = async () => {
    setSyncState({ kind: "loading" });
    try {
      await githubService.syncGithub();
      await refresh();
      setSyncState({ kind: "success", message: "GitHub data refreshed successfully." });
    } catch (err) {
      const msg =
        err instanceof ApiError
          ? err.message
          : "Failed to sync GitHub data. Please try again.";
      setSyncState({ kind: "error", message: msg });
    }
  };

  return (
    <PageContainer
      title="Settings"
      description="Your profile, connected accounts, and analysis preferences."
    >
      <div className="flex flex-col gap-6">
        {/* Account */}
        <GlassCard hover={false} className="p-6">
          <div className="flex items-center gap-3.5 mb-6 pb-4 border-b border-white/[0.06]">
            <UserIcon className="w-5 h-5 text-primary" />
            <h3 className="text-sm font-bold text-white uppercase tracking-wider">Account</h3>
          </div>
          <div className="space-y-1">
            <Row label="Name">{user?.name || "—"}</Row>
            <Row label="Email">{user?.email ?? "—"}</Row>
            <Row label="Role">{user?.role ?? "—"}</Row>
            <Row label="Member since">
              {user?.createdAt ? new Date(user.createdAt).toLocaleDateString() : "—"}
            </Row>
          </div>
        </GlassCard>

        {/* Connected accounts */}
        <GlassCard hover={false} className="p-6">
          <div className="flex items-center gap-3.5 mb-6 pb-4 border-b border-white/[0.06]">
            <SettingsIcon className="w-5 h-5 text-primary" />
            <h3 className="text-sm font-bold text-white uppercase tracking-wider">
              Connected Accounts
            </h3>
          </div>

          {github ? (
            <div className="space-y-4">
              <div className="space-y-1">
                <Row label="GitHub">
                  <a
                    href={github.profileUrl ?? `https://github.com/${github.username}`}
                    target="_blank"
                    rel="noreferrer"
                    className="text-primary hover:underline"
                  >
                    @{github.username}
                  </a>
                </Row>
                <Row label="Public repositories">{String(github.totalRepos)}</Row>
                <Row label="Followers">{String(github.totalFollowers)}</Row>
              </div>

              {/* Sync feedback */}
              {syncState.kind === "success" && (
                <div className="flex items-center gap-2 rounded-xl border border-primary/20 bg-primary/[0.07] px-4 py-2.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-primary shrink-0" />
                  <p className="text-[12px] text-primary/90">{syncState.message}</p>
                </div>
              )}
              {syncState.kind === "error" && (
                <div className="flex items-center gap-2 rounded-xl border border-red-500/20 bg-red-500/[0.07] px-4 py-2.5">
                  <AlertCircle className="w-3.5 h-3.5 text-red-400 shrink-0" />
                  <p className="text-[12px] text-red-300/90">{syncState.message}</p>
                </div>
              )}

              {/* Disconnect feedback */}
              {disconnectState.kind === "error" && (
                <div className="flex items-center gap-2 rounded-xl border border-red-500/20 bg-red-500/[0.07] px-4 py-2.5">
                  <AlertCircle className="w-3.5 h-3.5 text-red-400 shrink-0" />
                  <p className="text-[12px] text-red-300/90">{disconnectState.message}</p>
                </div>
              )}

              <div className="flex gap-3">
                <button
                  onClick={handleSync}
                  disabled={syncState.kind === "loading" || disconnectState.kind === "loading"}
                  className="text-xs font-bold uppercase tracking-widest px-5 py-2.5 rounded-full border border-primary/20 bg-primary/[0.07] hover:bg-primary/[0.14] text-primary transition-all flex items-center gap-2 cursor-pointer disabled:opacity-55 disabled:cursor-not-allowed"
                >
                  {syncState.kind === "loading" && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  Sync GitHub
                </button>
                <button
                  onClick={handleDisconnect}
                  disabled={disconnectState.kind === "loading" || syncState.kind === "loading"}
                  className="text-xs font-bold uppercase tracking-widest px-5 py-2.5 rounded-full border border-red-500/30 bg-red-500/10 hover:bg-red-500/20 text-red-400 transition-all flex items-center gap-2 cursor-pointer disabled:opacity-55 disabled:cursor-not-allowed"
                >
                  {disconnectState.kind === "loading" && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  Disconnect GitHub
                </button>
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-start gap-4">
              {/* Success feedback after disconnect */}
              {disconnectState.kind === "success" && (
                <div className="flex items-center gap-2 rounded-xl border border-primary/20 bg-primary/[0.07] px-4 py-2.5 w-full">
                  <CheckCircle2 className="w-3.5 h-3.5 text-primary shrink-0" />
                  <p className="text-[12px] text-primary/90">{disconnectState.message}</p>
                </div>
              )}
              <p className="text-xs leading-relaxed" style={{ color: "var(--text-secondary)" }}>
                No GitHub account is linked. Public repositories can still be analyzed by URL;
                linking is required for private ones.
              </p>
              {/* Full navigation, not fetch — the backend redirects to GitHub. */}
              <a
                href={`${BASE_URL}/auth/github`}
                className="text-xs font-bold uppercase tracking-widest px-5 py-2.5 rounded-full transition-all hover:-translate-y-0.5"
                style={{
                  backgroundColor: "hsl(var(--primary))",
                  color: "hsl(var(--primary-foreground))",
                }}
              >
                Link GitHub
              </a>
            </div>
          )}
        </GlassCard>

        {/* Privacy */}
        <GlassCard hover={false} className="p-6">
          <div className="flex items-center gap-3.5 mb-6 pb-4 border-b border-white/[0.06]">
            <Shield className="w-5 h-5 text-primary" />
            <h3 className="text-sm font-bold text-white uppercase tracking-wider">
              Privacy &amp; Permissions
            </h3>
          </div>
          <p className="text-xs leading-relaxed" style={{ color: "var(--text-secondary)" }}>
            DevProof reads repository metadata and a sample of source files to compute metrics. Raw
            code is not stored — only scores, findings, and the file paths they point at. You can
            remove a repository at any time from the Repositories page.
          </p>
        </GlassCard>
      </div>
    </PageContainer>
  );
}
