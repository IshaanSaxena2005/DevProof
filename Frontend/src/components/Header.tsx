import { useLocation } from "react-router-dom";
import { Menu, Search, Bell } from "lucide-react";

const GithubIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg {...props} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M15 22v-4a4.8 4.8 0 0 0-1-3.2c3-.3 6-1.5 6-6.5 0-1.4-.5-2.5-1.5-3.4.1-.3.4-1.6-.1-3.3 0 0-1.2-.4-3.8 1.4a12.8 12.8 0 0 0-7 0C6.2 2.6 5 3 5 3c-.5 1.7-.2 3 .1 3.3C4.1 7.2 3.6 8.3 3.6 9.7c0 5 3 6.2 6 6.5-.4.4-.8 1-.9 2-.9.4-3.2.1-4.6-1.3 0 0-.8-1.5-2.2-1.5 0 0-1.4 0 0 1.3 1.2 1.5 2 3.2 2 3.2 1.4 2 4 1.5 4 1.5"/>
  </svg>
);

const TITLE_MAP: Record<string, string> = {
  "/dashboard/overview": "Overview",
  "/dashboard/repositories": "Repositories",
  "/dashboard/developer-360": "Developer 360",
  "/dashboard/skills": "Skills",
  "/dashboard/problem-solving": "Problem Solving",
  "/dashboard/credentials": "Learning & Credentials",
  "/dashboard/growth": "Growth",
  "/dashboard/career-readiness": "Career Readiness",
  "/dashboard/ai-insights": "AI Insights",
  "/dashboard/settings": "Settings",
};

export default function Header({ onMenuClick }: { onMenuClick: () => void }) {
  const location = useLocation();
  const pageTitle = TITLE_MAP[location.pathname] || "Dashboard";

  return (
    <header className="h-16 px-6 border-b border-white/[0.08] flex items-center justify-between bg-black/[0.15] backdrop-blur-xl">
      {/* Left: Mobile trigger & Page title */}
      <div className="flex items-center gap-4">
        <button
          onClick={onMenuClick}
          className="lg:hidden p-1.5 text-white/70 hover:text-white rounded-lg hover:bg-white/10 transition-colors"
          aria-label="Open sidebar"
        >
          <Menu className="w-5 h-5" />
        </button>
        <h2 className="text-base md:text-lg font-bold text-white uppercase tracking-wider hidden sm:block">
          {pageTitle}
        </h2>
      </div>

      {/* Right: Search, notifications, status, profile */}
      <div className="flex items-center gap-4 md:gap-5">
        {/* Search Bar */}
        <div className="relative hidden md:block">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-white/40" />
          <input
            type="text"
            placeholder="Search dashboard..."
            className="w-52 lg:w-64 pl-10 pr-4 py-1.5 rounded-full text-xs font-medium border border-white/10 bg-white/[0.03] text-white placeholder-white/30 focus:outline-none focus:border-primary/40 focus:bg-white/[0.05] transition-all"
          />
        </div>

        {/* GitHub connected badge */}
        <div className="flex items-center gap-2 border border-primary/20 bg-primary/10 rounded-full px-3 py-1.5 shrink-0">
          <GithubIcon className="w-3.5 h-3.5 text-primary" />
          <span className="text-[10px] font-bold text-primary uppercase tracking-widest hidden xs:inline">
            CONNECTED
          </span>
          <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
        </div>

        {/* Notifications Icon */}
        <button className="p-2 rounded-xl border border-white/10 bg-white/[0.03] hover:bg-white/10 text-white/70 hover:text-white transition-all relative shrink-0">
          <Bell className="w-4 h-4" />
          <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 rounded-full bg-primary" />
        </button>

        {/* Profile menu avatar */}
        <div className="w-8 h-8 rounded-full border border-white/10 overflow-hidden bg-white/[0.08] flex items-center justify-center cursor-pointer hover:border-white/30 transition-all shrink-0">
          <span className="text-xs font-bold text-white select-none">JD</span>
        </div>
      </div>
    </header>
  );
}
