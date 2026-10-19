import { motion } from "motion/react";
import { CheckCircle2, Minus, BookOpen, Award, Globe, Building2, CalendarDays, ExternalLink, Pencil, Trash2, ChevronDown, Fingerprint } from "lucide-react";
import { useState } from "react";

/** Fade/slide-in shared by all sections of this page. */
export function LAReveal({
  children,
  delay = 0,
  className,
}: {
  children: React.ReactNode;
  delay?: number;
  className?: string;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 18 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, delay, ease: [0.25, 0.46, 0.45, 0.94] }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

/**
 * Section micro-label — matches Developer360/PP label treatment.
 *
 * An h2, not a <p>: these labels (Resume, Learning Overview, Courses &
 * Certifications, …) are the page's section headings, sitting under the
 * header's h1. Preflight keeps an h2 inheriting the surrounding font
 * metrics, so the classes below — not the tag — decide how it looks.
 */
export function LALabel({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <h2 className={`text-[11px] font-bold uppercase tracking-[0.2em] text-white/30 mb-4 ${className}`}>
      {children}
    </h2>
  );
}

/** Uppercase micro-label inside cards. */
export function LAStatLabel({ children }: { children: React.ReactNode }) {
  return <p className="text-[10px] font-bold uppercase tracking-widest text-white/35">{children}</p>;
}

/** Status chip — the single source of truth for Available / Not available. */
export function EvidenceChip({ available, label }: { available: boolean; label: string }) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 text-[9px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-full border shrink-0 ${
        available
          ? "text-primary border-primary/25 bg-primary/10"
          : "text-white/35 border-white/10 bg-white/[0.03]"
      }`}
    >
      {available ? <CheckCircle2 className="w-2.5 h-2.5" /> : <Minus className="w-2.5 h-2.5" />}
      {label}
    </span>
  );
}

/** Shared type badge used inside the combined Courses & Certifications section. */
export type RecordKind = "course" | "certification";

const KIND_META: Record<RecordKind, { label: string; icon: typeof BookOpen; color: string; bg: string; text: string }> = {
  course: {
    label: "Course",
    icon: BookOpen,
    color: "border-sky-400/25",
    bg: "bg-sky-400/10",
    text: "text-sky-300",
  },
  certification: {
    label: "Certification",
    icon: Award,
    color: "border-violet-400/25",
    bg: "bg-violet-400/10",
    text: "text-violet-300",
  },
};

export function RecordTypeBadge({ kind }: { kind: RecordKind }) {
  const meta = KIND_META[kind];
  const Icon = meta.icon;
  return (
    <span className={`inline-flex items-center gap-1.5 text-[9px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-full border ${meta.color} ${meta.bg} ${meta.text}`}>
      <Icon className="w-3 h-3" />
      {meta.label}
    </span>
  );
}

/** Combined card for the Courses & Certifications section. Accepts a discriminated
 * union so TypeScript forces the correct field set per kind; the backend-backed
 * dates and optional fields stay source-of-truth, and a record's kind is never
 * inferred or converted.
 */
export interface RecordCardProps {
  kind: RecordKind;
  id: string;
  index: number;
  title: string;
  issuerOrPlatform: string;
  date: string | null;
  certificateUrl?: string | null;
  credentialId?: string | null;
  issueDate?: string | null;
  learnedSkills?: string[];
  isCompleted?: boolean;
  /**
   * Omitted in the demo, where removing a record would write to an account the
   * visitor does not have — the button is then not rendered at all.
   */
  onRemove?: (id: string) => void;
  onEdit?: (id: string, kind: RecordKind) => void;
}

export function RecordCard({
  kind,
  id,
  index,
  title,
  issuerOrPlatform,
  date,
  certificateUrl,
  credentialId,
  issueDate,
  learnedSkills,
  isCompleted,
  onRemove,
  onEdit,
}: RecordCardProps) {
  const [open, setOpen] = useState(false);
  const meta = KIND_META[kind];
  const Icon = meta.icon;
  const hasSkillsOrExtras =
    (learnedSkills?.length ?? 0) > 0 ||
    Boolean(certificateUrl) ||
    Boolean(credentialId) ||
    Boolean(issueDate);

  const formattedDate =
    kind === "course"
      ? isCompleted && date
        ? `Completed ${new Date(date).toLocaleDateString(undefined, { month: "short", year: "numeric" })}`
        : "No completion date yet"
      : issueDate
        ? `Issued ${new Date(issueDate).toLocaleDateString(undefined, { month: "short", year: "numeric" })}`
        : "Not dated";

  return (
    <motion.div
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.05 * index, duration: 0.4 }}
      className="glass-panel overflow-hidden relative"
    >
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/[0.10] to-transparent pointer-events-none" />

      <div className="p-5 flex items-start gap-4">
        <div className={`w-10 h-10 rounded-xl border ${meta.color} ${meta.bg} ${meta.text} flex items-center justify-center shrink-0`}>
          <Icon className="w-5 h-5" />
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="text-sm font-bold text-white leading-tight">{title}</h3>
            {kind === "course" && isCompleted != null && (
              isCompleted ? (
                <span className="inline-flex items-center gap-1 text-[9px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-full border border-primary/25 bg-primary/10 text-primary">
                  Completed
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 text-[9px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-full border border-amber-400/25 bg-amber-400/10 text-amber-300">
                  In progress
                </span>
              )
            )}
            {kind === "certification" && (
              <span className="inline-flex items-center gap-1 text-[9px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-full border border-white/12 bg-white/[0.04] text-white/50">
                Credential added
              </span>
            )}
            <RecordTypeBadge kind={kind} />
          </div>
          <p className="text-[12px] text-white/45 mt-1 flex flex-wrap items-center gap-x-2 gap-y-1">
            {kind === "course" ? (
              <>
                <Globe className="w-3 h-3 text-white/25 shrink-0" /> {issuerOrPlatform}
                <span className="text-white/20">·</span>
                <CalendarDays className="w-3 h-3 text-white/25 shrink-0" /> {formattedDate}
              </>
            ) : (
              <>
                <Building2 className="w-3 h-3 text-white/25 shrink-0" /> {issuerOrPlatform}
                <span className="text-white/20">·</span>
                <CalendarDays className="w-3 h-3 text-white/25 shrink-0" /> {formattedDate}
              </>
            )}
          </p>
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          {certificateUrl && (
            <a
              href={certificateUrl}
              target="_blank"
              rel="noreferrer"
              title={kind === "course" ? "Open certificate" : "Open credential"}
              className="w-8 h-8 rounded-lg border border-white/10 flex items-center justify-center text-white/50 hover:text-primary hover:border-primary/40 transition-all cursor-pointer"
            >
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          )}
          {onEdit && (
            <button
              onClick={() => onEdit(id, kind)}
              title={`Edit ${title}`}
              className="w-8 h-8 rounded-lg border border-white/10 flex items-center justify-center text-white/40 hover:text-white hover:border-white/30 transition-all cursor-pointer"
            >
              <Pencil className="w-3.5 h-3.5" />
            </button>
          )}
          {hasSkillsOrExtras && (
            <button
              onClick={() => setOpen((v) => !v)}
              title={kind === "course" ? "Learned skills" : "Details"}
              className="w-8 h-8 rounded-lg border border-white/10 flex items-center justify-center text-white/40 hover:text-white transition-all cursor-pointer"
            >
              <ChevronDown className={`w-3.5 h-3.5 transition-transform ${open ? "rotate-180" : ""}`} />
            </button>
          )}
          {onRemove && (
            <button
              onClick={() => onRemove(id)}
              title={`Remove ${title}`}
              className="w-8 h-8 rounded-lg border border-white/10 flex items-center justify-center text-white/40 hover:text-red-400 hover:border-red-400/30 transition-all cursor-pointer"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {open && (
        <div className="px-5 pb-5 pl-[72px]">
          {kind === "course" && learnedSkills && learnedSkills.length > 0 && (
            <>
              <LAStatLabel>Skills this course taught</LAStatLabel>
              <div className="flex flex-wrap gap-2 mt-2">
                {learnedSkills.map((s) => (
                  <span key={s} className="text-[11px] px-2.5 py-1 rounded-full border border-white/[0.08] bg-white/[0.03] text-white/60">
                    {s}
                  </span>
                ))}
              </div>
            </>
          )}
          {kind === "certification" && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="rounded-xl border border-white/[0.07] bg-white/[0.02] px-4 py-3">
                <LAStatLabel>Credential ID</LAStatLabel>
                <p className="text-[12px] font-medium text-white/70 mt-1 flex items-center gap-1.5 truncate">
                  <Fingerprint className="w-3 h-3 text-white/25 shrink-0" />
                  {credentialId ?? "Not provided"}
                </p>
              </div>
              <div className="rounded-xl border border-white/[0.07] bg-white/[0.02] px-4 py-3">
                <LAStatLabel>Credential Link</LAStatLabel>
                {certificateUrl ? (
                  <a
                    href={certificateUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="text-[12px] font-medium text-primary hover:underline mt-1 block truncate"
                  >
                    {certificateUrl}
                  </a>
                ) : (
                  <p className="text-[12px] text-white/35 mt-1">Not provided</p>
                )}
              </div>
            </div>
          )}
        </div>
      )}
    </motion.div>
  );
}
