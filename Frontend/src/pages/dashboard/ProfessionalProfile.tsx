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
import type { ResumeResponse, ResumeSummary } from "../../lib/types";

/* ── completeness wiring ──────────────────────────────────────
   The only measurable evidence in this build is what the auth user
   actually provides: a name, an email, and a linked GitHub account.
   The overall completeness is the fraction of those three recorded
   signals present (3 → 100%, 2 → 67%…) — a coverage count, stated as
   such. No resume/LinkedIn backend exists, so those components stay
   "Not available" and no other percentage is estimated.
   ───────────────────────────────────────────────────────────── */

export default function ProfessionalProfile() {
  const { user } = useAuth();

  const { data: resumeData, reload: reloadResume } = useResource<ResumeResponse>(
    () => resumeService.get(),
    []
  );
  const resume = resumeData?.resume ?? null;

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

  // Averaged over the rows that have a value: a row reading "not available"
  // must not be counted as a zero, which would understate completeness.
  const measured = [identityScore, professionalScore, fromResume("experience"), fromResume("skills"), fromResume("education")]
    .filter((p): p is number => p !== null);
  const overall = measured.length > 0
    ? Math.round(measured.reduce((a, b) => a + b, 0) / measured.length)
    : 0;

  const breakdown = [
    { label: "Identity", percent: identityScore },
    { label: "Professional Profile", percent: professionalScore },
    { label: "Experience", percent: fromResume("experience") },
    { label: "Skills", percent: fromResume("skills") },
    { label: "Education", percent: fromResume("education") },
    { label: "Certifications", percent: null },
  ];

  return (
    <PageContainer
      title="Professional Profile"
      description="Build a complete professional identity from your resume and LinkedIn profile."
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
                  DevProof assembles your professional identity from resume, LinkedIn, and account evidence.
                  Connect sources below to strengthen each component.
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
            purpose="Connect your LinkedIn profile to strengthen your professional evidence."
            state="pending"
            stateLabel="Coming soon"
            bullets={[
              "Import headline, current role, and work experience",
              "Pull education, certifications, and licensed skills",
              "Feed verified experience into your profile completeness",
            ]}
            cta="Connect LinkedIn"
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
          <div className="flex flex-col items-center text-center gap-3 py-6">
            <div className="w-11 h-11 rounded-2xl border border-white/10 bg-white/[0.03] flex items-center justify-center text-white/35">
              <Lightbulb className="w-5 h-5" />
            </div>
            <h3 className="text-sm font-bold text-white uppercase tracking-wider">
              Upload a resume to unlock professional intelligence
            </h3>
            <p className="text-[12px] max-w-md leading-relaxed" style={{ color: "var(--text-secondary)" }}>
              Once your resume is analyzed, DevProof surfaces skills detected, projects, experience years,
              certifications, and how much of your profile they complete.
            </p>

            {/* Muted metric shapes — the structure is real, the numbers never are */}
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 mt-4 w-full">
              {["Skills Detected", "Projects", "Experience", "Certifications", "Completeness"].map((label) => (
                <div key={label} className="rounded-xl border border-white/[0.07] bg-white/[0.02] px-3 py-3.5">
                  <PPStatLabel>{label}</PPStatLabel>
                  <div className="h-5 w-10 rounded bg-white/[0.05] mt-2" aria-hidden="true" />
                </div>
              ))}
            </div>
          </div>
        </GlassCard>
      </PPReveal>

      {/* ── 4. Evidence coverage ── */}
      <PPReveal delay={0.2}>
        <PPLabel>Professional Evidence</PPLabel>
        <div className="mb-8">
          <EvidenceCoverage
            items={[
              { icon: "linkedin", name: "LinkedIn", state: "missing", note: "Integration not built yet — no connection can be made." },
              { icon: "resume", name: "Resume", state: "missing", note: "No upload pipeline yet — no resume can be stored." },
              { icon: "experience", name: "Experience", state: "awaiting", note: "Awaiting resume or LinkedIn data." },
              { icon: "education", name: "Education", state: "awaiting", note: "Awaiting resume or LinkedIn data." },
              { icon: "skills", name: "Professional Skills", state: "awaiting", note: "Awaiting resume or LinkedIn data." },
            ]}
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
              Percentages are the share of recorded identity evidence — name and email, plus a
              linked GitHub account — not a weighted score. Components without a data source show
              "Not available" rather than a zero; no percentage is estimated.
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
              Your professional profile is incomplete. Connect LinkedIn and upload your latest resume to
              strengthen the evidence behind your experience, skills, and career profile.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-5">
              <div className="rounded-xl border border-white/[0.08] bg-white/[0.03] p-4">
                <PPStatLabel>Next step</PPStatLabel>
                <p className="text-sm font-bold text-white mt-1 flex items-center gap-1.5">
                  Connect LinkedIn <ArrowRight className="w-3.5 h-3.5 text-primary" />
                </p>
                <p className="text-[11px] text-white/40 mt-1 leading-relaxed">
                  Unlocks role, experience, and education evidence automatically.
                </p>
              </div>
              <div className="rounded-xl border border-white/[0.08] bg-white/[0.03] p-4">
                <PPStatLabel>Next</PPStatLabel>
                <p className="text-sm font-bold text-white mt-1 flex items-center gap-1.5">
                  Upload Resume <ArrowRight className="w-3.5 h-3.5 text-primary" />
                </p>
                <p className="text-[11px] text-white/40 mt-1 leading-relaxed">
                  Anchors skills, projects, and achievements to your profile.
                </p>
              </div>
            </div>
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
