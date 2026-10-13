import { Lightbulb, ArrowRight, User, MapPin } from "lucide-react";
import PageContainer from "../../components/PageContainer";
import GlassCard from "../../components/GlassCard";
import { PPReveal, PPLabel, PPStatLabel } from "./PP/shared";
import SourceCard from "./PP/SourceCard";
import CompletenessRing, { CompletenessBreakdown } from "./PP/CompletenessRing";
import EvidenceCoverage from "./PP/EvidenceCoverage";
import { useAuth } from "../../hooks/useAuth";
import { useRef, useState } from "react";
import { useResource } from "../../lib/useResource";
import { ApiError } from "../../lib/api";
import { resumeService } from "../../services/resume";
import { certificationsService } from "../../services/certifications";
import type { ResumeResponse, ResumeSummary } from "../../lib/types";

/* ── completeness wiring ──────────────────────────────────────
   Completeness is a coverage count, never a weighted score: each row
   that has a source contributes equally, and a row without one reads
   "Not available" rather than as a zero.

   The sources are the identity fields on the account, the linked
   GitHub account, the sections read from an uploaded resume, and the
   certifications the user has recorded. LinkedIn is not among them and
   is not pending: its self-serve API returns name, picture and email
   only — no experience, education, skills or certifications at any
   tier — so there is nothing it could contribute.
   ───────────────────────────────────────────────────────────── */

