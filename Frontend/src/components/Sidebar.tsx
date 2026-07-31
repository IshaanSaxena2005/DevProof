import { useState } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
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
} from "lucide-react";
import { cn } from "../lib/utils";

const NAV_ITEMS = [
  { label: "Overview", href: "/dashboard/overview", icon: LayoutDashboard },
  { label: "Repositories", href: "/dashboard/repositories", icon: FolderGit2 },
  { label: "Developer 360", href: "/dashboard/developer-360", icon: User },
  { label: "Skills", href: "/dashboard/skills", icon: Code2 },
  { label: "Problem Solving", href: "/dashboard/problem-solving", icon: Target },
  { label: "Learning", href: "/dashboard/credentials", icon: Award },
  { label: "Growth", href: "/dashboard/growth", icon: TrendingUp },
  { label: "Career Readiness", href: "/dashboard/career-readiness", icon: Briefcase },
  { label: "AI Insights", href: "/dashboard/ai-insights", icon: Sparkles },
];

export default function Sidebar({ onClose }: { onClose?: () => void }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [loggingOut, setLoggingOut] = useState(false);

  async function handleLogout() {
    setLoggingOut(true);
    try {
      await logout();
      onClose?.();
      navigate("/", { replace: true });
    } finally {
      setLoggingOut(false);
    }
  }

  return (
    <aside className="w-64 h-full flex flex-col bg-black/[0.3] border-r border-white/[0.08] backdrop-blur-xl">
      {/* Brand Header */}
      <div className="h-16 px-5 border-b border-white/[0.08] flex items-center gap-2.5">
        <img
          src="/logo.png"
          alt="DevProof"
          className="h-7 w-auto object-contain select-none"
          onError={(e) => {
            // Fallback to dot+text if logo.png not yet present
            (e.currentTarget as HTMLImageElement).style.display = "none";
            const fallback = e.currentTarget.nextElementSibling as HTMLElement | null;
            if (fallback) fallback.style.display = "flex";
          }}
        />
        {/* Fallback visible only when logo.png is missing */}
        <div className="hidden items-center gap-2" id="sidebar-logo-fallback">
          <div className="w-7 h-7 rounded-md border border-white/10 flex items-center justify-center bg-primary/10">
            <div className="w-2.5 h-2.5 rounded-sm bg-primary shadow-[0_0_8px_rgba(119,252,117,0.8)]" />
          </div>
          <span className="text-white font-bold tracking-tight text-lg">DevProof</span>
        </div>
      </div>

      {/* Nav Links */}
      <nav className="flex-1 px-4 py-6 overflow-y-auto space-y-1">
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.label}
              to={item.href}
              onClick={onClose}
              className={({ isActive }) =>
                cn(
                  "flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 cursor-pointer border border-transparent",
                  isActive
                    ? "bg-primary/10 border-primary/20 text-primary shadow-[inset_0_1px_0_rgba(255,255,255,0.05)]"
                    : "text-white/60 hover:text-white hover:bg-white/[0.04]"
                )
              }
            >
              <Icon className="w-4 h-4 shrink-0" />
              <span>{item.label}</span>
            </NavLink>
          );
        })}
      </nav>

      {/* Footer / Action Links */}
      <div className="p-4 border-t border-white/[0.08] space-y-1">
        <NavLink
          to="/dashboard/settings"
          onClick={onClose}
          className={({ isActive }) =>
            cn(
              "flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 cursor-pointer border border-transparent",
              isActive
                ? "bg-primary/10 border-primary/20 text-primary shadow-[inset_0_1px_0_rgba(255,255,255,0.05)]"
                : "text-white/60 hover:text-white hover:bg-white/[0.04]"
            )
          }
        >
          <Settings className="w-4 h-4 shrink-0" />
          <span>Settings</span>
        </NavLink>

        {/* Signed-in identity, so it's obvious which account is active */}
        {user && (
          <div className="px-4 py-2 min-w-0">
            <p className="text-[10px] font-bold uppercase tracking-widest text-white/25">
              Signed in as
            </p>
            <p className="text-xs font-medium text-white/70 truncate" title={user.email}>
              {user.name || user.email}
            </p>
          </div>
        )}

        <button
          type="button"
          onClick={handleLogout}
          disabled={loggingOut}
          className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-red-400 hover:bg-red-500/10 transition-all duration-200 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <LogOut className="w-4 h-4 shrink-0" />
          <span>{loggingOut ? "Signing out…" : "Logout"}</span>
        </button>
      </div>
    </aside>
  );
}
