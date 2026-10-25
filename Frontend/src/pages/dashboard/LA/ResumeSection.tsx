import { useRef, useState } from "react";
import { Link } from "react-router-dom";
import { Loader2, ExternalLink, ChevronDown } from "lucide-react";
import { ApiError } from "../../../lib/api.mts";
import { useDemoResource } from "../../../demo/DemoContext";
import { sampleData } from "../../../demo/sampleData.mts";
import { resumeService } from "../../../services/resume";
import { skillsService } from "../../../services/skills";
import GlassCard from "../../../components/GlassCard";
import { LAStatLabel } from "./shared";
import AtsDashboard from "./AtsDashboard";
import JobMatchPanel from "./JobMatchPanel";
import type {
  ResumeAnalysis,
  ResumeSummary,
  SkillWithEvidence,
} from "../../../lib/types";

/** Document glyph for the resume card (drawn inline; lucide version here
 * ships none we can reuse consistently with the old page's treatment). */
export function ResumeGlyph({ className = "w-6 h-6" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden="true">
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
      <polyline points="14 2 14 8 20 8" />
      <line x1="8" y1="13" x2="16" y2="13" />
      <line x1="8" y1="17" x2="13" y2="17" />
      <circle cx="8.5" cy="9" r="1" fill="currentColor" stroke="none" />
    </svg>
  );
}

/** Section micro-heading inside the resume card. */
function SectionHeading({ children }: { children: React.ReactNode }) {
  return (
    <h3 className="text-[12px] font-bold uppercase tracking-[0.18em] text-white/35 mb-3">
      {children}
    </h3>
  );
}

/** "2 mos" / "1 yr 3 mos" — deterministic formatting of the backend's month
 * span. Returns null for null input; never invents a duration. */
function formatDuration(months: number | null): string | null {
  if (months == null) return null;
  if (months < 1) return "under a month";
  const years = Math.floor(months / 12);
  const rest = months % 12;
  const parts: string[] = [];
  if (years > 0) parts.push(`${years} yr${years === 1 ? "" : "s"}`);
  if (rest > 0) parts.push(`${rest} mo${rest === 1 ? "" : "s"}`);
  return parts.join(" ");
}

/**
 * Resume management, relocated from the Professional Profile page.
 *
 * Reuses the existing /resume backend (GET/POST/DELETE/analyse + download)
 * through resumeService — no second implementation. The structured analysis
 * shown here is what the parser actually extracted; extracted technologies
 * are never written as skills.
 */
export default function ResumeSection({
  readOnly = false,
}: {
  /**
   * Demo mode: show the sample resume, with every upload/manage control off.
   *
   * There is no stored file behind the sample — download, replace, re-analyse
   * and remove would all address a record that does not exist, so the section
   * says that instead of offering them.
   */
  readOnly?: boolean;
}) {
  const { data, loading, reload } = useDemoResource(() => resumeService.get(), sampleData.resume, []);
  const resume = data?.resume ?? null;

  const fileInput = useRef<HTMLInputElement | null>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleFile(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    // Clear immediately so re-picking the same file still fires a change event.
    event.target.value = "";
    if (!file) return;

    setUploading(true);
    setError(null);
    try {
      await resumeService.upload(file);
      reload();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Could not upload that resume.");
    } finally {
      setUploading(false);
    }
  }

  async function remove() {
    setError(null);
    try {
      await resumeService.remove();
      reload();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Could not remove the resume.");
    }
  }

  return (
    <div>
      {/* Hidden picker driven by the card's CTA. */}
      <input
        ref={fileInput}
        type="file"
        accept="application/pdf,.pdf"
        onChange={handleFile}
        className="hidden"
      />

      {error && (
        <p className="text-[12px] text-red-300 mb-3">{error}</p>
      )}

      {loading ? (
        <div className="glass-panel p-6 animate-pulse" aria-hidden="true">
          <div className="flex items-center gap-4">
            <div className="w-11 h-11 rounded-xl bg-white/[0.05] shrink-0" />
            <div className="flex-1 space-y-2.5">
              <div className="h-4 w-1/4 rounded bg-white/[0.05]" />
              <div className="h-3 w-1/3 rounded bg-white/[0.05]" />
            </div>
          </div>
        </div>
      ) : resume ? (
        <ResumeCard
          resume={resume}
          uploading={uploading}
          onReplace={() => fileInput.current?.click()}
          onRemove={remove}
          onReanalyse={reload}
          readOnly={readOnly}
        />
      ) : (
        <ResumeEmpty uploading={uploading} onUpload={() => fileInput.current?.click()} />
      )}
    </div>
  );
}