export default function ProfessionalProfile() {
  const { user } = useAuth();

  const { data: resumeData, reload: reloadResume } = useResource<ResumeResponse>(
    () => resumeService.get(),
    []
  );
  const resume = resumeData?.resume ?? null;

  // Certifications are recorded on the Learning & Achievements page; this page
  // only reports whether any exist. A failure here leaves the row unavailable,
  // which is what it said before any of this loaded.
  const { data: certData } = useResource(() => certificationsService.list(), []);
  const certifications = certData?.certifications ?? null;

  const fileInput = useRef<HTMLInputElement | null>(null);
  const [uploading, setUploading] = useState(false);
  const [resumeError, setResumeError] = useState<string | null>(null);

  async function handleResumeFile(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    // Clear immediately so re-picking the same file still fires a change event.
    event.target.value = "";
    if (!file) return;

    setUploading(true);
    setResumeError(null);
    try {
      await resumeService.upload(file);
      reloadResume();
    } catch (err) {
      setResumeError(err instanceof ApiError ? err.message : "Could not upload that resume.");
    } finally {
      setUploading(false);
    }
  }

  async function removeResume() {
    setResumeError(null);
    try {
      await resumeService.remove();
      reloadResume();
    } catch (err) {
      setResumeError(err instanceof ApiError ? err.message : "Could not remove the resume.");
    }
  }

  // Real profile fields from auth state; never invented.
  const name = user?.name?.trim() || null;
  const email = user?.email ?? "";
  // GitHub avatar is the only avatar source in the current backend.
  const avatarUrl = user?.avatarUrl ?? user?.githubAccount?.avatarUrl ?? null;
  const githubUsername = user?.githubAccount?.username ?? null;

  // Coverage of the three recorded identity signals, not a weighted score:
  // every available component contributes equally and nothing is estimated.
  const identityScore = name && email ? 100 : 0;
  const professionalScore = githubUsername ? 100 : 0;
  // A parsed section is evidence the user has recorded that part of their
  // history — not a judgement of how good it is. Null stays null when the
  // resume has no such section, or when there is no resume at all.
  const sections = resume?.parsed?.sections ?? {};
  const fromResume = (key: string) => (resume ? (sections[key] ? 100 : 0) : null);
  // Null only while the request is in flight or after it failed: an account
  // with no certifications has recorded that fact, which is a measured zero.
  const certificationScore = certifications === null ? null : certifications.length > 0 ? 100 : 0;

  // Averaged over the rows that have a value: a row reading "not available"
  // must not be counted as a zero, which would understate completeness.
  const measured = [
    identityScore,
    professionalScore,
    fromResume("experience"),
    fromResume("skills"),
    fromResume("education"),
    certificationScore,
  ].filter((p): p is number => p !== null);
  const overall = measured.length > 0
    ? Math.round(measured.reduce((a, b) => a + b, 0) / measured.length)
    : 0;

  const breakdown = [
    { label: "Identity", percent: identityScore },
    { label: "Professional Profile", percent: professionalScore },
    { label: "Experience", percent: fromResume("experience") },
    { label: "Skills", percent: fromResume("skills") },
    { label: "Education", percent: fromResume("education") },
    { label: "Certifications", percent: certificationScore },
  ];

  // ── What the uploaded resume actually yielded ──
  const resumeSections = Object.keys(resume?.parsed?.sections ?? {});
  const detectedSkills = resume?.parsed?.detectedSkills ?? [];
  const resumeMetrics = [
    { label: "Sections read", value: String(resumeSections.length) },
    { label: "Technologies named", value: String(detectedSkills.length) },
    { label: "Words", value: (resume?.parsed?.wordCount ?? 0).toLocaleString() },
    { label: "Pages", value: resume?.pageCount !== null && resume?.pageCount !== undefined ? String(resume.pageCount) : "—" },
  ];

  /**
   * What is actually missing, most consequential first.
   *
   * Every entry is something the user can do and DevProof can then measure.
   * LinkedIn is absent by design: suggesting it would be advice that cannot be
   * followed. An empty list means everything measurable is already recorded.
   */
  const nextSteps: { title: string; detail: string }[] = [];
  if (!githubUsername) {
    nextSteps.push({
      title: "Link your GitHub account",
      detail: "Repositories, languages and analysis evidence all follow from it.",
    });
  }
  if (!resume) {
    nextSteps.push({
      title: "Upload your resume",
      detail: "DevProof reads its sections and reports the technologies it names. PDF, up to 5MB.",
    });
  } else if (resume.parseError) {
    nextSteps.push({
      title: "Upload a text-layer resume",
      detail: "The stored file is a scan, so there is no text to read. Export the PDF from your editor.",
    });
  } else {
    const absent = ["experience", "education", "skills"].filter((key) => !sections[key]);
    if (absent.length > 0) {
      nextSteps.push({
        title: `Add ${absent.join(", ")} to your resume`,
        detail: "DevProof found no heading it recognised for these, so nothing was read from them.",
      });
    }
  }
  if (certifications !== null && certifications.length === 0) {
    nextSteps.push({
      title: "Record a certification",
      detail: "Add it under Learning & Achievements; a credential lifts the skills it names.",
    });
  }

  /** One resume-derived coverage row: read from the resume, or not yet there. */
  const fromSection = (key: string, name: string, icon: "experience" | "education" | "skills") =>
    resume?.parsed?.sections?.[key]
      ? { icon, name, state: "available" as const, note: `Read from ${resume.fileName}.` }
      : {
          icon,
          name,
          state: "awaiting" as const,
          note: resume
            ? "Your resume has no section DevProof recognised under this heading."
            : "Upload a resume and this section is read from it.",
        };

  const coverage = [
    {
      icon: "linkedin" as const,
      name: "LinkedIn",
      state: "missing" as const,
      note: "LinkedIn exposes no experience, education or skills to self-serve applications, so this cannot be built.",
    },
    resume
      ? {
          icon: "resume" as const,
          name: "Resume",
          state: "available" as const,
          note: resume.parseError
            ? `${resume.fileName} is stored, but its text could not be read.`
            : `${resume.fileName} — ${resumeSections.length} section${resumeSections.length === 1 ? "" : "s"} read.`,
        }
      : {
          icon: "resume" as const,
          name: "Resume",
          state: "awaiting" as const,
          note: "No resume uploaded yet. PDF only, up to 5MB.",
        },
    fromSection("experience", "Experience", "experience"),
    fromSection("education", "Education", "education"),
    fromSection("skills", "Professional Skills", "skills"),
  ];

  return (
    <PageContainer
      title="Professional Profile"
      description="Build a complete professional identity from your resume, credentials and connected accounts."
    >
      {/* Hidden picker driven by the resume card's CTA. */}
      <input
        ref={fileInput}
        type="file"
        accept="application/pdf,.pdf"
        onChange={handleResumeFile}
        className="hidden"
      />

      {/* ── 1. Profile overview ── */}
      <PPReveal>
        <GlassCard hover={false} className="p-6 md:p-8 relative overflow-hidden mb-8">
          <div
            className="absolute inset-0 pointer-events-none"
            style={{ background: "radial-gradient(ellipse at 85% 30%, rgba(119,252,117,0.06) 0%, transparent 55%)" }}
          />

          <div className="relative flex flex-col md:flex-row items-center md:items-start gap-8">
            {/* Identity block */}
            <div className="flex-1 min-w-0 flex flex-col sm:flex-row items-center sm:items-start gap-6">
              <div className="w-20 h-20 rounded-full border border-white/10 bg-white/[0.04] overflow-hidden flex items-center justify-center shrink-0">
                {avatarUrl ? (
                  <img src={avatarUrl} alt={name ?? "Profile"} className="w-full h-full object-cover" />
                ) : (
                  <User className="w-8 h-8 text-white/30" />
                )}
              </div>

              <div className="min-w-0 text-center sm:text-left">
                <h2 className="text-xl font-bold text-white tracking-tight">
                  {name ?? "Name not set"}
                </h2>
                <p className="text-[13px] text-white/45 mt-0.5 truncate">{email}</p>
                {githubUsername && (
                  <p className="flex items-center justify-center sm:justify-start gap-1.5 text-[12px] text-white/40 mt-2">
                    <MapPin className="w-3.5 h-3.5 text-white/25" />
                    GitHub linked as <span className="text-white/70 font-medium">@{githubUsername}</span>
                  </p>
                )}
                <p className="text-[12px] leading-relaxed text-white/35 mt-3 max-w-md">
                  DevProof assembles your professional identity from your account, your linked GitHub,
                  an uploaded resume and the credentials you record. Each one it has is counted below;
                  each one it does not have says so.
                </p>
              </div>
            </div>

            {/* Completeness summary */}
            <div className="flex flex-col items-center gap-2 shrink-0">
              <PPStatLabel>Profile Completeness</PPStatLabel>
              <CompletenessRing percent={overall} />
              <p className="text-[10px] font-bold uppercase tracking-widest text-white/30 text-center">
                Share of available evidence recorded
              </p>
            </div>
          </div>
        </GlassCard>
      </PPReveal>

      {/* ── 2. LinkedIn + Resume ── */}
      <PPReveal delay={0.1}>
        <PPLabel>Evidence Sources</PPLabel>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-8">
          <SourceCard
            kind="linkedin"
            title="LinkedIn"
            purpose="LinkedIn cannot supply professional evidence to DevProof, so nothing is connected here."
            state="unavailable"
            stateLabel="Not available"
            bullets={[
              "Its self-serve sign-in returns name, picture, locale and email — nothing more",
              "Experience, education, skills and certifications are not exposed at any self-serve tier",
              "Record credentials under Learning & Achievements instead, where they are verifiable",
            ]}
            cta="No LinkedIn integration"
            disabledNote="LinkedIn exposes no professional data to self-serve applications"
          />

          <SourceCard
            kind="resume"
            title="Resume / CV"
            purpose="Upload your latest resume so DevProof can extract professional evidence from it."
            state={resume ? "connected" : "empty"}
            stateLabel={
              uploading ? "Uploading…" : resume ? "Uploaded" : "Not uploaded"
            }
            bullets={[
              "Detect experience, education, and project history",
              "Read the technologies named in your resume",
              "PDF only, up to 5MB — processed on this server, never sent elsewhere",
            ]}
            cta={uploading ? "Uploading…" : resume ? "Replace Resume" : "Upload Resume"}
            onCta={() => fileInput.current?.click()}
            footer={<ResumeFooter resume={resume} error={resumeError} onRemove={removeResume} />}
          />
        </div>
      </PPReveal>

      {/* ── 3. Resume intelligence ── */}
      <PPReveal delay={0.15}>
        <PPLabel>Resume Intelligence</PPLabel>
        <GlassCard hover={false} className="p-6 md:p-8 mb-8">
          {resume && !resume.parseError ? (
            <div className="flex flex-col gap-6">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {resumeMetrics.map((metric) => (
                  <div key={metric.label} className="rounded-xl border border-white/[0.07] bg-white/[0.02] px-3 py-3.5">
                    <PPStatLabel>{metric.label}</PPStatLabel>
                    <p className="text-xl font-bold text-white tabular-nums mt-1.5">{metric.value}</p>
                  </div>
                ))}
              </div>

              {resumeSections.length > 0 && (
                <div>
                  <PPStatLabel>Sections read</PPStatLabel>
                  <div className="flex flex-wrap gap-2 mt-2.5">
                    {resumeSections.map((section) => (
                      <span
                        key={section}
                        className="text-[11px] px-2.5 py-1 rounded-full border border-white/[0.08] bg-white/[0.03] text-white/60 capitalize"
                      >
                        {section}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {detectedSkills.length > 0 && (
                <div>
                  <PPStatLabel>Technologies mentioned</PPStatLabel>
                  <div className="flex flex-wrap gap-2 mt-2.5">
                    {detectedSkills.map((skill) => (
                      <span
                        key={skill}
                        className="text-[11px] px-2.5 py-1 rounded-full border border-white/[0.08] bg-white/[0.03] text-white/60"
                      >
                        {skill}
                      </span>
                    ))}
                  </div>
                  <p className="text-[11px] text-white/30 mt-3 leading-relaxed">
                    These are names found in your resume text, not skills DevProof has recorded. A
                    resume often names a team's stack in passing, so nothing here is counted as
                    evidence until you add it on the Skills page.
                  </p>
                </div>
              )}
            </div>
          ) : (
            <div className="flex flex-col items-center text-center gap-3 py-6">
              <div className="w-11 h-11 rounded-2xl border border-white/10 bg-white/[0.03] flex items-center justify-center text-white/35">
                <Lightbulb className="w-5 h-5" />
              </div>
              <h3 className="text-sm font-bold text-white uppercase tracking-wider">
                {resume?.parseError ? "This resume could not be read" : "Upload a resume to read it"}
              </h3>
              <p className="text-[12px] max-w-md leading-relaxed" style={{ color: "var(--text-secondary)" }}>
                {resume?.parseError
                  ? `${resume.parseError} The file is kept and can be downloaded, but nothing was extracted from it — scanned resumes have no text layer to read.`
                  : "DevProof reads the sections your resume contains and the technologies it names. It reports them for you to confirm; it never records them as skills on its own."}
              </p>
            </div>
          )}
        </GlassCard>
      </PPReveal>

      {/* ── 4. Evidence coverage ── */}
      <PPReveal delay={0.2}>
        <PPLabel>Professional Evidence</PPLabel>
        <div className="mb-8">
          <EvidenceCoverage
            items={coverage}
          />
        </div>
      </PPReveal>

      {/* ── 5. Completeness breakdown ── */}
      <PPReveal delay={0.25}>
        <PPLabel>Profile Completeness</PPLabel>
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-4 mb-8">
          <GlassCard hover={false} className="p-6 lg:col-span-2 flex items-center justify-center">
            <CompletenessRing percent={overall} />
          </GlassCard>
          <GlassCard hover={false} className="p-6 lg:col-span-3">
            <CompletenessBreakdown items={breakdown} />
            <p className="text-[11px] text-white/30 mt-5 leading-relaxed">
              Percentages are a coverage count, not a weighted score: your name and email, a linked
              GitHub account, each section read from your resume, and whether any certification is
              recorded. A row with no source reads "Not available" rather than zero, and no
              percentage is estimated.
            </p>
          </GlassCard>
        </div>
      </PPReveal>

      {/* ── 6. DevProof insight ── */}
      <PPReveal delay={0.3}>
        <GlassCard hover={false} className="p-6 md:p-7 border-l-2 border-l-primary relative overflow-hidden">
          <div
            className="absolute inset-0 pointer-events-none"
            style={{ background: "radial-gradient(ellipse at 0% 50%, rgba(22,255,0,0.05) 0%, transparent 60%)" }}
          />
          <div className="relative">
            <div className="flex items-center gap-2.5 mb-4">
              <Lightbulb className="w-4 h-4 text-primary" />
              <h3 className="text-sm font-bold text-white uppercase tracking-wider">DevProof Insight</h3>
            </div>

            <p className="text-[14px] leading-relaxed text-white/75 max-w-3xl">
              {nextSteps.length > 0
                ? `Your profile records ${overall}% of the evidence DevProof can measure. What is missing is listed below — each item is something it can then count.`
                : `Your profile records every kind of evidence DevProof can measure. Anything further comes from the work itself: more analyzed repositories, more credentials recorded.`}
            </p>

            {nextSteps.length > 0 && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-5">
                {nextSteps.slice(0, 2).map((step, i) => (
                  <div key={step.title} className="rounded-xl border border-white/[0.08] bg-white/[0.03] p-4">
                    <PPStatLabel>{i === 0 ? "Next step" : "Next"}</PPStatLabel>
                    <p className="text-sm font-bold text-white mt-1 flex items-center gap-1.5">
                      {step.title} <ArrowRight className="w-3.5 h-3.5 text-primary" />
                    </p>
                    <p className="text-[11px] text-white/40 mt-1 leading-relaxed">{step.detail}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </GlassCard>
      </PPReveal>
    </PageContainer>
  );
}

/**
 * What the uploaded resume actually yielded.
 *
 * Detected technologies are labelled as "mentioned in your resume" rather than
 * presented as skills: the backend reports them, it does not record them, and
 * the wording has to make that difference visible.
 */
function ResumeFooter({
  resume,
  error,
  onRemove,
}: {
  resume: ResumeSummary | null;
  error: string | null;
  onRemove: () => void;
}) {
  if (error) {
    return <p className="text-[12px] text-red-300">{error}</p>;
  }

  if (!resume) {
    return (
      <p className="text-[11px]" style={{ color: "var(--text-tertiary)" }}>
        PDF only, up to 5MB. Scanned resumes have no text layer and cannot be read.
      </p>
    );
  }

  const sections = Object.keys(resume.parsed?.sections ?? {});
  const detected = resume.parsed?.detectedSkills ?? [];

  return (
    <div className="flex flex-col gap-2">
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px]" style={{ color: "var(--text-tertiary)" }}>
        <span className="text-white/70 font-medium truncate max-w-[200px]">{resume.fileName}</span>
        {resume.pageCount !== null && <span>{resume.pageCount} page{resume.pageCount === 1 ? "" : "s"}</span>}
        <span>{Math.max(1, Math.round(resume.fileSize / 1024))} KB</span>
        <a
          href={resumeService.downloadUrl()}
          className="text-white/50 hover:text-primary transition-colors underline underline-offset-2"
        >
          Download
        </a>
        <button
          onClick={onRemove}
          className="text-white/40 hover:text-red-400 transition-colors cursor-pointer underline underline-offset-2"
        >
          Remove
        </button>
      </div>

      {resume.parseError ? (
        <p className="text-[11px] text-amber-200/80">{resume.parseError}</p>
      ) : (
        <>
          {sections.length > 0 && (
            <p className="text-[11px]" style={{ color: "var(--text-tertiary)" }}>
              Sections read: {sections.join(", ")}
            </p>
          )}
          {detected.length > 0 && (
            <p className="text-[11px]" style={{ color: "var(--text-tertiary)" }}>
              Mentioned in your resume: <span className="text-white/60">{detected.join(", ")}</span>
              {" — "}add any of these on the Skills page to record them.
            </p>
          )}
        </>
      )}
    </div>
  );
}
