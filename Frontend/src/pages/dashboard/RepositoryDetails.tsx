import { motion } from "motion/react";
import { useParams, useNavigate } from "react-router-dom";
import GlassCard from "../../components/GlassCard";

/* ═══════════════════════════════════════════════════════
   MOCK DATA
═══════════════════════════════════════════════════════ */

const MOCK_REPOS: Record<string, RepoData> = {
  "spendwise-pro": {
    name: "SpendWise Pro",
    owner: "ishaan-saxena",
    visibility: "Private",
    language: "TypeScript",
    lastUpdated: "2 days ago",
    status: "Active Analysis",
    healthScore: 74,
    healthLabel: "Good Engineering Health",
    description:
      "A full-stack personal finance tracker with React frontend, Node.js API, and PostgreSQL database. Implements JWT authentication, real-time charts, and CSV export.",
    evidence: [
      { label: "Code Quality",      score: 82, icon: "code",    color: "#77fc75", explanation: "Consistent naming conventions and modular component structure across the codebase." },
      { label: "Documentation",     score: 58, icon: "docs",    color: "#f59e0b", explanation: "README is present but inline code comments are sparse. JSDoc coverage below 40%." },
      { label: "Testing",           score: 44, icon: "test",    color: "#ef4444", explanation: "Unit tests exist for utility functions only. No integration or e2e test coverage." },
      { label: "Security",          score: 79, icon: "shield",  color: "#77fc75", explanation: "JWT rotation implemented. Minor: two dependency advisories pending update." },
      { label: "Maintainability",   score: 81, icon: "wrench",  color: "#77fc75", explanation: "Low coupling between modules. Avg file length 95 lines. No circular dependencies." },
      { label: "Architecture",      score: 87, icon: "arch",    color: "#77fc75", explanation: "Clean separation of concerns. Feature-based folder structure with clear data-flow." },
    ],
    techStack: ["React", "TypeScript", "Node.js", "Express", "PostgreSQL", "Docker", "Tailwind CSS", "JWT"],
    stats: [
      { label: "Commits",      value: "312",  icon: "commit" },
      { label: "Contributors", value: "3",    icon: "users" },
      { label: "Pull Requests",value: "47",   icon: "pr" },
      { label: "Issues",       value: "12",   icon: "issue" },
      { label: "Stars",        value: "28",   icon: "star" },
      { label: "Forks",        value: "6",    icon: "fork" },
    ],
    aiSummary:
      "SpendWise Pro demonstrates solid frontend architecture with strong component reusability and clean TypeScript typing. The backend follows RESTful conventions with good separation of concerns. However, automated test coverage is critically low at under 15%, creating risk around regressions. Security posture is good overall but two npm advisories require patching. Prioritise adding integration tests and updating dependencies to elevate this repository's evidence score.",
    activity: [
      { hash: "a3f8d2c", message: "feat: add budget category pie chart",        author: "ishaan-saxena",  time: "2 days ago",  type: "feat" },
      { hash: "b91e4a1", message: "fix: correct date-range filter edge case",    author: "ishaan-saxena",  time: "3 days ago",  type: "fix" },
      { hash: "c7d2891", message: "docs: update README with setup instructions", author: "priya-k",        time: "5 days ago",  type: "docs" },
      { hash: "d4f0293", message: "refactor: extract auth middleware to module", author: "ishaan-saxena",  time: "1 week ago",  type: "refactor" },
      { hash: "e12a8b3", message: "chore: upgrade react-query to v5",            author: "ishaan-saxena",  time: "1 week ago",  type: "chore" },
      { hash: "f3b7c91", message: "feat: implement CSV export endpoint",         author: "raj-m",          time: "2 weeks ago", type: "feat" },
    ],
    recommendations: [
      { priority: "high",   title: "Increase Test Coverage",    description: "Current coverage is ~14%. Add integration tests for API routes and component snapshot tests to reach 60%+." },
      { priority: "high",   title: "Fix Security Advisories",   description: "2 moderate npm advisories in lodash and axios. Run npm audit fix to resolve without breaking changes." },
      { priority: "medium", title: "Improve Documentation",      description: "Add JSDoc to all exported functions. Expand README with API reference and environment setup guide." },
      { priority: "medium", title: "Enable CI/CD Pipeline",      description: "No GitHub Actions configured. Add a workflow to run tests, linting, and type-checks on every PR." },
      { priority: "low",    title: "Reduce Bundle Size",         description: "Main bundle is 420 KB. Consider lazy loading route components to improve initial load performance." },
    ],
  },
  "authserver-go": {
    name: "AuthServer Go",
    owner: "ishaan-saxena",
    visibility: "Public",
    language: "Go",
    lastUpdated: "5 hours ago",
    status: "Clean Build",
    healthScore: 88,
    healthLabel: "Excellent Engineering Health",
    description:
      "Production-grade OAuth2 / JWT authentication server written in Go. Supports PKCE, refresh token rotation, and Redis-backed session management.",
    evidence: [
      { label: "Code Quality",      score: 91, icon: "code",    color: "#77fc75", explanation: "Idiomatic Go style with consistent error wrapping and strong interface boundaries." },
      { label: "Documentation",     score: 84, icon: "docs",    color: "#77fc75", explanation: "GoDoc coverage on all exported symbols. Swagger API docs generated on build." },
      { label: "Testing",           score: 87, icon: "test",    color: "#77fc75", explanation: "Table-driven unit tests, integration tests against test DB, 78% line coverage." },
      { label: "Security",          score: 95, icon: "shield",  color: "#77fc75", explanation: "OWASP top-10 mitigations applied. Secrets via env. Zero known CVEs." },
      { label: "Maintainability",   score: 88, icon: "wrench",  color: "#77fc75", explanation: "Dependency injection throughout. Avg cyclomatic complexity 4.2 (excellent)." },
      { label: "Architecture",      score: 90, icon: "arch",    color: "#77fc75", explanation: "Hexagonal architecture. Clear domain/infra/adapter split with clean dependency graph." },
    ],
    techStack: ["Go", "Redis", "PostgreSQL", "Docker", "OAuth2", "JWT", "Swagger", "GitHub Actions"],
    stats: [
      { label: "Commits",      value: "541",  icon: "commit" },
      { label: "Contributors", value: "1",    icon: "users" },
      { label: "Pull Requests",value: "89",   icon: "pr" },
      { label: "Issues",       value: "4",    icon: "issue" },
      { label: "Stars",        value: "147",  icon: "star" },
      { label: "Forks",        value: "31",   icon: "fork" },
    ],
    aiSummary:
      "AuthServer Go is a standout repository demonstrating production-level engineering discipline. The codebase shows excellent security posture, comprehensive testing, and idiomatic Go patterns. Documentation is thorough with auto-generated API specs. This repository provides strong, verifiable evidence of backend engineering expertise, security awareness, and open-source contribution quality.",
    activity: [
      { hash: "9c3e21a", message: "feat: implement PKCE code challenge flow",     author: "ishaan-saxena", time: "5 hours ago",  type: "feat" },
      { hash: "8b1d44f", message: "test: add table tests for token validation",   author: "ishaan-saxena", time: "1 day ago",   type: "test" },
      { hash: "7a2f8c3", message: "fix: race condition in refresh token handler",  author: "ishaan-saxena", time: "2 days ago",  type: "fix" },
      { hash: "6e9c1b2", message: "docs: generate Swagger from annotations",      author: "ishaan-saxena", time: "4 days ago",  type: "docs" },
      { hash: "5d7a3e1", message: "chore: update Go to 1.22, bump dependencies",  author: "ishaan-saxena", time: "1 week ago",  type: "chore" },
      { hash: "4f2b8a9", message: "feat: add Redis session revocation endpoint",  author: "ishaan-saxena", time: "2 weeks ago", type: "feat" },
    ],
    recommendations: [
      { priority: "low",   title: "Add Prometheus Metrics",   description: "Expose /metrics endpoint with request latencies and token issuance counts for observability." },
      { priority: "low",   title: "Expand Contribution Docs", description: "Add CONTRIBUTING.md with development setup, test commands, and PR conventions to onboard contributors." },
      { priority: "low",   title: "Add Benchmark Tests",      description: "Token signing is hot-path code. Add Go benchmarks to detect performance regressions across versions." },
      { priority: "low",   title: "Create Release Workflow",  description: "Automate semantic versioning and Docker image publishing on tag push using GitHub Actions." },
      { priority: "low",   title: "Browser-Test OAuth Flow",  description: "Add a Playwright smoke test to verify the full authorization-code flow end-to-end in a browser." },
    ],
  },
  "dockerized-node-scaffold": {
    name: "Dockerized Node Scaffold",
    owner: "ishaan-saxena",
    visibility: "Public",
    language: "JavaScript",
    lastUpdated: "3 weeks ago",
    status: "Testing Gaps Detected",
    healthScore: 52,
    healthLabel: "Needs Improvement",
    description:
      "Starter scaffold for containerised Node.js microservices. Includes Docker Compose setup, Express boilerplate, and PM2 process management.",
    evidence: [
      { label: "Code Quality",      score: 63, icon: "code",    color: "#f59e0b", explanation: "Mixed ES module and CommonJS patterns. Some functions exceed recommended complexity." },
      { label: "Documentation",     score: 71, icon: "docs",    color: "#f59e0b", explanation: "Good README scaffold. Missing inline docs in Docker entrypoint and PM2 config." },
      { label: "Testing",           score: 18, icon: "test",    color: "#ef4444", explanation: "Only a single smoke test exists. No unit, integration, or container-level test suite." },
      { label: "Security",          score: 55, icon: "shield",  color: "#f59e0b", explanation: "Secrets hardcoded in docker-compose.yml. No .env.example. CORS set to wildcard." },
      { label: "Maintainability",   score: 60, icon: "wrench",  color: "#f59e0b", explanation: "Moderate coupling. Several utility functions duplicated across route files." },
      { label: "Architecture",      score: 49, icon: "arch",    color: "#ef4444", explanation: "Flat folder structure. No clear separation between domain logic and HTTP layer." },
    ],
    techStack: ["Node.js", "Express", "Docker", "PM2", "JavaScript", "Docker Compose"],
    stats: [
      { label: "Commits",      value: "88",   icon: "commit" },
      { label: "Contributors", value: "2",    icon: "users" },
      { label: "Pull Requests",value: "11",   icon: "pr" },
      { label: "Issues",       value: "19",   icon: "issue" },
      { label: "Stars",        value: "12",   icon: "star" },
      { label: "Forks",        value: "8",    icon: "fork" },
    ],
    aiSummary:
      "Dockerized Node Scaffold is a useful starting point but carries significant gaps that limit its value as developer evidence. Testing is near-absent, security practices are weak with secrets visible in version-controlled config files, and the architecture lacks a clear layered structure. These are addressable issues — resolving them would substantially improve the repository's evidence score and demonstrate growth in engineering maturity.",
    activity: [
      { hash: "2a8c3f1", message: "chore: add .gitignore for node_modules",      author: "ishaan-saxena", time: "3 weeks ago", type: "chore" },
      { hash: "1b7d2e4", message: "fix: correct PM2 ecosystem config path",       author: "ishaan-saxena", time: "3 weeks ago", type: "fix" },
      { hash: "9e4c1a8", message: "feat: add Docker Compose health check",        author: "dev-contrib",   time: "1 month ago", type: "feat" },
      { hash: "8f3b9d2", message: "docs: add quick-start section to README",     author: "ishaan-saxena", time: "1 month ago", type: "docs" },
      { hash: "7c2a8e1", message: "feat: initial scaffold with Express routes",   author: "ishaan-saxena", time: "2 months ago", type: "feat" },
    ],
    recommendations: [
      { priority: "high",   title: "Remove Hardcoded Secrets",   description: "Move all credentials from docker-compose.yml to a .env file. Add .env to .gitignore immediately." },
      { priority: "high",   title: "Add Test Suite",             description: "Set up Jest with supertest for route integration tests. Even 30% coverage would be a significant improvement." },
      { priority: "medium", title: "Adopt Layered Architecture",  description: "Separate route handlers from business logic. Create /services and /repositories directories." },
      { priority: "medium", title: "Fix CORS Wildcard",           description: "Replace '*' CORS origin with an allowlist to prevent cross-origin credential leakage." },
      { priority: "low",    title: "Migrate to TypeScript",       description: "Add tsconfig.json and gradually type the codebase for improved maintainability and IDE support." },
    ],
  },
};

