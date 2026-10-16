import { useState } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import { useDashboardBase, useDemoMode } from "../demo/DemoContext";
import { EXIT_DEMO_PATH, NAV_SECTIONS, sectionPath, type DashboardSectionId } from "../demo/routes.mts";
import { SAMPLE_IDENTITY } from "../demo/sampleData.mts";
import { DemoBadge } from "../demo/DemoNotice";
import { motion } from "motion/react";
import {
  LayoutDashboard,
  FolderGit2,
  User,
  Code2,
  Target,
  Award,
  TrendingUp,
  Briefcase,
  Sparkles,
  Settings,
  LogOut,
  ArrowLeft,
  type LucideIcon,
} from "lucide-react";
import { cn } from "../lib/utils";

/**
 * Icons for the shared section list. The labels and paths live in
 * `demo/routes.mts` because the demo mounts the same sections under `/demo`; a
 * `Record` keyed by section id means a new section cannot be added without an
 * icon (and an icon cannot be left pointing at a section that no longer exists).
 */
const SECTION_ICONS: Record<DashboardSectionId, LucideIcon> = {
  overview: LayoutDashboard,
  repositories: FolderGit2,
  "developer-360": User,
  skills: Code2,
  "problem-solving": Target,
  learning: Award,
  growth: TrendingUp,
  "career-readiness": Briefcase,
  "ai-insights": Sparkles,
  settings: Settings,
};

