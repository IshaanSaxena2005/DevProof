import { useState, useRef, useEffect } from "react";
import PageContainer from "../../components/PageContainer";
import GlassCard from "../../components/GlassCard";
import {
  Settings as SettingsIcon,
  Shield,
  User as UserIcon,
  LogOut,
  RefreshCw,
  Trash2,
  Download,
  Check,
  AlertCircle,
  Loader2,
  X,
} from "lucide-react";
import { useAuth } from "../../hooks/useAuth";
import { githubService } from "../../services/github";
import { codingProfilesService } from "../../services/codingProfiles";
import { authService } from "../../services/auth";
import { ApiError } from "../../lib/api.mts";
import { useDemoMode } from "../../demo/DemoContext";
import { SAMPLE_IDENTITY, SAMPLE_NOTICE } from "../../demo/sampleData.mts";
import { DemoNotice } from "../../demo/DemoNotice";
import type { CodingPlatform, CodingProfile, GitHubAccountSummary } from "../../lib/types";

/* ── tiny row component, preserved from the original ────────────────────── */

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex justify-between items-center gap-4 py-2.5 border-b border-white/[0.04] last:border-0">
      <span className="text-sm text-white/80 shrink-0">{label}</span>
      <span className="text-xs text-white/50 text-right min-w-0 truncate">{children}</span>
    </div>
  );
}

/* ── feedback state helper ─────────────────────────────────────────────────── */

type FeedbackState =
  | { kind: "idle"; message?: never }
  | { kind: "loading"; message?: never }
  | { kind: "success"; message: string }
  | { kind: "error"; message: string };

function feedbackClass(state: FeedbackState) {
  if (state.kind === "success") return "border-primary/20 bg-primary/[0.07] text-primary/90";
  if (state.kind === "error") return "border-red-500/20 bg-red-500/[0.07] text-red-300/90";
  return "transparent";
}

/* ── platform labels ─────────────────────────────────────────────────────── */

const PLATFORM_LABEL: Record<CodingPlatform, string> = {
  LEETCODE: "LeetCode",
  GEEKSFORGEEKS: "GeeksforGeeks",
};

const PLATFORM_PROFILE_URL: Record<CodingPlatform, (handle: string) => string> = {
  LEETCODE: (h) => `https://leetcode.com/u/${h}/`,
  GEEKSFORGEEKS: (h) => `https://www.geeksforgeeks.org/profile/${h}/`,
};

/* ── date helper ─────────────────────────────────────────────────────────── */