/* ═══════════════════════════════════════════════════════
   TYPES
═══════════════════════════════════════════════════════ */

interface EvidenceCard {
  label: string; score: number; icon: string; color: string; explanation: string;
}
interface Stat { label: string; value: string; icon: string; }
interface Activity { hash: string; message: string; author: string; time: string; type: string; }
interface Recommendation { priority: "high" | "medium" | "low"; title: string; description: string; }
interface RepoData {
  name: string; owner: string; visibility: string; language: string;
  lastUpdated: string; status: string; healthScore: number; healthLabel: string;
  description: string; evidence: EvidenceCard[]; techStack: string[];
  stats: Stat[]; aiSummary: string; activity: Activity[]; recommendations: Recommendation[];
}

/* ═══════════════════════════════════════════════════════
   HELPERS
═══════════════════════════════════════════════════════ */

function scoreColor(score: number) {
  if (score >= 80) return "#77fc75";
  if (score >= 60) return "#f59e0b";
  return "#ef4444";
}

function commitTypeColor(type: string) {
  const map: Record<string, string> = {
    feat: "#77fc75", fix: "#ef4444", docs: "#60a5fa",
    refactor: "#a78bfa", chore: "#94a3b8", test: "#f59e0b",
  };
  return map[type] ?? "#94a3b8";
}

