import { motion } from "motion/react";
import GlassCard from "../../components/GlassCard";

/* ═══════════════════════════════════════════════════════
   MOCK DATA
═══════════════════════════════════════════════════════ */

const DEVELOPER = {
  name: "Ishaan Saxena",
  role: "Full Stack Engineer",
  score: 91,
  scoreLabel: "Excellent Engineering Profile",
  summary:
    "This developer demonstrates strong frontend engineering practices with modern React & TypeScript patterns and clean repository organisation. Backend capabilities are growing steadily, supported by production-grade Go and Node.js projects. Continued focus on automated testing, CI/CD pipelines, and backend architecture will significantly improve overall engineering maturity and evidence strength.",
};

const DOMAINS = [
  { label: "Frontend",  score: 92, confidence: "Verified", desc: "React, TypeScript, Tailwind — consistent patterns across multiple production repos.", color: "#77fc75" },
  { label: "Backend",   score: 74, confidence: "Strong",   desc: "Node.js REST APIs and Go auth server with hexagonal architecture.", color: "#60a5fa" },
  { label: "Databases", score: 67, confidence: "Moderate", desc: "PostgreSQL schemas in 3 projects. Redis integration in AuthServer Go.", color: "#a78bfa" },
  { label: "DevOps",    score: 61, confidence: "Moderate", desc: "Docker, Docker Compose, and basic PM2 process management detected.", color: "#f59e0b" },
  { label: "Testing",   score: 38, confidence: "Low",      desc: "Unit tests exist but overall coverage is below 25% across repositories.", color: "#ef4444" },
  { label: "Security",  score: 79, confidence: "Strong",   desc: "JWT rotation, PKCE, OWASP awareness — minor dependency advisories pending.", color: "#34d399" },
  { label: "AI / ML",   score: 22, confidence: "Early",    desc: "Exposure through coursework. No production AI/ML repositories detected yet.", color: "#fb923c" },
];

const TECHNOLOGIES = [
  { name: "React",       level: "Expert",       stars: 5 },
  { name: "TypeScript",  level: "Expert",       stars: 5 },
  { name: "Node.js",     level: "Advanced",     stars: 4 },
  { name: "Go",          level: "Advanced",     stars: 4 },
  { name: "PostgreSQL",  level: "Intermediate", stars: 3 },
  { name: "Docker",      level: "Intermediate", stars: 3 },
  { name: "Express",     level: "Advanced",     stars: 4 },
  { name: "Python",      level: "Intermediate", stars: 3 },
  { name: "Tailwind",    level: "Expert",       stars: 5 },
  { name: "Redis",       level: "Beginner",     stars: 2 },
  { name: "Git",         level: "Expert",       stars: 5 },
  { name: "Linux",       level: "Intermediate", stars: 3 },
];

const STRENGTHS = [
  { title: "Modern Frontend Development",   desc: "Expert-level React with hooks, context, and modern bundling practices." },
  { title: "Strong TypeScript Usage",       desc: "Strict typing across all TypeScript repos with minimal any usage." },
  { title: "Clean Repository Structure",    desc: "Feature-based folders, clear naming, and low file coupling detected." },
  { title: "Consistent Commit History",     desc: "Regular, descriptive commits with conventional message formatting." },
  { title: "Security-Aware Engineering",    desc: "JWT rotation, PKCE flows, and environment secret management applied." },
];

const IMPROVEMENTS = [
  { title: "Increase Unit Testing",        desc: "Coverage across repos is ~18%. Target 60%+ with Jest and Supertest.", priority: "high" },
  { title: "Improve Documentation",        desc: "Inline JSDoc and README depth below average. Expand before sharing publicly.", priority: "high" },
  { title: "Strengthen Backend Coverage",  desc: "Backend projects lack integration tests. Add table-driven tests in Go.", priority: "medium" },
  { title: "Add CI/CD Pipelines",          desc: "No GitHub Actions configured. Automated testing on PRs is strongly recommended.", priority: "medium" },
  { title: "Improve Security Practices",   desc: "2 open dependency advisories. CORS wildcard in scaffold needs fixing.", priority: "medium" },
];