function friendlyDate(iso: string | null | undefined) {
  if (!iso) return "Never";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "Invalid date";
  return d.toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

/* ── confirmable action dialog ────────────────────────────────────────────── */

function ConfirmableAction({
  open,
  onClose,
  onConfirm,
  loading,
  confirmLabel,
  danger = false,
}: {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  loading: boolean;
  confirmLabel: string;
  danger?: boolean;
}) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="w-full max-w-md mx-4 rounded-2xl glass-panel p-6 shadow-2xl">
        <h3 className="text-base font-bold text-white mb-2">Confirm action</h3>
        <p className="text-xs text-white/70 leading-relaxed mb-5">
          {danger ? "This action is permanent. Continue?" : "Continue with this action?"}
        </p>
        <div className="flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-full text-xs font-bold text-white/70 hover:bg-white/5 transition-colors cursor-pointer"
            disabled={loading}
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            disabled={loading}
            className={`flex items-center gap-2 px-4 py-2 rounded-full text-xs font-bold transition-all cursor-pointer disabled:opacity-50 ${
              danger
                ? "bg-red-500/10 text-red-400 hover:bg-red-500/20 border border-red-500/30"
                : "bg-primary text-primary-foreground hover:bg-primary/90"
            }`}
          >
            {loading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ── editable name field ─────────────────────────────────────────────────── */

function EditableName({
  currentName,
  onSave,
  loading,
}: {
  currentName: string | null;
  onSave: (next: string) => void;
  loading: boolean;
}) {
  const [editing, setEditing] = useState(false);
  const [value, setValue] = useState(currentName ?? "");
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setValue(currentName ?? "");
  }, [currentName]);

  useEffect(() => {
    if (editing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [editing]);

  const commit = () => {
    const trimmed = value.trim();
    if (trimmed) {
      onSave(trimmed);
      setEditing(false);
    }
  };

  if (editing) {
    return (
      <div className="flex items-center gap-2">
        <input
          ref={inputRef}
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onBlur={commit}
          onKeyDown={(e) => {
            if (e.key === "Enter") commit();
            if (e.key === "Escape") {
              setValue(currentName ?? "");
              setEditing(false);
            }
          }}
          className="flex-1 bg-white/5 border border-white/10 rounded-lg px-3 py-1.5 text-sm text-white placeholder-white/30 focus:outline-none focus:border-primary/50"
          placeholder="Your name"
        />
        <button
          onClick={commit}
          disabled={loading || !value.trim()}
          className="p-1.5 rounded-lg border border-primary/20 bg-primary/[0.07] text-primary hover:bg-primary/[0.14] transition-colors cursor-pointer disabled:opacity-40"
          title="Save"
        >
          <Check className="w-4 h-4" />
        </button>
        <button
          onClick={() => {
            setValue(currentName ?? "");
            setEditing(false);
          }}
          className="p-1.5 rounded-lg border border-white/10 text-white/60 hover:bg-white/5 transition-colors cursor-pointer"
          title="Cancel"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    );
  }

  return (
    <button
      onClick={() => setEditing(true)}
      className="w-full text-left truncate cursor-text hover:bg-white/[0.03] rounded px-1 -ml-1 transition-colors"
    >
      <span className="text-sm text-white/90">{currentName ?? "—"}</span>
      {!loading && <span className="text-[10px] text-white/30 ml-2 shrink-0">edit</span>}
    </button>
  );
}

/* ── connect form for coding platforms ────────────────────────────────────── */

function ConnectForm({
  label,
  platform,
  isDemo,
}: {
  label: string;
  platform: CodingPlatform;
  isDemo: boolean;
}) {
  const [handle, setHandle] = useState("");
  const [state, setState] = useState<FeedbackState>({ kind: "idle" });

  const submit = async () => {
    const trimmed = handle.trim();
    if (!trimmed) return;
    setState({ kind: "loading" });
    try {
      await codingProfilesService.connectProfile(platform, trimmed);
      setState({ kind: "success", message: `${label} profile connected successfully.` });
      setHandle("");
    } catch (err) {
      setState({
        kind: "error",
        message:
          err instanceof ApiError
            ? err.message
            : `Failed to connect ${label} profile. Please try again.`,
      });
    }
  };

  return (
    <div className="flex gap-2">
      <input
        value={handle}
        onChange={(e) => {
          setHandle(e.target.value);
          if (state.kind !== "idle") setState({ kind: "idle" });
        }}
        onKeyDown={(e) => {
          if (e.key === "Enter") submit();
          if (e.key === "Escape") setState({ kind: "idle" });
        }}
        placeholder={`Your ${label.toLowerCase()} username`}
        disabled={isDemo || state.kind === "loading"}
        className="flex-1 bg-white/5 border border-white/10 rounded-lg px-3 py-1.5 text-sm text-white placeholder-white/30 focus:outline-none focus:border-primary/50 disabled:opacity-50"
      />
      <button
        onClick={submit}
        disabled={isDemo || state.kind === "loading" || !handle.trim()}
        className="shrink-0 px-3 py-1.5 rounded-lg text-xs font-bold bg-primary text-primary-foreground hover:bg-primary/90 transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
      >
        {state.kind === "loading" ? "Connecting…" : "Connect"}
      </button>
      {state.kind !== "idle" && (
        <div className={`flex items-center gap-2 rounded-lg px-3 py-1.5 text-[11px] ${feedbackClass(state)}`}>
          {state.kind === "loading" && <Loader2 className="w-3 h-3 animate-spin shrink-0" />}
          {state.kind === "success" && <Check className="w-3 h-3 text-primary shrink-0" />}
          {state.kind === "error" && <AlertCircle className="w-3 h-3 text-red-400 shrink-0" />}
          <span>{state.message}</span>
        </div>
      )}
    </div>
  );
}

/* ── connected account card (shared by GitHub + coding platforms) ────────── */

function PlatformSummary({
  label,
  account,
  lastSyncedAt,
  onSync,
  syncState,
  onDisconnect,
  disconnectState,
  isDemo,
  renderAccount,
}: {
  label: string;
  account: GitHubAccountSummary | CodingProfile | null;
  lastSyncedAt: string | null;
  onSync: () => void;
  syncState: FeedbackState;
  onDisconnect: () => void;
  disconnectState: FeedbackState;
  isDemo: boolean;
  renderAccount: (account: GitHubAccountSummary | CodingProfile) => React.ReactNode;
}) {
  const connected = account !== null;

  if (!connected) {
    return (
      <div className="rounded-xl border border-white/5 bg-white/[0.02] p-4 transition-all">
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <span className="text-sm font-bold text-white uppercase tracking-wider">{label}</span>
            </div>
            <p className="text-[11px] text-white/40 mt-0.5">Not connected</p>
          </div>
        </div>
        {isDemo ? (
          <p className="text-[11px] leading-relaxed text-white/40">
            Sample profile — no {label.toLowerCase()} account is connected in the demo.
          </p>
        ) : (
          <div className="space-y-2">
            <p className="text-[11px] leading-relaxed text-white/50">
              Enter your public {label.toLowerCase()} username to connect. DevProof reads your public profile — no credentials are stored.
            </p>
            <ConnectForm label={label} platform={label as CodingPlatform} isDemo={isDemo} />
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-white/5 bg-white/[0.02] p-4 transition-all">
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-sm font-bold text-white uppercase tracking-wider">{label}</span>
            <Check className="w-3.5 h-3.5 text-primary shrink-0" />
          </div>
          <p className="text-[11px] text-white/40 mt-0.5">
            Connected — {lastSyncedAt ? `last synced ${friendlyDate(lastSyncedAt)}` : "never synced"}
          </p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={onSync}
            disabled={isDemo || syncState.kind === "loading" || disconnectState.kind === "loading"}
            className="p-1.5 rounded-lg border border-primary/20 bg-primary/[0.07] text-primary hover:bg-primary/[0.14] transition-colors cursor-pointer disabled:opacity-40"
            title="Sync now"
          >
            {syncState.kind === "loading" ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <RefreshCw className="w-3.5 h-3.5" />}
          </button>
          <button
            onClick={onDisconnect}
            disabled={isDemo || disconnectState.kind === "loading" || syncState.kind === "loading"}
            className="p-1.5 rounded-lg border border-red-500/30 bg-red-500/10 text-red-400 hover:bg-red-500/20 transition-colors cursor-pointer disabled:opacity-40"
            title="Disconnect"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      <div className="space-y-1.5">
        {renderAccount(account)}
        <div className="flex gap-2 pt-1">
          {syncState.kind !== "idle" && (
            <div className={`flex items-center gap-2 rounded-lg px-3 py-1.5 text-[11px] ${feedbackClass(syncState)}`}>
              {syncState.kind === "loading" && <Loader2 className="w-3 h-3 animate-spin shrink-0" />}
              {syncState.kind === "success" && <Check className="w-3 h-3 text-primary shrink-0" />}
              {syncState.kind === "error" && <AlertCircle className="w-3 h-3 text-red-400 shrink-0" />}
              <span>{syncState.message}</span>
            </div>
          )}
          {disconnectState.kind !== "idle" && (
            <div className={`flex items-center gap-2 rounded-lg px-3 py-1.5 text-[11px] ${feedbackClass(disconnectState)}`}>
              {disconnectState.kind === "success" && <Check className="w-3 h-3 text-primary shrink-0" />}
              {disconnectState.kind === "error" && <AlertCircle className="w-3 h-3 text-red-400 shrink-0" />}
              <span>{disconnectState.message}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/* ── main page ────────────────────────────────────────────────────────────── */

export default function Settings() {
  const { user, refresh, logout } = useAuth();
  const isDemo = useDemoMode();

  // GitHub
  const [githubState, setGithubState] = useState<FeedbackState>({ kind: "idle" });
  const [githubDisconnectState, setGithubDisconnectState] = useState<FeedbackState>({ kind: "idle" });
  const [githubLastSyncedAt, setGithubLastSyncedAt] = useState<string | null>(user?.githubAccount?.lastSyncedAt ?? null);

  // Coding profiles
  const [codingProfiles, setCodingProfiles] = useState<Array<{ platform: CodingPlatform; profile: CodingProfile | null }>>([]);
  const [codingSyncStates, setCodingSyncStates] = useState<Record<CodingPlatform, FeedbackState>>({
    LEETCODE: { kind: "idle" },
    GEEKSFORGEEKS: { kind: "idle" },
  });
  const [codingDisconnectStates, setCodingDisconnectStates] = useState<Record<CodingPlatform, FeedbackState>>({
    LEETCODE: { kind: "idle" },
    GEEKSFORGEEKS: { kind: "idle" },
  });

  // Account editing
  const [nameSaveState, setNameSaveState] = useState<FeedbackState>({ kind: "idle" });

  // Privacy
  const [exportState, setExportState] = useState<FeedbackState>({ kind: "idle" });
  const [deleteDialog, setDeleteDialog] = useState(false);
  const [deleteConfirmInput, setDeleteConfirmInput] = useState("");
  const [deleteState, setDeleteState] = useState<FeedbackState>({ kind: "idle" });

  // Auth
  const [logoutState, setLogoutState] = useState<FeedbackState>({ kind: "idle" });

  const github = (isDemo ? null : user?.githubAccount ?? null) as GitHubAccountSummary | null;
  const displayUser = isDemo
    ? { ...user!, name: SAMPLE_IDENTITY.name, email: SAMPLE_IDENTITY.email, role: "DEVELOPER" }
    : user;

  // Refresh coding profiles from the server
  const refreshCodingProfiles = async () => {
    try {
      const data = await codingProfilesService.getProfiles();
      setCodingProfiles(data.profiles.map((p) => ({ platform: p.platform, profile: p })));
    } catch {
      // Keep previously loaded data on failure.
    }
  };

  useEffect(() => {
    if (!isDemo) refreshCodingProfiles();
  }, [isDemo]);

  // ── GitHub actions ────────────────────────────────────────────────────────

  const handleSync = async () => {
    setGithubState({ kind: "loading" });
    try {
      const summary = await githubService.syncGithub();
      setGithubLastSyncedAt(summary.lastSyncedAt);
      await refresh();
      setGithubState({ kind: "success", message: "GitHub data refreshed successfully." });
    } catch (err) {
      setGithubState({
        kind: "error",
        message:
          err instanceof ApiError
            ? err.message
            : "Failed to sync GitHub data. Please try again.",
      });
    }
  };

  const handleDisconnect = async () => {
    setGithubDisconnectState({ kind: "loading" });
    try {
      await githubService.disconnectGithub();
      setGithubLastSyncedAt(null);
      await refresh();
      setGithubDisconnectState({ kind: "success", message: "GitHub account disconnected successfully." });
    } catch (err) {
      setGithubDisconnectState({
        kind: "error",
        message:
          err instanceof ApiError
            ? err.message
            : "Failed to disconnect GitHub. Please try again.",
      });
    }
  };

  // ── coding profile actions ────────────────────────────────────────────────

  const handleSyncProfile = async (platform: CodingPlatform) => {
    setCodingSyncStates((prev) => ({ ...prev, [platform]: { kind: "loading" } }));
    try {
      const profile = await codingProfilesService.syncProfile(platform);
      setCodingProfiles((prev) =>
        prev.map((p) => (p.platform === platform ? { platform, profile: profile.profile ?? null } : p))
      );
      setCodingSyncStates((prev) => ({
        ...prev,
        [platform]: { kind: "success", message: `${PLATFORM_LABEL[platform]} profile synced successfully.` },
      }));
    } catch (err) {
      setCodingSyncStates((prev) => ({
        ...prev,
        [platform]: {
          kind: "error",
          message:
            err instanceof ApiError
              ? err.message
              : `Failed to sync ${PLATFORM_LABEL[platform]} profile. Please try again.`,
        },
      }));
    }
  };

  const handleDisconnectProfile = async (platform: CodingPlatform) => {
    setCodingDisconnectStates((prev) => ({ ...prev, [platform]: { kind: "loading" } }));
    try {
      await codingProfilesService.disconnectProfile(platform);
      setCodingProfiles((prev) => prev.filter((p) => p.platform !== platform));
      setCodingDisconnectStates((prev) => ({
        ...prev,
        [platform]: { kind: "success", message: `${PLATFORM_LABEL[platform]} profile disconnected successfully.` },
      }));
    } catch (err) {
      setCodingDisconnectStates((prev) => ({
        ...prev,
        [platform]: {
          kind: "error",
          message:
            err instanceof ApiError
              ? err.message
              : `Failed to disconnect ${PLATFORM_LABEL[platform]} profile. Please try again.`,
        },
      }));
    }
  };

  // ── account name ─────────────────────────────────────────────────────────

  const handleSaveName = async (nextName: string) => {
    setNameSaveState({ kind: "loading" });
    try {
      await authService.updateProfile(nextName);
      await refresh();
      setNameSaveState({ kind: "success", message: "Name updated successfully." });
    } catch (err) {
      setNameSaveState({
        kind: "error",
        message:
          err instanceof ApiError
            ? err.message
            : "Failed to update name. Please try again.",
      });
    }
  };

  // ── export ───────────────────────────────────────────────────────────────

  const handleExport = async () => {
    setExportState({ kind: "loading" });
    try {
      const data = await authService.exportData();
      const blob = new Blob([JSON.stringify(data.export, null, 2)], {
        type: "application/json",
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `devproof-export-${new Date().toISOString().slice(0, 10)}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      setExportState({ kind: "success", message: "Your data export downloaded." });
    } catch (err) {
      setExportState({
        kind: "error",
        message:
          err instanceof ApiError
            ? err.message
            : "Failed to export your data. Please try again.",
      });
    }
  };

  // ── delete account ───────────────────────────────────────────────────────

  const handleDelete = async () => {
    if (deleteConfirmInput !== "DELETE") return;
    setDeleteState({ kind: "loading" });
    try {
      await authService.deleteAccount();
      setDeleteState({ kind: "success", message: "Account deleted. Redirecting…" });
      setDeleteDialog(false);
      setDeleteConfirmInput("");
      setTimeout(() => (window.location.href = "/"), 800);
    } catch (err) {
      setDeleteState({
        kind: "error",
        message:
          err instanceof ApiError
            ? err.message
            : "Failed to delete account. Please try again.",
      });
    }
  };

  // ── logout ───────────────────────────────────────────────────────────────

  const handleLogout = async () => {
    setLogoutState({ kind: "loading" });
    try {
      await logout();
      setLogoutState({ kind: "success", message: "Logged out successfully." });
    } catch (err) {
      setLogoutState({
        kind: "error",
        message:
          err instanceof ApiError
            ? err.message
            : "Failed to log out. Please try again.",
      });
    }
  };

  // ── render helpers ───────────────────────────────────────────────────────

  const renderGitHubAccount = (account: GitHubAccountSummary | CodingProfile) => {
    if ("platform" in account) return null;
    return (
      <>
        <Row label="GitHub">
          <a
            href={account.profileUrl ?? `https://github.com/${account.username}`}
            target="_blank"
            rel="noreferrer"
            className="text-primary hover:underline truncate"
          >
            @{account.username}
          </a>
        </Row>
        <Row label="Public repositories">{String(account.totalRepos)}</Row>
        <Row label="Followers">{String(account.totalFollowers)}</Row>
        <Row label="Following">{String(account.totalFollowing)}</Row>
        <Row label="Last synced">{friendlyDate(account.lastSyncedAt)}</Row>
      </>
    );
  };

  const renderCodingProfile = (profile: GitHubAccountSummary | CodingProfile) => {
    if (!("platform" in profile)) return null;
    const p = profile as CodingProfile;
    return (
      <>
        <Row label="Username">
          <a
            href={PLATFORM_PROFILE_URL[p.platform](p.handle)}
            target="_blank"
            rel="noreferrer"
            className="text-primary hover:underline truncate"
          >
            {p.handle}
          </a>
        </Row>
        <Row label="Problems solved">{String(p.totalSolved)}</Row>
        {p.rating !== null && p.rating !== undefined && (
          <Row label="Rating">{p.rating.toFixed(1)}</Row>
        )}
        {p.streakDays !== null && p.streakDays !== undefined && (
          <Row label="Current streak">{p.streakDays} days</Row>
        )}
        <Row label="Last synced">{friendlyDate(p.lastSyncedAt)}</Row>
      </>
    );
  };

  return (
    <PageContainer
      title="Settings"
      description={isDemo ? "How the sample profile's settings look — read-only." : "Your profile, connected accounts, and data controls."}
    >
      {isDemo && (
        <div className="mb-6">
          <DemoNotice>
            {SAMPLE_NOTICE} Every control on this page is disabled in the demo.
          </DemoNotice>
        </div>
      )}

      <div className="flex flex-col gap-6">
        {/* ── Account ─────────────────────────────────────────────────────── */}
        <GlassCard hover={false} className="p-6">
          <div className="flex items-center gap-3.5 mb-6 pb-4 border-b border-white/[0.06]">
            <UserIcon className="w-5 h-5 text-primary" />
            <h2 className="text-sm font-bold text-white uppercase tracking-wider">Account</h2>
          </div>

          <div className="space-y-1">
            <Row label="Name">
              {isDemo ? (
                <span className="text-sm text-white/90">{SAMPLE_IDENTITY.name}</span>
              ) : (
                <EditableName
                  currentName={user?.name ?? null}
                  onSave={handleSaveName}
                  loading={nameSaveState.kind === "loading"}
                />
              )}
            </Row>
            <Row label="Email">
              <span className="text-sm text-white/70">{displayUser?.email ?? "—"}</span>
            </Row>
            <Row label="Role">
              <span className="text-sm text-white/70 uppercase">{displayUser?.role ?? "—"}</span>
            </Row>
            <Row label="Member since">
              {displayUser?.createdAt ? friendlyDate(displayUser.createdAt) : "—"}
            </Row>
          </div>

          {nameSaveState.kind !== "idle" && nameSaveState.kind !== "loading" && (
            <div className={`flex items-center gap-2 rounded-xl px-4 py-2.5 mt-4 text-xs ${feedbackClass(nameSaveState)}`}>
              {nameSaveState.kind === "success" && <Check className="w-3.5 h-3.5 text-primary shrink-0" />}
              {nameSaveState.kind === "error" && <AlertCircle className="w-3.5 h-3.5 text-red-400 shrink-0" />}
              <span>{nameSaveState.message}</span>
            </div>
          )}
        </GlassCard>

        {/* ── Connected Accounts ──────────────────────────────────────────── */}
        <GlassCard hover={false} className="p-6">
          <div className="flex items-center gap-3.5 mb-6 pb-4 border-b border-white/[0.06]">
            <SettingsIcon className="w-5 h-5 text-primary" />
            <h2 className="text-sm font-bold text-white tracking-normal">Connected Accounts</h2>
          </div>

          {/* GitHub */}
          <PlatformSummary
            label="GitHub"
            account={github}
            lastSyncedAt={githubLastSyncedAt}
            onSync={handleSync}
            syncState={githubState}
            onDisconnect={handleDisconnect}
            disconnectState={githubDisconnectState}
            isDemo={isDemo}
            renderAccount={renderGitHubAccount}
          />

          {/* Coding profiles */}
          <div className="mt-4 space-y-3">
            {isDemo ? (
              <p className="text-[11px] leading-relaxed text-white/40">
                Sample profile — no LeetCode or GeeksforGeeks account is connected in the demo.
              </p>
            ) : codingProfiles.length === 0 ? (
              <div className="rounded-xl border border-white/5 bg-white/[0.02] p-4">
                <p className="text-xs text-white/50 mb-3">No coding platforms connected yet.</p>
                <div className="flex flex-col gap-2">
                  {(["LEETCODE", "GEEKSFORGEEKS"] as CodingPlatform[]).map((platform) => (
                    <ConnectForm
                      key={platform}
                      label={PLATFORM_LABEL[platform]}
                      platform={platform}
                      isDemo={false}
                    />
                  ))}
                </div>
              </div>
            ) : (
              <div className="flex flex-col gap-2">
                {(["LEETCODE", "GEEKSFORGEEKS"] as const).map((platform) => {
                  const existing = codingProfiles.find((p) => p.platform === platform);
                  return (
                    <PlatformSummary
                      key={platform}
                      label={PLATFORM_LABEL[platform]}
                      account={existing?.profile ?? null}
                      lastSyncedAt={existing?.profile?.lastSyncedAt ?? null}
                      onSync={() => handleSyncProfile(platform)}
                      syncState={codingSyncStates[platform]}
                      onDisconnect={() => handleDisconnectProfile(platform)}
                      disconnectState={codingDisconnectStates[platform]}
                      isDemo={false}
                      renderAccount={renderCodingProfile}
                    />
                  );
                })}
              </div>
            )}
          </div>
        </GlassCard>

        {/* ── Privacy & Data ──────────────────────────────────────────────── */}
        <GlassCard hover={false} className="p-6">
          <div className="flex items-center gap-3.5 mb-6 pb-4 border-b border-white/[0.06]">
            <Shield className="w-5 h-5 text-primary" />
            <h2 className="text-sm font-bold text-white uppercase tracking-wider">Privacy &amp; Data</h2>
          </div>

          <div className="flex flex-col gap-4">
            <div className="flex items-start justify-between gap-4">
              <div className="min-w-0">
                <p className="text-sm font-medium text-white mb-1">Export your data</p>
                <p className="text-xs text-white/50 leading-relaxed">
                  Download a JSON copy of everything DevProof stores for you — profile, repositories, analyses, skills, courses, certifications, coding profiles, hackathons, and history. No passwords or tokens are included.
                </p>
              </div>
              <button
                onClick={handleExport}
                disabled={isDemo || exportState.kind === "loading"}
                className="shrink-0 flex items-center gap-2 px-4 py-2 rounded-full text-xs font-bold bg-primary text-primary-foreground hover:bg-primary/90 transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
              >
                {exportState.kind === "loading" ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Download className="w-3.5 h-3.5" />
                )}
                {isDemo
                  ? "Disabled in demo"
                  : exportState.kind === "success"
                    ? "Downloaded"
                    : "Export data"}
              </button>
            </div>
            {exportState.kind !== "idle" && exportState.kind !== "loading" && (
              <div className={`flex items-center gap-2 rounded-xl px-4 py-2.5 text-xs ${feedbackClass(exportState)}`}>
                {exportState.kind === "success" && <Check className="w-3.5 h-3.5 text-primary shrink-0" />}
                {exportState.kind === "error" && <AlertCircle className="w-3.5 h-3.5 text-red-400 shrink-0" />}
                <span>{exportState.message}</span>
              </div>
            )}

            <div className="flex items-start justify-between gap-4 pt-2">
              <div className="min-w-0">
                <p className="text-sm font-medium text-white mb-1">Delete account</p>
                <p className="text-xs text-red-300/80 leading-relaxed">
                  Permanently delete your DevProof account and all of your data — repositories, analyses, skills, courses, certifications, coding profiles, hackathons, and history. This cannot be undone.
                </p>
              </div>
              <button
                onClick={() => setDeleteDialog(true)}
                disabled={isDemo || deleteState.kind === "loading"}
                className="shrink-0 flex items-center gap-2 px-4 py-2 rounded-full text-xs font-bold border border-red-500/30 bg-red-500/10 text-red-400 hover:bg-red-500/20 transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <Trash2 className="w-3.5 h-3.5" />
                {isDemo ? "Disabled in demo" : deleteState.kind === "loading" ? "Deleting…" : "Delete account"}
              </button>
            </div>

            {deleteState.kind !== "idle" && deleteState.kind !== "loading" && (
              <div className={`flex items-center gap-2 rounded-xl px-4 py-2.5 text-xs ${feedbackClass(deleteState)}`}>
                {deleteState.kind === "success" && <Check className="w-3.5 h-3.5 text-primary shrink-0" />}
                {deleteState.kind === "error" && <AlertCircle className="w-3.5 h-3.5 text-red-400 shrink-0" />}
                <span>{deleteState.message}</span>
              </div>
            )}
          </div>
        </GlassCard>

        {/* ── Authentication ──────────────────────────────────────────────── */}
        <GlassCard hover={false} className="p-6">
          <div className="flex items-center gap-3.5 mb-6 pb-4 border-b border-white/[0.06]">
            <LogOut className="w-5 h-5 text-primary" />
            <h2 className="text-sm font-bold text-white uppercase tracking-wider">Authentication</h2>
          </div>

          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0">
              <p className="text-sm font-medium text-white mb-1">Sign out</p>
              <p className="text-xs text-white/50 leading-relaxed">
                End your current session. You will be redirected to the homepage and will need to sign in again to continue.
              </p>
            </div>
            <button
              onClick={handleLogout}
              disabled={isDemo || logoutState.kind === "loading"}
              className="shrink-0 flex items-center gap-2 px-4 py-2 rounded-full text-xs font-bold bg-white/5 border border-white/10 text-white/80 hover:bg-white/10 hover:border-white/20 transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <LogOut className="w-3.5 h-3.5" />
              {isDemo
                ? "Disabled in demo"
                : logoutState.kind === "success"
                  ? "Signed out"
                  : "Sign out"}
            </button>
          </div>
          {logoutState.kind !== "idle" && logoutState.kind !== "loading" && (
            <div className={`flex items-center gap-2 rounded-xl px-4 py-2.5 mt-4 text-xs ${feedbackClass(logoutState)}`}>
              {logoutState.kind === "success" && <Check className="w-3.5 h-3.5 text-primary shrink-0" />}
              {logoutState.kind === "error" && <AlertCircle className="w-3.5 h-3.5 text-red-400 shrink-0" />}
              <span>{logoutState.message}</span>
            </div>
          )}
        </GlassCard>
      </div>

      {/* ── confirmation dialogs ──────────────────────────────────────────── */}
      <ConfirmableAction
        open={deleteDialog}
        onClose={() => {
          setDeleteDialog(false);
          setDeleteConfirmInput("");
        }}
        onConfirm={handleDelete}
        loading={deleteState.kind === "loading"}
        confirmLabel="Delete my account"
        danger
      />
    </PageContainer>
  );
}
