import { useState } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
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
    <aside className="w-64 h-full flex flex-col bg-black/[0.45] border-r border-white/[0.08] backdrop-blur-2xl select-none justify-between overflow-hidden">
      {/* Brand Header: Vercel/Linear-inspired logo area (~65px) */}
      <div className="h-16 px-5 border-b border-white/[0.08] flex items-center gap-3 relative overflow-hidden shrink-0">
        <div className="absolute inset-0 bg-primary/[0.02] pointer-events-none" />
        <div className="flex items-center gap-3">
          {/* Logo container: Rounded glass square */}
          <div className="relative w-9 h-9 rounded-xl border border-white/[0.12] bg-white/[0.04] flex items-center justify-center shadow-lg backdrop-blur-md">
            <div className="absolute inset-0 bg-primary/20 blur-md rounded-xl opacity-40" />
            <img
              src="/logo.png"
              alt="DevProof"
              className="relative w-6 h-6 object-contain select-none z-10"
              onError={(e) => {
                (e.currentTarget as HTMLImageElement).style.display = "none";
                const fallback = e.currentTarget.nextElementSibling as HTMLElement | null;
                if (fallback) fallback.style.display = "flex";
              }}
            />
            {/* Fallback visible only when logo.png is missing */}
            <div className="hidden items-center justify-center z-10" id="sidebar-logo-fallback">
              <div className="w-2.5 h-2.5 rounded-sm bg-primary shadow-[0_0_8px_rgba(22,255,0,0.8)]" />
            </div>
          </div>
          {/* Title & Subtitle stacked vertically */}
          <div className="flex flex-col">
            <span className="text-[14px] font-bold tracking-tight text-white/95">DevProof</span>
            <span className="text-[9px] font-semibold text-primary uppercase tracking-widest leading-none mt-0.5">
              Developer Intelligence
            </span>
          </div>
        </div>
      </div>

      {/* Nav Links: reduced margins and gap spacing to prevent scrolling */}
      <nav className="flex-1 px-3 py-3 space-y-0.5 overflow-hidden">
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.label}
              to={item.href}
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
          to="/dashboard/settings"
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

        {/* Signed-in identity */}
        {user && (
          <div className="px-3 py-1.5 rounded-lg bg-white/[0.02] border border-white/[0.04]">
            <p className="text-[9px] font-bold uppercase tracking-widest text-white/30">
              Signed in as
            </p>
            <p className="text-[11px] font-medium text-white/70 truncate mt-0.5" title={user.email}>
              {user.name || user.email}
            </p>
          </div>
        )}

        {/* Logout: Smooth spring-based red scale slide & glow */}
        <motion.button
          type="button"
          onClick={handleLogout}
          disabled={loggingOut}
          whileHover={{ scale: 1.01, x: 2 }}
          transition={{ type: "spring", stiffness: 280, damping: 22 }}
          className="w-full flex items-center justify-between px-3 py-2 rounded-xl text-[13px] font-medium text-red-400/90 hover:text-red-400 hover:bg-red-500/[0.08] hover:shadow-[0_0_15px_rgba(239,68,68,0.1)] border border-transparent hover:border-red-500/20 transition-all duration-300 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed group"
        >
          <div className="flex items-center gap-2.5">
            <LogOut className="w-4 h-4 shrink-0 transition-transform duration-300 group-hover:-rotate-12" />
            <span>{loggingOut ? "Signing out…" : "Logout"}</span>
          </div>
          <motion.span 
            className="text-[11px] opacity-0 group-hover:opacity-100 transition-opacity duration-300 pr-1 text-red-400/70"
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
