import { useState } from "react";
import PageContainer from "../../components/PageContainer";
import GlassCard from "../../components/GlassCard";
import { Settings as SettingsIcon, Shield, User as UserIcon, Loader2 } from "lucide-react";
import { useAuth } from "../../hooks/useAuth";
import { githubService } from "../../services/github";
import { BASE_URL } from "../../lib/api";

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex justify-between items-center gap-4 py-2.5 border-b border-white/[0.04] last:border-0">
      <span className="text-sm text-white/80 shrink-0">{label}</span>
      <span className="text-xs text-white/50 text-right min-w-0 truncate">{children}</span>
    </div>
  );
}

export default function Settings() {
  const { user, refresh } = useAuth();
  const [loading, setLoading] = useState(false);
  const github = user?.githubAccount ?? null;

  const handleDisconnect = async () => {
    try {
      setLoading(true);
      await githubService.disconnectGithub();
      await refresh();
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
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
              <div className="flex gap-3">
                <button
                  onClick={handleDisconnect}
                  disabled={loading}
                  className="text-xs font-bold uppercase tracking-widest px-5 py-2.5 rounded-full border border-red-500/30 bg-red-500/10 hover:bg-red-500/20 text-red-400 transition-all flex items-center gap-2 cursor-pointer disabled:opacity-55"
                >
                  {loading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  Disconnect GitHub
                </button>
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-start gap-4">
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