export default function Sidebar({ onClose }: { onClose?: () => void }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [loggingOut, setLoggingOut] = useState(false);

  // In the demo the same links have to point at /demo/...: a `/dashboard/...`
  // link would drop the visitor straight into the login wall.
  const isDemo = useDemoMode();
  const base = useDashboardBase();

  async function handleLogout() {
    // The demo has no session to end — "leaving" means going back to the site,
    // the same destination signing out goes to.
    if (isDemo) {
      onClose?.();
      navigate(EXIT_DEMO_PATH, { replace: true });
      return;
    }

    // Clear local state first so the user is not trapped in the dashboard if the
    // backend cannot be reached. AuthContext.logout() already sets user = null in
    // its finally block, but navigating before the in-flight request resolves keeps
    // the UI responsive and avoids a race with ProtectedRoute bouncing to /login.
    setLoggingOut(true);
    onClose?.();
    navigate(EXIT_DEMO_PATH, { replace: true });

    // Fire-and-forget: the cookie clear and any backend-side invalidation still
    // happen, and failures here must not block the navigation the user already
    // chose.
    logout().catch(() => {
      /* backend was unreachable — local state is already cleared above */
    }).finally(() => {
      setLoggingOut(false);
    });
  }

  return (
    <aside className="w-64 h-full flex flex-col bg-black/[0.45] border-r border-white/[0.08] backdrop-blur-2xl select-none justify-between overflow-hidden">
      {/* Brand Header: Vercel/Linear-inspired logo area (~65px) */}
      <div className="h-16 px-4 border-b border-white/[0.08] flex items-center gap-3 relative overflow-hidden shrink-0">
        <div className="absolute inset-0 bg-primary/[0.02] pointer-events-none" />
        <div className="flex items-center gap-3 min-w-0">
          {/* Logo container: Rounded glass square — sized to read as the main
              brand mark while staying inside the 64px header row. */}
          <div className="relative w-12 h-12 rounded-xl border border-white/[0.12] bg-white/[0.04] flex items-center justify-center shadow-lg backdrop-blur-md shrink-0">
            <div className="absolute inset-0 bg-primary/20 blur-md rounded-xl opacity-40" />
            <img
              src="/logo.png"
              alt="DevProof"
              className="relative w-9 h-9 object-contain select-none z-10"
              onError={(e) => {
                (e.currentTarget as HTMLImageElement).style.display = "none";
                const fallback = e.currentTarget.nextElementSibling as HTMLElement | null;
                if (fallback) fallback.style.display = "flex";
              }}
            />
            {/* Fallback visible only when logo.png is missing */}
            <div className="hidden items-center justify-center z-10" id="sidebar-logo-fallback">
              <div className="w-3 h-3 rounded-sm bg-primary shadow-[0_0_8px_rgba(22,255,0,0.8)]" />
            </div>
          </div>
          {/* Title & Subtitle stacked vertically */}
          <div className="flex flex-col min-w-0">
            <span className="text-[15px] font-bold tracking-tight text-white/95">DevProof</span>
            <span className="text-[9px] font-semibold text-primary uppercase tracking-widest leading-none mt-0.5">
              {isDemo ? "Sample profile" : "Developer Intelligence"}
            </span>
          </div>
        </div>
      </div>

      {/* Nav Links: reduced margins and gap spacing to prevent scrolling */}
      <nav className="flex-1 px-3 py-3 space-y-0.5 overflow-hidden">
        {NAV_SECTIONS.map((item) => {
          const Icon = SECTION_ICONS[item.id];
          return (
            <NavLink
              key={item.id}
              to={sectionPath(base, item.id)}
              onClick={onClose}
              className="relative block"
            >
              {({ isActive }) => (
                <motion.div
                  whileHover={{ x: 2, transition: { type: "spring", stiffness: 280, damping: 22 } }}
                  className={cn(
                    "flex items-center gap-2.5 px-3 py-2 rounded-xl text-[13px] font-medium transition-all duration-200 cursor-pointer border border-transparent relative overflow-hidden group",
                    isActive
                      ? "text-primary border-primary/25 bg-primary/[0.04]"
                      : "text-white/60 hover:text-white hover:bg-white/[0.03]"
                  )}
                >
                  {/* Left green active indicator strip */}
                  {isActive && (
                    <motion.div
                      layoutId="sidebarActiveStrip"
                      transition={{ type: "spring", stiffness: 280, damping: 22 }}
                      className="absolute left-0 top-2 bottom-2 w-0.5 bg-primary rounded-full"
                    />
                  )}

                  {/* Hover glow behind the active/hovered items */}
                  <div className="absolute inset-0 bg-gradient-to-r from-primary/[0.03] to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />

                  <Icon className={cn(
                    "w-4 h-4 shrink-0 transition-transform group-hover:scale-105 duration-200",
                    isActive ? "text-primary" : "text-white/50 group-hover:text-white/80"
                  )} />
                  <span>{item.label}</span>
                </motion.div>
              )}
            </NavLink>
          );
        })}
      </nav>

      {/* Footer / Action Links: clearly separated */}
      <div className="p-3 border-t border-white/[0.08] space-y-2 shrink-0 bg-black/[0.15]">
        <NavLink
          to={sectionPath(base, "settings")}
          onClick={onClose}
          className="relative block"
        >
          {({ isActive }) => (
            <motion.div
              whileHover={{ x: 2, transition: { type: "spring", stiffness: 280, damping: 22 } }}
              className={cn(
                "flex items-center gap-2.5 px-3 py-2 rounded-xl text-[13px] font-medium transition-all duration-200 cursor-pointer border border-transparent group relative overflow-hidden",
                isActive
                  ? "text-primary border-primary/25 bg-primary/[0.04]"
                  : "text-white/60 hover:text-white hover:bg-white/[0.03]"
              )}
            >
              {isActive && (
                <motion.div
                  layoutId="sidebarActiveStrip"
                  transition={{ type: "spring", stiffness: 280, damping: 22 }}
                  className="absolute left-0 top-2 bottom-2 w-0.5 bg-primary rounded-full"
                />
              )}
              <Settings className={cn(
                "w-4 h-4 shrink-0 transition-transform group-hover:scale-105 duration-200",
                isActive ? "text-primary" : "text-white/50 group-hover:text-white/80"
              )} />
              <span>Settings</span>
            </motion.div>
          )}
        </NavLink>

        {/* Signed-in identity — or, in the demo, whose sample profile this is */}
        {isDemo ? (
          <div className="px-3 py-2 rounded-lg bg-primary/[0.04] border border-primary/15 space-y-1.5">
            <DemoBadge compact />
            <p className="text-[9px] font-bold uppercase tracking-widest text-white/30">Sample profile</p>
            <p className="text-[11px] font-medium text-white/70 truncate" title={SAMPLE_IDENTITY.email}>
              {SAMPLE_IDENTITY.name}
            </p>
            <p className="text-[10px] text-white/35">{SAMPLE_IDENTITY.role}</p>
          </div>
        ) : (
          user && (
            <div className="px-3 py-1.5 rounded-lg bg-white/[0.02] border border-white/[0.04]">
              <p className="text-[9px] font-bold uppercase tracking-widest text-white/30">
                Signed in as
              </p>
              <p className="text-[11px] font-medium text-white/70 truncate mt-0.5" title={user.email}>
                {user.name || user.email}
              </p>
            </div>
          )
        )}

        {/* Logout (or, in the demo, the way out): spring slide & glow */}
        <motion.button
          type="button"
          onClick={handleLogout}
          disabled={loggingOut}
          whileHover={{ scale: 1.01, x: 2 }}
          transition={{ type: "spring", stiffness: 280, damping: 22 }}
          className={cn(
            "w-full flex items-center justify-between px-3 py-2 rounded-xl text-[13px] font-medium border border-transparent transition-all duration-300 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed group",
            isDemo
              ? "text-primary/90 hover:text-primary hover:bg-primary/[0.08] hover:shadow-[0_0_15px_rgba(119,252,117,0.12)] hover:border-primary/25"
              : "text-red-400/90 hover:text-red-400 hover:bg-red-500/[0.08] hover:shadow-[0_0_15px_rgba(239,68,68,0.1)] hover:border-red-500/20"
          )}
        >
          <div className="flex items-center gap-2.5">
            {isDemo ? (
              <ArrowLeft className="w-4 h-4 shrink-0 transition-transform duration-300 group-hover:-translate-x-0.5" />
            ) : (
              <LogOut className="w-4 h-4 shrink-0 transition-transform duration-300 group-hover:-rotate-12" />
            )}
            <span>{isDemo ? "Exit Demo" : loggingOut ? "Signing out…" : "Logout"}</span>
          </div>
          <motion.span 
            className={cn(
              "text-[11px] opacity-0 group-hover:opacity-100 transition-opacity duration-300 pr-1",
              isDemo ? "text-primary/70" : "text-red-400/70"
            )}
            animate={{ x: [0, 3, 0] }}
            transition={{ repeat: Infinity, duration: 1.2, ease: "easeInOut" }}
          >
            →
          </motion.span>
        </motion.button>
      </div>
    </aside>
  );
}