function priorityStyle(p: string) {
  if (p === "high")   return { dot: "#ef4444", bg: "rgba(239,68,68,0.08)",    border: "rgba(239,68,68,0.18)",    text: "#f87171" };
  if (p === "medium") return { dot: "#f59e0b", bg: "rgba(245,158,11,0.08)",   border: "rgba(245,158,11,0.18)",   text: "#fbbf24" };
  return               { dot: "#60a5fa", bg: "rgba(96,165,250,0.08)",   border: "rgba(96,165,250,0.18)",   text: "#93c5fd" };
}

/* ── Icons ────────────────────────────────────────────── */
const Icons = {
  code: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
      <polyline points="16 18 22 12 16 6"/><polyline points="8 6 2 12 8 18"/>
    </svg>
  ),
  docs: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/>
    </svg>
  ),
  test: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
      <path d="M9 3H5a2 2 0 0 0-2 2v4m6-6h10a2 2 0 0 1 2 2v4M9 3v18m0 0h10a2 2 0 0 0 2-2v-4M9 21H5a2 2 0 0 1-2-2v-4m0 0h18"/>
    </svg>
  ),
  shield: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
    </svg>
  ),
  wrench: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
      <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/>
    </svg>
  ),
  arch: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
      <rect x="2" y="3" width="6" height="5" rx="1"/><rect x="16" y="3" width="6" height="5" rx="1"/><rect x="9" y="15" width="6" height="6" rx="1"/><path d="M5 8v3a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1V8"/><line x1="12" y1="12" x2="12" y2="15"/>
    </svg>
  ),
  commit: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
      <circle cx="12" cy="12" r="3"/><line x1="3" y1="12" x2="9" y2="12"/><line x1="15" y1="12" x2="21" y2="12"/>
    </svg>
  ),
  users: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>
    </svg>
  ),
  pr: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
      <circle cx="18" cy="18" r="3"/><circle cx="6" cy="6" r="3"/><path d="M6 21V9a9 9 0 0 0 9 9"/>
    </svg>
  ),
  issue: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
      <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
    </svg>
  ),
  star: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
      <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
    </svg>
  ),
  fork: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
      <circle cx="12" cy="18" r="3"/><circle cx="6" cy="6" r="3"/><circle cx="18" cy="6" r="3"/><path d="M18 9v2c0 .6-.4 1-1 1H7c-.6 0-1-.4-1-1V9"/><line x1="12" y1="15" x2="12" y2="12"/>
    </svg>
  ),
  ai: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
      <path d="M12 2a10 10 0 1 0 10 10"/><path d="M12 8v4l3 3"/><path d="M18.4 5.6 22 2"/><path d="M22 6V2h-4"/>
    </svg>
  ),
  back: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
      <line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/>
    </svg>
  ),
  clock: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="w-3.5 h-3.5">
      <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
    </svg>
  ),
  globe: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="w-3.5 h-3.5">
      <circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/>
    </svg>
  ),
};

