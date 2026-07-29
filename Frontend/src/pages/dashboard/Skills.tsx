import { motion } from "motion/react";
import GlassCard from "../../components/GlassCard";

/* ═══════════════════════════════════════════════════════
   MOCK DATA
═══════════════════════════════════════════════════════ */

const OVERVIEW_STATS = [
  { label: "Verified Skills", value: "24", icon: "check",  color: "#77fc75" },
  { label: "Technologies",    value: "18", icon: "code",   color: "#60a5fa" },
  { label: "Learning",        value: "6",  icon: "rocket", color: "#f59e0b" },
];

const CATEGORIES = [
  { label: "Frontend",               count: 7, proficiency: 92, color: "#77fc75" },
  { label: "Backend",                count: 5, proficiency: 74, color: "#60a5fa" },
  { label: "Programming Languages",  count: 5, proficiency: 78, color: "#a78bfa" },
  { label: "Databases",              count: 3, proficiency: 65, color: "#34d399" },
  { label: "DevOps",                 count: 3, proficiency: 58, color: "#f59e0b" },
  { label: "AI / ML",                count: 2, proficiency: 28, color: "#fb923c" },
  { label: "Tools",                  count: 5, proficiency: 83, color: "#e879f9" },
];

type Proficiency = "Expert" | "Advanced" | "Intermediate" | "Beginner";

interface Technology {
  name: string;
  category: string;
  proficiency: Proficiency;
  verified: boolean;
  years: number;
}

const TECHNOLOGIES: Technology[] = [
  { name: "React",          category: "Frontend",    proficiency: "Expert",       verified: true,  years: 3 },
  { name: "TypeScript",     category: "Frontend",    proficiency: "Expert",       verified: true,  years: 3 },
  { name: "JavaScript",     category: "Frontend",    proficiency: "Expert",       verified: true,  years: 4 },
  { name: "Tailwind CSS",   category: "Frontend",    proficiency: "Expert",       verified: true,  years: 2 },
  { name: "Framer Motion",  category: "Frontend",    proficiency: "Advanced",     verified: true,  years: 1 },
  { name: "Next.js",        category: "Frontend",    proficiency: "Advanced",     verified: false, years: 1 },
  { name: "HTML / CSS",     category: "Frontend",    proficiency: "Expert",       verified: true,  years: 5 },
  { name: "Node.js",        category: "Backend",     proficiency: "Advanced",     verified: true,  years: 2 },
  { name: "Express",        category: "Backend",     proficiency: "Advanced",     verified: true,  years: 2 },
  { name: "Go",             category: "Backend",     proficiency: "Advanced",     verified: true,  years: 1 },
  { name: "REST APIs",      category: "Backend",     proficiency: "Advanced",     verified: true,  years: 3 },
  { name: "GraphQL",        category: "Backend",     proficiency: "Beginner",     verified: false, years: 0 },
  { name: "Python",         category: "Languages",   proficiency: "Intermediate", verified: true,  years: 2 },
  { name: "Java",           category: "Languages",   proficiency: "Intermediate", verified: true,  years: 2 },
  { name: "C++",            category: "Languages",   proficiency: "Intermediate", verified: true,  years: 2 },
  { name: "PostgreSQL",     category: "Databases",   proficiency: "Intermediate", verified: true,  years: 2 },
  { name: "Redis",          category: "Databases",   proficiency: "Beginner",     verified: false, years: 0 },
  { name: "MongoDB",        category: "Databases",   proficiency: "Beginner",     verified: false, years: 1 },
  { name: "Docker",         category: "DevOps",      proficiency: "Intermediate", verified: true,  years: 1 },
  { name: "Git",            category: "Tools",       proficiency: "Expert",       verified: true,  years: 4 },
  { name: "Linux",          category: "Tools",       proficiency: "Intermediate", verified: true,  years: 2 },
  { name: "Prisma",         category: "Tools",       proficiency: "Intermediate", verified: false, years: 1 },
  { name: "Figma",          category: "Tools",       proficiency: "Intermediate", verified: false, years: 1 },
  { name: "Vite",           category: "Tools",       proficiency: "Advanced",     verified: true,  years: 2 },
];