const TIMELINE = [
  { year: "2020", title: "Started Programming",      desc: "Began with Python and web fundamentals. Built first static portfolio.", icon: "🚀" },
  { year: "2021", title: "Learned React & JS",        desc: "Completed multiple courses. Built first React applications and mini-projects.", icon: "⚡" },
  { year: "2022", title: "First Full-Stack Project",  desc: "Built SpendWise Pro — React frontend, Node.js API, PostgreSQL database.", icon: "🏗️" },
  { year: "2023", title: "Won Hackathon",             desc: "First place in university hackathon for an AI-assisted study tool MVP.", icon: "🏆" },
  { year: "2023", title: "Built AuthServer Go",       desc: "Production-grade OAuth2 server in Go. First open-source repo with 100+ stars.", icon: "🔐" },
  { year: "2024", title: "Started DevProof",          desc: "Building DevProof — a developer intelligence and evidence platform.", icon: "💡" },
];

/* ═══════════════════════════════════════════════════════
   HELPERS
═══════════════════════════════════════════════════════ */

function scoreColor(n: number) {
  if (n >= 80) return "#77fc75";
  if (n >= 60) return "#f59e0b";
  return "#ef4444";
}

function levelColor(level: string) {
  const m: Record<string, string> = {
    Expert: "#77fc75", Advanced: "#60a5fa", Intermediate: "#f59e0b", Beginner: "#94a3b8", Early: "#94a3b8",
  };
  return m[level] ?? "#94a3b8";
}

function priorityStyle(p: string) {
  if (p === "high")   return { dot: "#ef4444", bg: "rgba(239,68,68,0.07)",   border: "rgba(239,68,68,0.16)",   text: "#f87171" };
  return               { dot: "#f59e0b", bg: "rgba(245,158,11,0.07)",  border: "rgba(245,158,11,0.16)",  text: "#fbbf24" };
}

/* ── Circular gauge (reused from RepositoryDetails pattern) ── */
function ScoreRing({ score, size = 160 }: { score: number; size?: number }) {
  const r = (size - 24) / 2;
  const c = 2 * Math.PI * r;
  const offset = c - (score / 100) * c;
  const col = scoreColor(score);
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="drop-shadow-[0_0_24px_rgba(119,252,117,0.22)]">
      <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="10"/>
      <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={col} strokeWidth="10" strokeLinecap="round"
        strokeDasharray={c} strokeDashoffset={offset}
        transform={`rotate(-90 ${size/2} ${size/2})`}
        style={{ filter:`drop-shadow(0 0 8px ${col}88)`, transition:"stroke-dashoffset 1.2s cubic-bezier(0.34,1.56,0.64,1)" }}
      />
      <text x="50%" y="44%" dominantBaseline="middle" textAnchor="middle" fontSize="30" fontWeight="800" fill="white" fontFamily="Sora,sans-serif">{score}</text>
      <text x="50%" y="61%" dominantBaseline="middle" textAnchor="middle" fontSize="11" fill="rgba(255,255,255,0.35)" fontFamily="Sora,sans-serif">/100</text>
    </svg>
  );
}

/* ── Mini domain ring ── */
function DomainRing({ score, color, size = 52 }: { score: number; color: string; size?: number }) {
  const r = (size - 10) / 2;
  const c = 2 * Math.PI * r;
  const offset = c - (score / 100) * c;
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="5"/>
      <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={color} strokeWidth="5" strokeLinecap="round"
        strokeDasharray={c} strokeDashoffset={offset}
        transform={`rotate(-90 ${size/2} ${size/2})`}
        style={{ filter:`drop-shadow(0 0 5px ${color}88)`, transition:"stroke-dashoffset 1s ease" }}
      />
      <text x="50%" y="52%" dominantBaseline="middle" textAnchor="middle" fontSize="12" fontWeight="700" fill={color} fontFamily="Sora,sans-serif">{score}</text>
    </svg>
  );
}