/* ═══════════════════════════════════════════════════════
   SUB-COMPONENTS
═══════════════════════════════════════════════════════ */

/** Circular SVG score gauge */
function ScoreRing({ score, size = 160 }: { score: number; size?: number }) {
  const r = (size - 24) / 2;
  const c = 2 * Math.PI * r;
  const offset = c - (score / 100) * c;
  const color = scoreColor(score);
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="drop-shadow-[0_0_20px_rgba(119,252,117,0.25)]">
      {/* Track */}
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="10"/>
      {/* Progress */}
      <circle
        cx={size / 2} cy={size / 2} r={r}
        fill="none" stroke={color} strokeWidth="10"
        strokeLinecap="round"
        strokeDasharray={c}
        strokeDashoffset={offset}
        transform={`rotate(-90 ${size / 2} ${size / 2})`}
        style={{ filter: `drop-shadow(0 0 8px ${color}88)`, transition: "stroke-dashoffset 1s cubic-bezier(0.34,1.56,0.64,1)" }}
      />
      {/* Inner text */}
      <text x="50%" y="46%" dominantBaseline="middle" textAnchor="middle" fontSize="28" fontWeight="700" fill="white" fontFamily="Sora, sans-serif">{score}</text>
      <text x="50%" y="63%" dominantBaseline="middle" textAnchor="middle" fontSize="10" fill="rgba(255,255,255,0.4)" fontFamily="Sora, sans-serif">/100</text>
    </svg>
  );
}