interface LearningItem {
  name: string;
  progress: number;
  eta: string;
  difficulty: "Hard" | "Medium" | "Easy";
  color: string;
}

const LEARNING: LearningItem[] = [
  { name: "Kubernetes",  progress: 28, eta: "3 months",  difficulty: "Hard",   color: "#60a5fa" },
  { name: "AWS",         progress: 41, eta: "2 months",  difficulty: "Hard",   color: "#f59e0b" },
  { name: "GraphQL",     progress: 55, eta: "3 weeks",   difficulty: "Medium", color: "#a78bfa" },
  { name: "Redis",       progress: 62, eta: "2 weeks",   difficulty: "Medium", color: "#34d399" },
  { name: "Terraform",   progress: 15, eta: "4 months",  difficulty: "Hard",   color: "#fb923c" },
  { name: "Jest / RTL",  progress: 70, eta: "1 week",    difficulty: "Easy",   color: "#77fc75" },
];

const TOP_TECHNOLOGIES = [
  { name: "React",       pct: 96, color: "#77fc75" },
  { name: "TypeScript",  pct: 94, color: "#60a5fa" },
  { name: "Git",         pct: 98, color: "#a78bfa" },
  { name: "Node.js",     pct: 81, color: "#f59e0b" },
  { name: "Docker",      pct: 67, color: "#34d399" },
];

interface RecommendedSkill {
  name: string;
  importance: "Critical" | "High" | "Medium";
  reason: string;
  icon: string;
}

const RECOMMENDED: RecommendedSkill[] = [
  { name: "Testing (Jest / Vitest)", importance: "Critical", reason: "Test coverage is the biggest gap in your current repository evidence.", icon: "🧪" },
  { name: "CI/CD Pipelines",         importance: "Critical", reason: "No automation workflows detected. GitHub Actions would add significant evidence value.", icon: "🔄" },
  { name: "Cloud (AWS / GCP)",       importance: "High",     reason: "Cloud deployment experience is expected in most senior-level roles today.", icon: "☁️" },
  { name: "System Design",           importance: "High",     reason: "Strong architecture thinking will differentiate your profile from peers.", icon: "🏗️" },
  { name: "Microservices",           importance: "Medium",   reason: "Understanding distributed systems patterns will improve backend evidence strength.", icon: "🔗" },
];

const SUMMARY =
  "Your engineering profile demonstrates strong frontend expertise with modern React, TypeScript, and Tailwind patterns confirmed across multiple production repositories. Backend capabilities are growing steadily, supported by Go and Node.js projects with clean architecture. The most impactful next steps are increasing automated test coverage and establishing CI/CD workflows — these two areas alone would significantly elevate your overall developer evidence score and role readiness.";

/* ═══════════════════════════════════════════════════════
   HELPERS & SHARED COMPONENTS
═══════════════════════════════════════════════════════ */

function scoreColor(n: number) {
  if (n >= 80) return "#77fc75";
  if (n >= 60) return "#f59e0b";
  return "#ef4444";
}

function proficiencyColor(p: Proficiency) {
  const m: Record<Proficiency, string> = {
    Expert: "#77fc75", Advanced: "#60a5fa", Intermediate: "#f59e0b", Beginner: "#94a3b8",
  };
  return m[p];
}

function importanceStyle(imp: RecommendedSkill["importance"]) {
  if (imp === "Critical") return { dot: "#ef4444", bg: "rgba(239,68,68,0.07)",  border: "rgba(239,68,68,0.16)",  text: "#f87171" };
  if (imp === "High")     return { dot: "#f59e0b", bg: "rgba(245,158,11,0.07)", border: "rgba(245,158,11,0.16)", text: "#fbbf24" };
  return                          { dot: "#60a5fa", bg: "rgba(96,165,250,0.07)", border: "rgba(96,165,250,0.16)", text: "#93c5fd" };
}