/** Empty state: what a resume will contribute, stated without faking data. */
function ResumeEmpty({ uploading, onUpload }: { uploading: boolean; onUpload: () => void }) {
  return (
    <GlassCard hover={false} className="p-6 md:p-7 relative overflow-hidden">
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/[0.10] to-transparent pointer-events-none" />
      <div className="flex flex-col md:flex-row md:items-center gap-6">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-3.5 mb-3">
            <div className="w-11 h-11 rounded-xl border border-white/10 bg-white/[0.03] flex items-center justify-center text-white/35 shrink-0">
              <ResumeGlyph className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <h2 className="text-base font-bold text-white tracking-tight">Resume</h2>
              <p className="text-[12px] text-white/40 leading-snug">
                Upload your latest resume so DevProof can read what it contains.
              </p>
            </div>
          </div>
          <ul className="space-y-1.5 max-w-xl">
            {[
              "DevProof reads the sections your resume contains — experience, education, skills",
              "Technologies it names are reported for you to confirm on the Skills page, never recorded as skills",
              "PDF only, up to 5MB — processed on this server, never sent elsewhere",
            ].map((b) => (
              <li key={b} className="flex items-start gap-2.5 text-[12px] text-white/45 leading-relaxed">
                <span className="mt-[6px] w-1.5 h-1.5 rounded-full shrink-0 bg-violet-400/40" />
                {b}
              </li>
            ))}
          </ul>
        </div>

        <button
          onClick={onUpload}
          disabled={uploading}
          className="shrink-0 text-xs font-bold uppercase tracking-widest px-5 py-3 rounded-full border border-violet-400/30 bg-violet-400/10 text-violet-300 hover:bg-violet-400/20 hover:border-violet-400/50 transition-all cursor-pointer hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-wait"
        >
          {uploading ? "Uploading…" : "Upload resume"}
        </button>
      </div>
    </GlassCard>
  );
}