/** Animated progress bar */
function ProgressBar({ score, color }: { score: number; color: string }) {
  return (
    <div className="relative w-full h-1.5 rounded-full overflow-hidden" style={{ background: "rgba(255,255,255,0.06)" }}>
      <motion.div
        initial={{ width: 0 }}
        animate={{ width: `${score}%` }}
        transition={{ duration: 1, delay: 0.3, ease: [0.34, 1.56, 0.64, 1] }}
        className="absolute inset-y-0 left-0 rounded-full"
        style={{ background: color, boxShadow: `0 0 8px ${color}66` }}
      />
    </div>
  );
}

/** Evidence card */
function EvidenceCardItem({ card, index }: { card: EvidenceCard; index: number }) {
  const icon = Icons[card.icon as keyof typeof Icons];
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.1 + index * 0.07, duration: 0.45 }}
      className="group relative rounded-2xl border border-white/[0.08] bg-white/[0.03] p-5 flex flex-col gap-3 hover:border-white/[0.16] hover:bg-white/[0.055] transition-all duration-300 overflow-hidden"
    >
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/[0.10] to-transparent pointer-events-none" />
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl border border-white/[0.08] bg-white/[0.04] flex items-center justify-center transition-all duration-300 group-hover:border-white/[0.16]"
            style={{ color: card.color }}>
            {icon}
          </div>
          <span className="text-sm font-semibold text-white/80">{card.label}</span>
        </div>
        <span className="text-xl font-bold tabular-nums" style={{ color: card.color }}>{card.score}</span>
      </div>
      <ProgressBar score={card.score} color={card.color} />
      <p className="text-[12px] leading-relaxed text-white/40 font-light">{card.explanation}</p>
    </motion.div>
  );
}

/** Stat card */
function StatCard({ stat, index }: { stat: Stat; index: number }) {
  const icon = Icons[stat.icon as keyof typeof Icons];
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay: 0.05 * index, duration: 0.4 }}
      className="rounded-2xl border border-white/[0.08] bg-white/[0.03] p-5 flex flex-col gap-2 hover:border-white/[0.14] hover:bg-white/[0.05] transition-all duration-300"
    >
      <div className="flex items-center gap-2 text-white/35">
        {icon}
        <span className="text-[11px] font-semibold uppercase tracking-widest">{stat.label}</span>
      </div>
      <p className="text-2xl font-bold text-white tabular-nums">{stat.value}</p>
    </motion.div>
  );
}

/** Activity timeline item */
function ActivityItem({ item, index, isLast }: { item: Activity; index: number; isLast: boolean }) {
  const color = commitTypeColor(item.type);
  return (
    <motion.div
      initial={{ opacity: 0, x: -12 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: 0.05 * index, duration: 0.4 }}
      className="flex gap-4 group"
    >
      {/* Timeline spine */}
      <div className="flex flex-col items-center shrink-0">
        <div className="w-7 h-7 rounded-full border border-white/[0.10] bg-white/[0.04] flex items-center justify-center transition-all group-hover:border-white/[0.22]"
          style={{ color }}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" className="w-3 h-3">
            <circle cx="12" cy="12" r="3"/><line x1="3" y1="12" x2="9" y2="12"/><line x1="15" y1="12" x2="21" y2="12"/>
          </svg>
        </div>
        {!isLast && <div className="w-px flex-1 mt-1" style={{ background: "rgba(255,255,255,0.05)" }} />}
      </div>
      {/* Content */}
      <div className="pb-5 flex-1 min-w-0">
        <div className="flex items-start gap-2 flex-wrap">
          <span className="text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-full border" style={{ color, borderColor: `${color}44`, background: `${color}12` }}>
            {item.type}
          </span>
          <p className="text-sm text-white/80 font-medium flex-1 min-w-0 leading-tight">{item.message}</p>
        </div>
        <div className="flex items-center gap-3 mt-1.5 text-[11px] text-white/30">
          <span className="font-mono">{item.hash}</span>
          <span>·</span>
          <span>{item.author}</span>
          <span>·</span>
          <div className="flex items-center gap-1">{Icons.clock}<span>{item.time}</span></div>
        </div>
      </div>
    </motion.div>
  );
}