/* ── Animated bar ── */
function Bar({ score, color }: { score: number; color: string }) {
  return (
    <div className="relative w-full h-1.5 rounded-full overflow-hidden" style={{ background:"rgba(255,255,255,0.06)" }}>
      <motion.div initial={{ width:0 }} animate={{ width:`${score}%` }}
        transition={{ duration:0.9, delay:0.2, ease:[0.34,1.56,0.64,1] }}
        className="absolute inset-y-0 left-0 rounded-full"
        style={{ background:color, boxShadow:`0 0 8px ${color}55` }} />
    </div>
  );
}

/* ── Section label ── */
function SLabel({ children, className=""}: { children: React.ReactNode; className?: string }) {
  return <p className={`text-[11px] font-bold uppercase tracking-[0.2em] text-white/30 mb-4 ${className}`}>{children}</p>;
}

/* ═══════════════════════════════════════════════════════
   PAGE
═══════════════════════════════════════════════════════ */

export default function Developer360() {
  return (
    <motion.div
      initial={{ opacity:0, y:12 }} animate={{ opacity:1, y:0 }}
      transition={{ duration:0.35, ease:"easeOut" }}
      className="w-full flex flex-col gap-8 pb-8"
    >
      {/* Page header */}
      <div>
        <h1 className="text-2xl md:text-3xl font-bold text-white uppercase tracking-tight">Developer 360</h1>
        <p className="text-sm mt-1" style={{ color:"var(--text-secondary)" }}>
          Your multidimensional engineering profile compiled from repository history, activity, and credentials.
        </p>
      </div>

      {/* ═══════════════════════════════════════════════
          1. DEVELOPER SCORE
      ═══════════════════════════════════════════════ */}
      <GlassCard hover={false} className="p-6 md:p-8 relative overflow-hidden">
        <div className="absolute inset-0 pointer-events-none" style={{ background:"radial-gradient(ellipse at 80% 50%, rgba(119,252,117,0.07) 0%, transparent 60%)" }} />
        <div className="relative flex flex-col md:flex-row items-center md:items-start gap-8">
          {/* Ring */}
          <div className="flex flex-col items-center gap-3 shrink-0">
            <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-white/30">Developer Score</p>
            <ScoreRing score={DEVELOPER.score} size={156} />
            <p className="text-[12px] font-bold uppercase tracking-widest text-center" style={{ color:scoreColor(DEVELOPER.score) }}>
              {DEVELOPER.scoreLabel}
            </p>
          </div>

          {/* Profile detail */}
          <div className="flex-1 min-w-0 flex flex-col justify-center gap-5 md:pt-2">
            <div>
              <h2 className="text-2xl font-bold text-white tracking-tight">{DEVELOPER.name}</h2>
              <p className="text-sm text-white/40 mt-0.5">{DEVELOPER.role}</p>
            </div>

            {/* Quick stat pills */}
            <div className="flex flex-wrap gap-3">
              {[
                { label:"Repositories Analysed", value:"3" },
                { label:"Technologies Detected",  value:"12" },
                { label:"Active Streak",           value:"18 days" },
                { label:"Evidence Sources",        value:"5 / 8" },
              ].map((s) => (
                <div key={s.label} className="rounded-xl border border-white/[0.08] bg-white/[0.03] px-4 py-2.5">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-white/30">{s.label}</p>
                  <p className="text-base font-bold text-white mt-0.5">{s.value}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </GlassCard>

      {/* ═══════════════════════════════════════════════
          2. ENGINEERING DOMAINS
      ═══════════════════════════════════════════════ */}
      <div>
        <SLabel>Engineering Domains</SLabel>
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
          {DOMAINS.map((d, i) => (
            <motion.div key={d.label}
              initial={{ opacity:0, y:18 }} animate={{ opacity:1, y:0 }}
              transition={{ delay:0.07*i, duration:0.45 }}
              className="group relative rounded-2xl border border-white/[0.08] bg-white/[0.03] p-5 flex gap-4 hover:border-white/[0.16] hover:bg-white/[0.055] transition-all duration-300 overflow-hidden"
            >
              <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/[0.10] to-transparent pointer-events-none" />

              {/* Mini ring */}
              <div className="shrink-0">
                <DomainRing score={d.score} color={d.color} />
              </div>

              <div className="flex-1 min-w-0 flex flex-col gap-2">
                <div className="flex items-center justify-between gap-2">
                  <h3 className="text-sm font-semibold text-white/90">{d.label}</h3>
                  <span className="text-[9px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-full border shrink-0"
                    style={{ color:d.color, borderColor:`${d.color}44`, background:`${d.color}12` }}>
                    {d.confidence}
                  </span>
                </div>
                <Bar score={d.score} color={d.color} />
                <p className="text-[11px] leading-relaxed text-white/38 font-light">{d.desc}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      {/* ═══════════════════════════════════════════════
          3. TECHNOLOGY DISTRIBUTION
      ═══════════════════════════════════════════════ */}
      <GlassCard hover={false} className="p-6 md:p-7">
        <SLabel className="mb-5">Technology Distribution</SLabel>
        <div className="flex flex-wrap gap-3">
          {TECHNOLOGIES.map((tech, i) => {
            const col = levelColor(tech.level);
            return (
              <motion.div key={tech.name}
                initial={{ opacity:0, scale:0.88 }} animate={{ opacity:1, scale:1 }}
                transition={{ delay:0.04*i, duration:0.35 }}
                className="group flex items-center gap-2.5 px-4 py-2.5 rounded-xl border border-white/[0.08] bg-white/[0.03] hover:border-white/[0.18] hover:bg-white/[0.07] transition-all duration-200 cursor-default"
              >
                <span className="text-sm font-semibold text-white/80 group-hover:text-white transition-colors">{tech.name}</span>
                <div className="flex gap-0.5">
                  {[1,2,3,4,5].map((s) => (
                    <span key={s} className="w-1.5 h-1.5 rounded-full transition-colors"
                      style={{ background: s <= tech.stars ? col : "rgba(255,255,255,0.10)" }} />
                  ))}
                </div>
                <span className="text-[10px] font-bold uppercase tracking-wider hidden group-hover:inline-block transition-all" style={{ color:col }}>
                  {tech.level}
                </span>
              </motion.div>
            );
          })}
        </div>
        {/* Legend */}
        <div className="flex flex-wrap gap-4 mt-5 pt-4 border-t border-white/[0.05]">
          {[
            { label:"Expert",       color:"#77fc75" },
            { label:"Advanced",     color:"#60a5fa" },
            { label:"Intermediate", color:"#f59e0b" },
            { label:"Beginner",     color:"#94a3b8" },
          ].map((l) => (
            <div key={l.label} className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full" style={{ background:l.color }} />
              <span className="text-[11px] text-white/35 font-medium">{l.label}</span>
            </div>
          ))}
        </div>
      </GlassCard>

      {/* ═══════════════════════════════════════════════
          4 & 5. STRENGTHS + IMPROVEMENTS
      ═══════════════════════════════════════════════ */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Strengths */}
        <div>
          <SLabel>Strengths</SLabel>
          <div className="flex flex-col gap-3">
            {STRENGTHS.map((s, i) => (
              <motion.div key={s.title}
                initial={{ opacity:0, x:-12 }} animate={{ opacity:1, x:0 }}
                transition={{ delay:0.06*i, duration:0.4 }}
                className="rounded-2xl border border-white/[0.08] bg-white/[0.03] px-5 py-4 flex items-start gap-3.5 hover:border-primary/20 hover:bg-primary/[0.03] transition-all duration-300 group"
              >
                <div className="w-5 h-5 rounded-full bg-primary/15 border border-primary/30 flex items-center justify-center shrink-0 mt-0.5 group-hover:bg-primary/25 transition-colors">
                  <svg className="w-2.5 h-2.5 text-primary" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="20 6 9 17 4 12"/>
                  </svg>
                </div>
                <div>
                  <h4 className="text-sm font-semibold text-white/90 mb-0.5">{s.title}</h4>
                  <p className="text-[12px] text-white/38 font-light leading-relaxed">{s.desc}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Improvements */}
        <div>
          <SLabel>Improvement Areas</SLabel>
          <div className="flex flex-col gap-3">
            {IMPROVEMENTS.map((item, i) => {
              const ps = priorityStyle(item.priority);
              return (
                <motion.div key={item.title}
                  initial={{ opacity:0, x:12 }} animate={{ opacity:1, x:0 }}
                  transition={{ delay:0.06*i, duration:0.4 }}
                  className="rounded-2xl border px-5 py-4 flex items-start gap-3.5 transition-all duration-300 hover:brightness-110"
                  style={{ background:ps.bg, borderColor:ps.border }}
                >
                  <div className="shrink-0 mt-1.5">
                    <div className="w-2 h-2 rounded-full" style={{ background:ps.dot, boxShadow:`0 0 6px ${ps.dot}88` }} />
                  </div>
                  <div>
                    <div className="flex items-center gap-2 mb-0.5">
                      <h4 className="text-sm font-semibold text-white/90">{item.title}</h4>
                      <span className="text-[9px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-full border"
                        style={{ color:ps.text, borderColor:`${ps.dot}44`, background:`${ps.dot}14` }}>
                        {item.priority}
                      </span>
                    </div>
                    <p className="text-[12px] text-white/40 font-light leading-relaxed">{item.desc}</p>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>
      </div>

      {/* ═══════════════════════════════════════════════
          6. ENGINEERING TIMELINE
      ═══════════════════════════════════════════════ */}
      <div>
        <SLabel>Engineering Timeline</SLabel>
        <GlassCard hover={false} className="p-6 md:p-8">
          <div className="flex flex-col gap-0">
            {TIMELINE.map((event, i) => (
              <motion.div key={event.title}
                initial={{ opacity:0, x:-16 }} animate={{ opacity:1, x:0 }}
                transition={{ delay:0.08*i, duration:0.45 }}
                className="flex gap-5 group"
              >
                {/* Spine */}
                <div className="flex flex-col items-center shrink-0 w-10">
                  <div className="w-10 h-10 rounded-2xl border border-white/[0.10] bg-white/[0.04] flex items-center justify-center text-lg transition-all duration-300 group-hover:border-primary/30 group-hover:bg-primary/[0.07]">
                    {event.icon}
                  </div>
                  {i < TIMELINE.length - 1 && (
                    <div className="w-px flex-1 mt-1 mb-1" style={{ background:"rgba(255,255,255,0.06)" }} />
                  )}
                </div>

                {/* Content */}
                <div className={`flex-1 min-w-0 ${i < TIMELINE.length-1 ? "pb-7" : ""}`}>
                  <div className="flex items-baseline gap-2 mb-1">
                    <span className="text-[11px] font-bold uppercase tracking-widest text-primary/60">{event.year}</span>
                    <h3 className="text-sm font-semibold text-white/90">{event.title}</h3>
                  </div>
                  <p className="text-[12px] text-white/38 font-light leading-relaxed">{event.desc}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </GlassCard>
      </div>

      {/* ═══════════════════════════════════════════════
          7. OVERALL SUMMARY
      ═══════════════════════════════════════════════ */}
      <div>
        <SLabel>Overall Summary</SLabel>
        <GlassCard hover={false} className="p-6 md:p-8 relative overflow-hidden">
          <div className="absolute inset-0 pointer-events-none" style={{ background:"radial-gradient(ellipse at 0% 0%, rgba(119,252,117,0.06) 0%, transparent 55%)" }} />
          <div className="relative flex gap-4">
            <div className="shrink-0 w-11 h-11 rounded-xl border border-primary/20 bg-primary/[0.08] flex items-center justify-center text-primary">
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 2a10 10 0 1 0 10 10"/><path d="M12 8v4l3 3"/><path d="M18.4 5.6 22 2"/><path d="M22 6V2h-4"/>
              </svg>
            </div>
            <div>
              <p className="text-[11px] font-bold uppercase tracking-widest text-primary/70 mb-2">DevProof Intelligence</p>
              <p className="text-sm leading-relaxed text-white/60 font-light">{DEVELOPER.summary}</p>
            </div>
          </div>
        </GlassCard>
      </div>
    </motion.div>
  );
}