function difficultyStyle(d: LearningItem["difficulty"]) {
  if (d === "Hard")   return { color: "#ef4444", bg: "rgba(239,68,68,0.10)",  border: "rgba(239,68,68,0.22)"  };
  if (d === "Medium") return { color: "#f59e0b", bg: "rgba(245,158,11,0.10)", border: "rgba(245,158,11,0.22)" };
  return                     { color: "#77fc75", bg: "rgba(119,252,117,0.10)",border: "rgba(119,252,117,0.22)"};
}

/* Animated bar */
function Bar({ pct, color, height = "h-1.5" }: { pct: number; color: string; height?: string }) {
  return (
    <div className={`relative w-full ${height} rounded-full overflow-hidden`} style={{ background: "rgba(255,255,255,0.06)" }}>
      <motion.div
        initial={{ width: 0 }} animate={{ width: `${pct}%` }}
        transition={{ duration: 0.9, delay: 0.2, ease: [0.34, 1.56, 0.64, 1] }}
        className={`absolute inset-y-0 left-0 rounded-full`}
        style={{ background: color, boxShadow: `0 0 8px ${color}55` }}
      />
    </div>
  );
}

/* Section label */
function SLabel({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return <p className={`text-[11px] font-bold uppercase tracking-[0.2em] text-white/30 mb-4 ${className}`}>{children}</p>;
}

/* Inline SVG icons */
const OverviewIcons: Record<string, React.ReactNode> = {
  check: (
    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/>
    </svg>
  ),
  code: (
    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="16 18 22 12 16 6"/><polyline points="8 6 2 12 8 18"/>
    </svg>
  ),
  rocket: (
    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4.5 16.5c-1.5 1.26-2 5-2 5s3.74-.5 5-2c.71-.84.7-2.13-.09-2.91a2.18 2.18 0 0 0-2.91-.09z"/><path d="m12 15-3-3a22 22 0 0 1 2-3.95A12.88 12.88 0 0 1 22 2c0 2.72-.78 7.5-6 11a22.35 22.35 0 0 1-4 2z"/><path d="M9 12H4s.55-3.03 2-4c1.62-1.08 5 0 5 0"/><path d="M12 15v5s3.03-.55 4-2c1.08-1.62 0-5 0-5"/>
    </svg>
  ),
};

/* ═══════════════════════════════════════════════════════
   PAGE
═══════════════════════════════════════════════════════ */

export default function Skills() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: "easeOut" }}
      className="w-full flex flex-col gap-8 pb-8"
    >
      {/* Page header */}
      <div>
        <h1 className="text-2xl md:text-3xl font-bold text-white uppercase tracking-tight">Skills Intelligence</h1>
        <p className="text-sm mt-1" style={{ color: "var(--text-secondary)" }}>
          Your verified technology skills, proficiency levels, and personalised growth roadmap.
        </p>
      </div>

      {/* ═══════════════════════════════════════════════
          1. OVERVIEW STATS
      ═══════════════════════════════════════════════ */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {OVERVIEW_STATS.map((s, i) => (
          <motion.div key={s.label}
            initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.06 * i, duration: 0.45 }}
            className="relative rounded-2xl border border-white/[0.08] bg-white/[0.03] p-6 flex items-center gap-5 overflow-hidden group hover:border-white/[0.16] hover:bg-white/[0.05] transition-all duration-300"
          >
            <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/[0.10] to-transparent pointer-events-none" />
            <div className="w-12 h-12 rounded-2xl border flex items-center justify-center shrink-0 transition-all duration-300 group-hover:scale-110"
              style={{ color: s.color, borderColor: `${s.color}33`, background: `${s.color}12` }}>
              {OverviewIcons[s.icon]}
            </div>
            <div>
              <p className="text-[11px] font-bold uppercase tracking-widest text-white/30">{s.label}</p>
              <p className="text-3xl font-bold mt-0.5" style={{ color: s.color }}>{s.value}</p>
            </div>
          </motion.div>
        ))}
      </div>

      {/* ═══════════════════════════════════════════════
          2. SKILL CATEGORIES
      ═══════════════════════════════════════════════ */}
      <div>
        <SLabel>Skill Categories</SLabel>
        <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-4">
          {CATEGORIES.map((cat, i) => (
            <motion.div key={cat.label}
              initial={{ opacity: 0, scale: 0.92 }} animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.06 * i, duration: 0.4 }}
              className="group rounded-2xl border border-white/[0.08] bg-white/[0.03] p-5 flex flex-col gap-3 hover:border-white/[0.16] hover:bg-white/[0.055] transition-all duration-300 overflow-hidden relative cursor-default"
            >
              <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/[0.10] to-transparent pointer-events-none" />
              {/* Top row */}
              <div className="flex items-start justify-between">
                <h3 className="text-sm font-semibold text-white/85 leading-tight">{cat.label}</h3>
                <span className="text-[11px] font-bold px-2 py-0.5 rounded-full ml-2 shrink-0"
                  style={{ color: cat.color, background: `${cat.color}15` }}>
                  {cat.count}
                </span>
              </div>
              {/* Score */}
              <div className="flex items-baseline gap-1">
                <span className="text-2xl font-bold tabular-nums" style={{ color: cat.color }}>{cat.proficiency}</span>
                <span className="text-xs text-white/30 font-medium">/ 100</span>
              </div>
              <Bar pct={cat.proficiency} color={cat.color} />
            </motion.div>
          ))}
        </div>
      </div>

      {/* ═══════════════════════════════════════════════
          3. TECHNOLOGY GRID
      ═══════════════════════════════════════════════ */}
      <div>
        <SLabel>Technology Grid</SLabel>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {TECHNOLOGIES.map((tech, i) => {
            const col = proficiencyColor(tech.proficiency);
            return (
              <motion.div key={tech.name}
                initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.035 * i, duration: 0.38 }}
                className="group flex items-center gap-3 rounded-xl border border-white/[0.07] bg-white/[0.025] px-4 py-3 hover:border-white/[0.15] hover:bg-white/[0.05] transition-all duration-200"
              >
                {/* Name */}
                <span className="flex-1 text-sm font-semibold text-white/80 group-hover:text-white transition-colors truncate">{tech.name}</span>

                {/* Verified dot */}
                {tech.verified ? (
                  <span className="w-4 h-4 rounded-full bg-primary/10 border border-primary/30 flex items-center justify-center shrink-0" title="Verified">
                    <svg className="w-2 h-2 text-primary" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="20 6 9 17 4 12"/>
                    </svg>
                  </span>
                ) : (
                  <span className="w-4 h-4 rounded-full bg-white/[0.04] border border-white/[0.10] flex items-center justify-center shrink-0 opacity-40" title="Unverified">
                    <svg className="w-2 h-2 text-white/40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                      <line x1="5" y1="12" x2="19" y2="12"/>
                    </svg>
                  </span>
                )}

                {/* Years */}
                <span className="text-[11px] text-white/25 tabular-nums shrink-0">
                  {tech.years > 0 ? `${tech.years}yr` : "—"}
                </span>

                {/* Proficiency badge */}
                <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border shrink-0"
                  style={{ color: col, borderColor: `${col}44`, background: `${col}12` }}>
                  {tech.proficiency}
                </span>
              </motion.div>
            );
          })}
        </div>
      </div>

      {/* ═══════════════════════════════════════════════
          4. LEARNING ROADMAP  +  5. MOST USED
      ═══════════════════════════════════════════════ */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* 4. Learning Roadmap */}
        <div>
          <SLabel>Learning Roadmap</SLabel>
          <div className="flex flex-col gap-3">
            {LEARNING.map((item, i) => {
              const ds = difficultyStyle(item.difficulty);
              return (
                <motion.div key={item.name}
                  initial={{ opacity: 0, x: -12 }} animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.07 * i, duration: 0.42 }}
                  className="rounded-2xl border border-white/[0.08] bg-white/[0.03] p-4 flex flex-col gap-3 hover:border-white/[0.16] hover:bg-white/[0.055] transition-all duration-300"
                >
                  {/* Top row */}
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-sm font-semibold text-white/90">{item.name}</span>
                    <div className="flex items-center gap-2 shrink-0">
                      <span className="text-[9px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-full border"
                        style={{ color: ds.color, borderColor: ds.border, background: ds.bg }}>
                        {item.difficulty}
                      </span>
                      <span className="text-[11px] font-bold tabular-nums" style={{ color: item.color }}>{item.progress}%</span>
                    </div>
                  </div>
                  {/* Progress bar */}
                  <Bar pct={item.progress} color={item.color} height="h-1" />
                  {/* ETA */}
                  <div className="flex items-center gap-1.5 text-[11px] text-white/30">
                    <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
                    </svg>
                    <span>Est. completion: <span className="text-white/50 font-medium">{item.eta}</span></span>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>

        {/* 5. Most Used Technologies */}
        <div>
          <SLabel>Most Used Technologies</SLabel>
          <GlassCard hover={false} className="p-6">
            <div className="flex flex-col gap-5">
              {TOP_TECHNOLOGIES.map((tech, i) => (
                <motion.div key={tech.name}
                  initial={{ opacity: 0, x: 12 }} animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.07 * i, duration: 0.42 }}
                  className="flex flex-col gap-2"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <span className="w-6 h-6 rounded-lg border border-white/[0.08] bg-white/[0.04] flex items-center justify-center text-[11px] font-bold text-white/30 tabular-nums">
                        {i + 1}
                      </span>
                      <span className="text-sm font-semibold text-white/85">{tech.name}</span>
                    </div>
                    <span className="text-sm font-bold tabular-nums" style={{ color: tech.color }}>{tech.pct}%</span>
                  </div>
                  <Bar pct={tech.pct} color={tech.color} height="h-2" />
                </motion.div>
              ))}
            </div>
          </GlassCard>
        </div>
      </div>

      {/* ═══════════════════════════════════════════════
          6. RECOMMENDED SKILLS
      ═══════════════════════════════════════════════ */}
      <div>
        <SLabel>Recommended Skills</SLabel>
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
          {RECOMMENDED.map((rec, i) => {
            const is = importanceStyle(rec.importance);
            return (
              <motion.div key={rec.name}
                initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.07 * i, duration: 0.45 }}
                className="rounded-2xl border p-5 flex flex-col gap-3 transition-all duration-300 hover:brightness-110 overflow-hidden relative"
                style={{ background: is.bg, borderColor: is.border }}
              >
                <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/[0.08] to-transparent pointer-events-none" />
                <div className="flex items-start gap-3">
                  <span className="text-2xl shrink-0 leading-none">{rec.icon}</span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <h3 className="text-sm font-semibold text-white/90">{rec.name}</h3>
                      <span className="text-[9px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-full border shrink-0"
                        style={{ color: is.text, borderColor: `${is.dot}44`, background: `${is.dot}14` }}>
                        {rec.importance}
                      </span>
                    </div>
                    <p className="text-[12px] leading-relaxed text-white/40 font-light">{rec.reason}</p>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>

      {/* ═══════════════════════════════════════════════
          7. SUMMARY
      ═══════════════════════════════════════════════ */}
      <div>
        <SLabel>Skills Summary</SLabel>
        <GlassCard hover={false} className="p-6 md:p-8 relative overflow-hidden">
          <div className="absolute inset-0 pointer-events-none"
            style={{ background: "radial-gradient(ellipse at 0% 0%, rgba(119,252,117,0.06) 0%, transparent 55%)" }} />
          <div className="relative flex gap-4">
            <div className="shrink-0 w-11 h-11 rounded-xl border border-primary/20 bg-primary/[0.08] flex items-center justify-center text-primary">
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10"/><path d="M12 8v4"/><path d="m12 16 .01 0"/>
              </svg>
            </div>
            <div>
              <p className="text-[11px] font-bold uppercase tracking-widest text-primary/70 mb-2">DevProof Intelligence</p>
              <p className="text-sm leading-relaxed text-white/60 font-light">{SUMMARY}</p>
            </div>
          </div>
        </GlassCard>
      </div>
    </motion.div>
  );
}
