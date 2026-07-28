import PageContainer from "../../components/PageContainer";
import { motion } from "motion/react";

/* ── Status badge colours ─────────────────────────── */
type BadgeVariant = "empty" | "connect" | "coming" | "optional" | "upload";

const BADGE_STYLES: Record<BadgeVariant, string> = {
  empty:    "bg-white/[0.06] border-white/[0.10] text-white/50",
  connect:  "bg-primary/10 border-primary/25 text-primary",
  coming:   "bg-amber-400/10 border-amber-400/25 text-amber-300",
  optional: "bg-blue-400/10 border-blue-400/25 text-blue-300",
  upload:   "bg-violet-400/10 border-violet-400/25 text-violet-300",
};

function Badge({ variant, label }: { variant: BadgeVariant; label: string }) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest px-2.5 py-1 rounded-full border ${BADGE_STYLES[variant]}`}
    >
      <span
        className={`w-1.5 h-1.5 rounded-full shrink-0 ${
          variant === "connect" ? "bg-primary animate-pulse" :
          variant === "coming"  ? "bg-amber-400 animate-pulse" :
          variant === "optional"? "bg-blue-400" :
          variant === "upload"  ? "bg-violet-400" : "bg-white/30"
        }`}
      />
      {label}
    </span>
  );
}

/* ── Individual source card ───────────────────────── */
interface SourceCard {
  icon: React.ReactNode;
  name: string;
  description: string;
  badge: { variant: BadgeVariant; label: string };
}

const SOURCES: SourceCard[] = [
  {
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-6 h-6">
        <path d="M15 22v-4a4.8 4.8 0 0 0-1-3.2c3-.3 6-1.5 6-6.5 0-1.4-.5-2.5-1.5-3.4.1-.3.4-1.6-.1-3.3 0 0-1.2-.4-3.8 1.4a12.8 12.8 0 0 0-7 0C6.2 2.6 5 3 5 3c-.5 1.7-.2 3 .1 3.3C4.1 7.2 3.6 8.3 3.6 9.7c0 5 3 6.2 6 6.5-.4.4-.8 1-.9 2-.9.4-3.2.1-4.6-1.3 0 0-.8-1.5-2.2-1.5 0 0-1.4 0 0 1.3 1.2 1.5 2 3.2 2 3.2 1.4 2 4 1.5 4 1.5"/>
      </svg>
    ),
    name: "GitHub",
    description: "Link your GitHub profile to surface repositories, commit history, and open-source contributions as verifiable evidence.",
    badge: { variant: "connect", label: "Connect Later" },
  },
  {
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-6 h-6">
        <rect x="2" y="3" width="20" height="14" rx="2"/>
        <path d="M8 21h8M12 17v4"/>
        <path d="m9 8 2 2 4-4"/>
      </svg>
    ),
    name: "LeetCode",
    description: "Import your problem-solving stats, acceptance rates, and contest rankings directly from your LeetCode account.",
    badge: { variant: "coming", label: "Coming Soon" },
  },
  {
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-6 h-6">
        <path d="M12 2L2 7l10 5 10-5-10-5z"/>
        <path d="M2 17l10 5 10-5"/>
        <path d="M2 12l10 5 10-5"/>
      </svg>
    ),
    name: "GeeksforGeeks",
    description: "Sync your GFG practice streak, article contributions, and coding score to your developer evidence profile.",
    badge: { variant: "coming", label: "Coming Soon" },
  },
  {
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-6 h-6">
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
        <polyline points="14,2 14,8 20,8"/>
        <line x1="16" y1="13" x2="8" y2="13"/>
        <line x1="16" y1="17" x2="8" y2="17"/>
        <polyline points="10,9 9,9 8,9"/>
      </svg>
    ),
    name: "Resume",
    description: "Upload your resume or CV so DevProof can extract experience, technologies, and achievements for your profile.",
    badge: { variant: "upload", label: "Upload Later" },
  },
  {
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-6 h-6">
        <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z"/>
        <rect x="2" y="9" width="4" height="12"/>
        <circle cx="4" cy="4" r="2"/>
      </svg>
    ),
    name: "LinkedIn",
    description: "Optionally connect LinkedIn to pull in professional experience, endorsements, and certifications from your network.",
    badge: { variant: "optional", label: "Optional" },
  },
  {
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-6 h-6">
        <path d="M22 10v6M2 10l10-5 10 5-10 5z"/>
        <path d="M6 12v5c3 3 9 3 12 0v-5"/>
      </svg>
    ),
    name: "Courses",
    description: "Add completed online courses from Coursera, Udemy, edX, Pluralsight, and more to demonstrate continuous learning.",
    badge: { variant: "empty", label: "Empty" },
  },
  {
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-6 h-6">
        <circle cx="12" cy="8" r="6"/>
        <path d="M15.477 12.89 17 22l-5-3-5 3 1.523-9.11"/>
      </svg>
    ),
    name: "Certifications",
    description: "Upload industry certifications — AWS, GCP, Azure, Kubernetes, and other professional credentials — to prove expertise.",
    badge: { variant: "empty", label: "Empty" },
  },
  {
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-6 h-6">
        <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
      </svg>
    ),
    name: "Hackathons",
    description: "Log hackathon participations and awards to signal real-world problem-solving under pressure and team collaboration.",
    badge: { variant: "empty", label: "Empty" },
  },
];

/* ── Card component ───────────────────────────────── */
function SourceCardItem({ card, index }: { card: SourceCard; index: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 18 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, delay: index * 0.06, ease: [0.25, 0.46, 0.45, 0.94] }}
      className="group relative rounded-2xl border border-white/[0.08] bg-white/[0.03] backdrop-blur-sm p-6 flex flex-col gap-4 hover:border-white/[0.16] hover:bg-white/[0.055] transition-all duration-300 overflow-hidden cursor-default"
    >
      {/* Subtle top reflection */}
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/[0.12] to-transparent pointer-events-none" />

      {/* Hover glow */}
      <div className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"
        style={{ background: "radial-gradient(ellipse at 50% -20%, rgba(119,252,117,0.05) 0%, transparent 65%)" }} />

      {/* Icon */}
      <div className="w-11 h-11 rounded-xl border border-white/[0.10] bg-white/[0.05] flex items-center justify-center text-white/60 group-hover:text-white/80 group-hover:border-white/[0.18] transition-all duration-300 shrink-0">
        {card.icon}
      </div>

      {/* Text */}
      <div className="flex-1 min-w-0">
        <h3 className="text-[15px] font-semibold text-white/90 mb-1.5 tracking-tight">{card.name}</h3>
        <p className="text-[13px] leading-relaxed text-white/45 font-light">{card.description}</p>
      </div>

      {/* Badge */}
      <div>
        <Badge variant={card.badge.variant} label={card.badge.label} />
      </div>
    </motion.div>
  );
}

/* ── Page ─────────────────────────────────────────── */
export default function Credentials() {
  return (
    <PageContainer
      title="Learning & Credentials"
      description="Connect your learning journey and achievements. Every source becomes verified evidence in your developer profile."
    >
      {/* Section label */}
      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.1 }}
        className="text-[11px] font-bold uppercase tracking-[0.2em] text-white/30 mb-6"
      >
        Evidence Sources
      </motion.p>

      {/* Grid of cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
        {SOURCES.map((card, i) => (
          <SourceCardItem key={card.name} card={card} index={i} />
        ))}
      </div>

      {/* Footer note */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.7 }}
        className="mt-10 rounded-2xl border border-white/[0.06] bg-white/[0.02] px-6 py-4 flex items-start gap-3"
      >
        <span className="mt-0.5 w-4 h-4 shrink-0 text-white/30">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10"/><path d="M12 16v-4"/><path d="M12 8h.01"/>
          </svg>
        </span>
        <p className="text-[12px] text-white/35 leading-relaxed font-light">
          All integrations are optional and privacy-first. You control exactly which data sources are connected and what evidence is visible on your profile.
        </p>
      </motion.div>
    </PageContainer>
  );
}