/** Recommendation card */
function RecommendationCard({ rec, index }: { rec: Recommendation; index: number }) {
  const ps = priorityStyle(rec.priority);
  return (
    <motion.div
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.06 * index, duration: 0.42 }}
      className="rounded-2xl border p-5 flex gap-4 hover:brightness-[1.05] transition-all duration-300"
      style={{ background: ps.bg, borderColor: ps.border }}
    >
      <div className="shrink-0 mt-0.5">
        <div className="w-2 h-2 rounded-full mt-1" style={{ background: ps.dot, boxShadow: `0 0 6px ${ps.dot}88` }} />
      </div>
      <div>
        <div className="flex items-center gap-2 mb-1">
          <h4 className="text-sm font-semibold text-white/90">{rec.title}</h4>
          <span className="text-[9px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-full border" style={{ color: ps.text, borderColor: `${ps.dot}44`, background: `${ps.dot}14` }}>
            {rec.priority}
          </span>
        </div>
        <p className="text-[12px] leading-relaxed text-white/45 font-light">{rec.description}</p>
      </div>
    </motion.div>
  );
}

/* ═══════════════════════════════════════════════════════
   PAGE
═══════════════════════════════════════════════════════ */

export default function RepositoryDetails() {
  const { repoSlug } = useParams<{ repoSlug: string }>();
  const navigate = useNavigate();

  const repo = repoSlug ? MOCK_REPOS[repoSlug] : null;

  if (!repo) {
    return (
      <motion.div
        initial={{ opacity: 0 }} animate={{ opacity: 1 }}
        className="flex flex-col items-center justify-center py-32 gap-5"
      >
        <p className="text-white/40 text-sm">Repository not found.</p>
        <button onClick={() => navigate("/dashboard/repositories")}
          className="text-primary text-sm font-semibold hover:underline flex items-center gap-1.5">
          {Icons.back} Back to Repositories
        </button>
      </motion.div>
    );
  }

  const hc = scoreColor(repo.healthScore);

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: "easeOut" }}
      className="w-full flex flex-col gap-8 pb-8"
    >
      {/* ── Back breadcrumb ───────────────────────────── */}
      <button
        onClick={() => navigate("/dashboard/repositories")}
        className="flex items-center gap-2 text-[13px] font-medium text-white/40 hover:text-white/80 transition-colors w-fit"
      >
        {Icons.back}
        <span>Repositories</span>
        <span className="text-white/20">/</span>
        <span className="text-white/70">{repo.name}</span>
      </button>

      {/* ═══════════════════════════════════════════════
          1. REPOSITORY HEADER
      ═══════════════════════════════════════════════ */}
      <GlassCard hover={false} className="p-6 md:p-8">
        <div className="flex flex-col md:flex-row md:items-start gap-6 justify-between">
          <div className="flex-1 min-w-0">
            <div className="flex flex-wrap items-center gap-3 mb-3">
              <h1 className="text-2xl md:text-3xl font-bold text-white tracking-tight">{repo.name}</h1>
              {/* Visibility badge */}
              <span className="inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest px-2.5 py-1 rounded-full border"
                style={repo.visibility === "Public"
                  ? { color: "#77fc75", borderColor: "rgba(119,252,117,0.25)", background: "rgba(119,252,117,0.08)" }
                  : { color: "#a78bfa", borderColor: "rgba(167,139,250,0.25)", background: "rgba(167,139,250,0.08)" }
                }>
                {Icons.globe}
                {repo.visibility}
              </span>
            </div>
            <p className="text-sm text-white/50 mb-4 leading-relaxed max-w-2xl">{repo.description}</p>

            {/* Meta row */}
            <div className="flex flex-wrap gap-x-6 gap-y-2 text-[12px] text-white/35">
              <span><span className="text-white/50">Owner:</span> {repo.owner}</span>
              <span><span className="text-white/50">Language:</span> {repo.language}</span>
              <div className="flex items-center gap-1">{Icons.clock}<span>Updated {repo.lastUpdated}</span></div>
              <span>
                <span className="inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-full border border-primary/25 bg-primary/08 text-primary">
                  <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
                  {repo.status}
                </span>
              </span>
            </div>
          </div>

          {/* Health score ring */}
          <div className="flex flex-col items-center gap-2 shrink-0">
            <ScoreRing score={repo.healthScore} size={140} />
            <p className="text-[11px] font-bold uppercase tracking-widest text-center" style={{ color: hc }}>{repo.healthLabel}</p>
          </div>
        </div>
      </GlassCard>

      {/* ═══════════════════════════════════════════════
          3. EVIDENCE CARDS
      ═══════════════════════════════════════════════ */}
      <div>
        <SectionLabel>Evidence Analysis</SectionLabel>
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
          {repo.evidence.map((card, i) => (
            <EvidenceCardItem key={card.label} card={card} index={i} />
          ))}
        </div>
      </div>

      {/* ═══════════════════════════════════════════════
          4. TECH STACK + 5. STATISTICS  (side by side on lg)
      ═══════════════════════════════════════════════ */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Technology Stack */}
        <GlassCard hover={false} className="p-6">
          <SectionLabel className="mt-0 mb-4">Technology Stack</SectionLabel>
          <div className="flex flex-wrap gap-2">
            {repo.techStack.map((tech) => (
              <span key={tech}
                className="text-xs font-semibold px-3 py-1.5 rounded-full border border-white/[0.10] bg-white/[0.04] text-white/65 hover:text-white hover:border-white/[0.22] hover:bg-white/[0.08] transition-all duration-200 cursor-default">
                {tech}
              </span>
            ))}
          </div>
        </GlassCard>

        {/* Statistics */}
        <div>
          <SectionLabel className="mt-0">Repository Statistics</SectionLabel>
          <div className="grid grid-cols-3 gap-3">
            {repo.stats.map((stat, i) => (
              <StatCard key={stat.label} stat={stat} index={i} />
            ))}
          </div>
        </div>
      </div>

      {/* ═══════════════════════════════════════════════
          6. AI SUMMARY
      ═══════════════════════════════════════════════ */}
      <div>
        <SectionLabel>AI Summary</SectionLabel>
        <GlassCard hover={false} className="p-6 md:p-8 relative overflow-hidden">
          <div className="absolute inset-0 pointer-events-none" style={{
            background: "radial-gradient(ellipse at 0% 0%, rgba(119,252,117,0.06) 0%, transparent 55%)"
          }} />
          <div className="relative flex gap-4">
            <div className="shrink-0 w-10 h-10 rounded-xl border border-primary/20 bg-primary/08 flex items-center justify-center text-primary">
              {Icons.ai}
            </div>
            <div>
              <p className="text-[11px] font-bold uppercase tracking-widest text-primary/70 mb-2">DevProof Intelligence</p>
              <p className="text-sm leading-relaxed text-white/65 font-light">{repo.aiSummary}</p>
            </div>
          </div>
        </GlassCard>
      </div>

      {/* ═══════════════════════════════════════════════
          7. RECENT ACTIVITY  +  8. RECOMMENDATIONS
      ═══════════════════════════════════════════════ */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Activity */}
        <div>
          <SectionLabel className="mt-0">Recent Activity</SectionLabel>
          <GlassCard hover={false} className="p-6">
            <div>
              {repo.activity.map((item, i) => (
                <ActivityItem key={item.hash} item={item} index={i} isLast={i === repo.activity.length - 1} />
              ))}
            </div>
          </GlassCard>
        </div>

        {/* Recommendations */}
        <div>
          <SectionLabel className="mt-0">Recommendations</SectionLabel>
          <div className="flex flex-col gap-3">
            {repo.recommendations.map((rec, i) => (
              <RecommendationCard key={rec.title} rec={rec} index={i} />
            ))}
          </div>
        </div>
      </div>
    </motion.div>
  );
}

/* Small reusable section label */
function SectionLabel({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <p className={`text-[11px] font-bold uppercase tracking-[0.2em] text-white/30 mb-4 ${className}`}>
      {children}
    </p>
  );
}