/** Uploaded state: overview, then every category the analysis actually has. */
function ResumeCard({
  resume,
  uploading,
  onReplace,
  onRemove,
  onReanalyse,
  readOnly = false,
}: {
  resume: ResumeSummary;
  uploading: boolean;
  onReplace: () => void;
  onRemove: () => void;
  /** Parent-owned refetch after a successful re-analysis. */
  onReanalyse: () => void;
  readOnly?: boolean;
}) {
  const [reanalysing, setReanalysing] = useState(false);
  const [reanalyseNote, setReanalyseNote] = useState<string | null>(null);

  const parsed = resume.parsed;
  const analysis = parsed?.analysis ?? null;
  const sectionText = parsed?.sections ?? {};
  const sections = Object.keys(sectionText);
  const detected = parsed?.detectedSkills ?? [];

  async function reanalyse() {
    setReanalysing(true);
    setReanalyseNote(null);
    try {
      await resumeService.analyse();
      onReanalyse();
      setReanalyseNote("Re-analysed from the stored file.");
    } catch (err) {
      setReanalyseNote(
        err instanceof ApiError ? err.message : "Could not re-analyse the resume."
      );
    } finally {
      setReanalysing(false);
    }
  }

  return (
    <GlassCard hover={false} className="p-6 md:p-7 relative overflow-hidden">
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/[0.10] to-transparent pointer-events-none" />
      <div
        className="absolute inset-0 pointer-events-none"
        style={{ background: "radial-gradient(ellipse at 85% -10%, rgba(119,252,117,0.06) 0%, transparent 55%)" }}
      />

      <div className="relative flex flex-col sm:flex-row sm:items-start gap-5">
        <div className="w-11 h-11 rounded-xl border border-primary/25 bg-primary/10 flex items-center justify-center text-primary shrink-0">
          <ResumeGlyph className="w-5 h-5" />
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
            <h2 className="text-base font-bold text-white tracking-tight">{resume.fileName}</h2>
            <span className="inline-flex items-center gap-1.5 text-[9px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-full border border-primary/25 bg-primary/10 text-primary">
              <span className="w-1.5 h-1.5 rounded-full bg-primary" />
              Uploaded
            </span>
          </div>
          <p className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[12px] mt-1" style={{ color: "var(--text-tertiary)" }}>
            {resume.pageCount !== null && <span>{resume.pageCount} page{resume.pageCount === 1 ? "" : "s"}</span>}
            <span>{Math.max(1, Math.round(resume.fileSize / 1024))} KB</span>
            <span>Uploaded {new Date(resume.uploadedAt).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" })}</span>
            {analysis && (
              <span>Analysed {new Date(analysis.analysedAt).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" })}</span>
            )}
            {/* No stored file exists behind the sample resume, so download and
                removal are absent rather than pointing at nothing. */}
            {readOnly ? (
              <span className="text-[12px] text-white/30">Sample resume — no stored file</span>
            ) : (
              <>
                <a
                  href={resumeService.downloadUrl()}
                  className="text-white/50 hover:text-primary transition-colors underline underline-offset-2 cursor-pointer"
                >
                  Download
                </a>
                <button
                  onClick={onRemove}
                  className="text-white/40 hover:text-red-400 transition-colors underline underline-offset-2 cursor-pointer"
                >
                  Remove
                </button>
              </>
            )}
          </p>

          {resume.parseError ? (
            <p className="text-[11px] text-amber-200/80 mt-4 leading-relaxed">
              {resume.parseError} The file is kept and can be downloaded, but nothing was extracted
              from it — scanned resumes have no text layer to read.
            </p>
          ) : readOnly ? (
            <p className="mt-4 text-[11px] leading-relaxed" style={{ color: "var(--text-tertiary)" }}>
              Uploading, re-analysing and removing a resume are disabled in the demo — these sections are
              read from the sample profile's document.
            </p>
          ) : (
            <div className="mt-4 flex flex-wrap items-center gap-3">
              <button
                onClick={onReplace}
                disabled={uploading || reanalysing}
                className="text-xs font-bold uppercase tracking-widest px-5 py-2.5 rounded-full border border-violet-400/30 bg-violet-400/10 text-violet-300 hover:bg-violet-400/20 hover:border-violet-400/50 transition-all cursor-pointer hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-wait"
              >
                {uploading ? "Uploading…" : "Replace resume"}
              </button>
              {parsed && (
                <button
                  onClick={reanalyse}
                  disabled={uploading || reanalysing}
                  className="text-xs font-bold uppercase tracking-widest px-5 py-2.5 rounded-full border border-white/10 bg-white/[0.04] text-white/60 hover:bg-white/[0.08] hover:text-white transition-all cursor-pointer disabled:opacity-50 disabled:cursor-wait inline-flex items-center gap-2"
                >
                  {reanalysing && <Loader2 className="w-3 h-3 animate-spin" />}
                  {reanalysing ? "Analysing…" : "Re-analyse"}
                </button>
              )}
              {reanalyseNote && (
                <p className="text-[11px] text-white/40">{reanalyseNote}</p>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Parse status and results — only what the backend actually returned. */}
      {!resume.parseError && sections.length === 0 && (
        <p className="text-[11px] mt-4 relative" style={{ color: "var(--text-tertiary)" }}>
          No recognised heading was found in this file, so nothing was read from it yet.
        </p>
      )}

      {!resume.parseError && analysis && (
        <div key={analysis.analysedAt}>
          {/* Actionable first: the deterministic ATS analysis, then the
              transient job comparison, then — collapsed — the extracted
              content the analysis is grounded in. */}
          <AtsDashboard ats={parsed?.ats ?? null} readOnly={readOnly} />
          {!readOnly && <JobMatchPanel />}
          <ResumeAnalysisView
            analysis={analysis}
            sectionText={sectionText}
            detectedSkills={detected}
          />
        </div>
      )}

      {/* Legacy records: sections without a structured analysis. The same
          stored file gains one through Re-analyse above. */}
      {!resume.parseError && !analysis && sections.length > 0 && (
        <div className="mt-5 relative space-y-4">
          <p className="text-[11px] text-white/35 leading-relaxed">
            This resume was uploaded before structured analysis existed. Use{" "}
            <span className="text-white/55">Re-analyse</span> to structure it from the stored file —
            no re-upload needed, and nothing is written to your skills or certifications.
          </p>
          <div>
            <LAStatLabel>Sections read</LAStatLabel>
            <div className="flex flex-wrap gap-2 mt-2">
              {sections.map((s) => (
                <span key={s} className="text-[11px] px-2.5 py-1 rounded-full border border-white/[0.08] bg-white/[0.03] text-white/60 capitalize">
                  {s}
                </span>
              ))}
            </div>
          </div>
          <SkillsChips detectedSkills={detected} />
        </div>
      )}
    </GlassCard>
  );
}

/** Skills chips with the claims-vs-inventory distinction. Loads the user's
 * own skill list lazily, only when there is something to compare. */
function SkillsChips({ detectedSkills }: { detectedSkills: string[] }) {
  // Same comparison in both modes — the inventory it checks against is the
  // sample profile's skills in the demo, so the resume and the Skills page
  // still agree instead of the chips going grey because there is no session.
  const { data, loading } = useDemoResource(
    () => (detectedSkills.length > 0 ? skillsService.getSkills() : Promise.resolve({ skills: [] })),
    sampleData.skillsResponse,
    [detectedSkills.length > 0]
  );

  if (detectedSkills.length === 0) return null;

  const inventory: SkillWithEvidence[] = data?.skills ?? [];
  const byName = new Map(inventory.map((s) => [s.name.toLowerCase(), s]));

  return (
    <div>
      <LAStatLabel>Technologies mentioned</LAStatLabel>
      <div className="flex flex-wrap gap-2 mt-2">
        {detectedSkills.map((s) => {
          const recorded = byName.get(s.toLowerCase());
          return (
            <span
              key={s}
              title={
                recorded
                  ? `In your skills inventory at ${recorded.currentLevel.replace("_", " ").toLowerCase()}`
                  : "Mentioned in your resume only — not a recorded skill"
              }
              className={`text-[12px] px-2.5 py-1 rounded-full border ${
                recorded
                  ? "border-primary/25 bg-primary/[0.06] text-primary/90"
                  : "border-white/[0.08] bg-white/[0.03] text-white/55"
              }`}
            >
              {s}
              {!loading && (
                <span className="text-[12px] uppercase tracking-wider ml-1.5 opacity-70">
                  {recorded ? recorded.currentLevel.replace("_", " ").toLowerCase() : "mentioned"}
                </span>
              )}
            </span>
          );
        })}
      </div>
      <p className="text-[12px] text-white/30 mt-2.5 leading-relaxed max-w-2xl">
        Names found in your resume text — claims from the document, not evidence. They never change
        your verified skills; green chips are names already in your inventory. To record one
        deliberately,{" "}
        <Link to="/dashboard/skills" className="text-white/50 hover:text-primary underline underline-offset-2">
          add it on the Skills page
        </Link>
        .
      </p>
    </div>
  );
}

/** One category of the structured analysis: rendered only when the parser
 * produced entries. Falls back to the raw extracted text when the section
 * exists but no entry could be structured — unavailable and empty are never
 * shown as the same thing. */
function AnalysisCategory({
  title,
  count,
  rawSection,
  children,
}: {
  title: string;
  count: number;
  /** Raw section text from the parser, used only as an honest fallback. */
  rawSection?: string;
  children: React.ReactNode;
}) {
  if (count === 0 && !rawSection) return null;
  return (
    <div className="mt-6">
      <SectionHeading>{title}</SectionHeading>
      {count > 0 ? (
        children
      ) : (
        <p className="text-[12px] text-white/35 leading-relaxed whitespace-pre-line max-w-3xl">
          No structured entry could be read from this section. The text your resume actually
          contains:
          {" "}
          <span className="text-white/50">{rawSection}</span>
        </p>
      )}
    </div>
  );
}

function ResumeAnalysisView({
  analysis,
  sectionText,
  detectedSkills,
}: {
  analysis: ResumeAnalysis;
  /** Raw section text — used only as a labelled fallback when a category
   * exists on the page but no entry could be structured from it. */
  sectionText: Record<string, string>;
  detectedSkills: string[];
}) {
  const contact = analysis.contact;

  return (
    <div className="relative mt-5 border-t border-white/[0.07] pt-5">
      <details className="group mt-6 rounded-xl border border-white/[0.07] bg-white/[0.02]">
        <summary className="flex cursor-pointer list-none [&::-webkit-details-marker]:hidden items-center justify-between gap-3 px-4 py-3 text-[12px] font-bold uppercase tracking-[0.18em] text-white/45 hover:text-white/70 transition-colors">
          What the parser read from this document
          <ChevronDown
            className="w-3.5 h-3.5 shrink-0 transition-transform group-open:rotate-180"
            aria-hidden="true"
          />
        </summary>
        <div className="px-4 pb-4 pt-1 space-y-6">
      {/* Contact — owner-only by construction: this whole page sits behind
          the authenticated, per-user /resume route. Never logged, never sent
          anywhere else. */}
      {(contact.email || contact.phone || contact.links.length > 0) && (
        <div>
          <SectionHeading>Contact details</SectionHeading>
          <p className="flex flex-wrap items-center gap-x-4 gap-y-1 text-[12px] text-white/60">
            {contact.email && <span>{contact.email}</span>}
            {contact.phone && <span>{contact.phone}</span>}
            {contact.links.map((link) => (
              <a
                key={link.url}
                href={link.url}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1 text-primary hover:underline"
              >
                {link.label}
                <ExternalLink className="w-3 h-3" />
              </a>
            ))}
          </p>
          <p className="text-[12px] text-white/25 mt-1.5">
            Read from your resume header. Visible only to you.
          </p>
        </div>
      )}

      <AnalysisCategory title="Professional Summary" count={analysis.summary ? 1 : 0}>
        <p className="text-[13px] leading-relaxed text-white/70 max-w-3xl">{analysis.summary}</p>
      </AnalysisCategory>
      {!analysis.summary && (
        <div className="mt-6">
          <SectionHeading>Professional Summary</SectionHeading>
          <p className="text-[12px] text-white/35">No summary section was detected in this resume.</p>
        </div>
      )}

      <AnalysisCategory
        title="Education"
        count={analysis.education.length}
        rawSection={sectionText.education}
      >
        <div className="space-y-3">
          {analysis.education.map((entry, i) => (
            <div key={`${entry.evidence}-${i}`} className="rounded-xl border border-white/[0.07] bg-white/[0.02] px-4 py-3">
              <p className="text-[13px] font-semibold text-white/85">
                {entry.qualification ?? "Qualification not recognised"}
              </p>
              <p className="text-[12px] text-white/50 mt-0.5 flex flex-wrap gap-x-2">
                {entry.institution && <span>{entry.institution}</span>}
                {entry.period && <span>· {entry.period}</span>}
              </p>
            </div>
          ))}
        </div>
      </AnalysisCategory>

      <AnalysisCategory
        title="Experience"
        count={analysis.experience.length}
        rawSection={sectionText.experience}
      >
        <div className="space-y-3">
          {analysis.experience.map((entry, i) => {
            const duration = formatDuration(entry.durationMonths);
            return (
              <div key={`${entry.evidence}-${i}`} className="rounded-xl border border-white/[0.07] bg-white/[0.02] px-4 py-3">
                <p className="text-[13px] font-semibold text-white/85">
                  {entry.role ?? "Role not recognised"}
                </p>
                <p className="text-[12px] text-white/50 mt-0.5 flex flex-wrap gap-x-2">
                  {entry.organization && <span>{entry.organization}</span>}
                  {entry.period && <span>· {entry.period}</span>}
                  {duration && <span>· {duration}</span>}
                </p>
                {entry.highlights.length > 0 && (
                  <ul className="mt-2 space-y-1">
                    {entry.highlights.map((h, j) => (
                      <li key={j} className="text-[12px] text-white/55 leading-relaxed flex gap-2">
                        <span className="mt-[7px] w-1 h-1 rounded-full shrink-0 bg-white/25" />
                        {h}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            );
          })}
        </div>
      </AnalysisCategory>

      <AnalysisCategory
        title="Projects"
        count={analysis.projects.length}
        rawSection={sectionText.projects}
      >
        <div className="space-y-3">
          {analysis.projects.map((entry, i) => (
            <div key={`${entry.evidence}-${i}`} className="rounded-xl border border-white/[0.07] bg-white/[0.02] px-4 py-3">
              <p className="text-[13px] font-semibold text-white/85">
                {entry.link ? (
                  <a href={entry.link} target="_blank" rel="noreferrer" className="hover:text-primary transition-colors inline-flex items-center gap-1.5">
                    {entry.name ?? "Project"}
                    <ExternalLink className="w-3 h-3" />
                  </a>
                ) : (
                  entry.name ?? "Project"
                )}
              </p>
              {entry.description && (
                <p className="text-[12px] text-white/50 mt-1 leading-relaxed">{entry.description}</p>
              )}
              {entry.technologies.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mt-2">
                  {entry.technologies.map((t) => (
                    <span key={t} className="text-[10px] px-2 py-0.5 rounded-full border border-white/[0.08] bg-white/[0.03] text-white/50">
                      {t}
                    </span>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      </AnalysisCategory>

      <div className="mt-6">
        <SkillsChips detectedSkills={detectedSkills} />
      </div>

      <AnalysisCategory title="Achievements" count={analysis.achievements.length}>
        <ul className="space-y-1.5">
          {analysis.achievements.map((a, i) => (
            <li key={i} className="text-[12px] text-white/60 leading-relaxed flex gap-2">
              <span className="mt-[7px] w-1 h-1 rounded-full shrink-0 bg-violet-400/50" />
              {a}
            </li>
          ))}
        </ul>
      </AnalysisCategory>
        </div>
      </details>
    </div>
  );
}

