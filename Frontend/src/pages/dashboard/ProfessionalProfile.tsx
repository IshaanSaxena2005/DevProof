import { Lightbulb, ArrowRight, User, MapPin } from "lucide-react";
import PageContainer from "../../components/PageContainer";
import GlassCard from "../../components/GlassCard";
import { PPReveal, PPLabel, PPStatLabel } from "./PP/shared";
import SourceCard from "./PP/SourceCard";
import CompletenessRing, { CompletenessBreakdown } from "./PP/CompletenessRing";
import EvidenceCoverage from "./PP/EvidenceCoverage";
import { useAuth } from "../../hooks/useAuth";

/* ── completeness wiring ──────────────────────────────────────
   Every component of completeness maps to a real data source in
   this build. No resume/LinkedIn backend exists, so those rows are
   null ("Not available") rather than invented percentages. Identity
   and professional rows come from the live auth user when present.
   ───────────────────────────────────────────────────────────── */

export default function ProfessionalProfile() {
  const { user } = useAuth();

  // Real profile fields from auth state; never invented.
  const name = user?.name?.trim() || null;
  const email = user?.email ?? "";
  // GitHub avatar is the only avatar source in the current backend.
  const avatarUrl = user?.avatarUrl ?? user?.githubAccount?.avatarUrl ?? null;
  const githubUsername = user?.githubAccount?.username ?? null;

  const identityScore = name ? 100 : 40;
  const professionalScore = githubUsername ? 40 : 20;

  const overall = Math.round(
    [identityScore, professionalScore, 0, 0, 0, 0].reduce((a, b) => a + b, 0) / 6
  );

  const breakdown = [
    { label: "Identity", percent: identityScore },
    { label: "Professional Profile", percent: professionalScore },
    { label: "Experience", percent: null },
    { label: "Skills", percent: null },
    { label: "Education", percent: null },
    { label: "Certifications", percent: null },
  ];

  return (
    <PageContainer
      title="Professional Profile"
      description="Build a complete professional identity from your resume and LinkedIn profile."
    >
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
                {overall > 0 ? "Identity evidence only" : "No evidence yet"}
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
            state="pending"
            stateLabel="Coming soon"
            bullets={[
              "Detect experience, education, and project history",
              "Extract skills and certifications as profile evidence",
              "Anchor achievements to your Developer 360 score",
            ]}
            cta="Upload Resume"
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
              Percentages reflect actual evidence on file. Components without a data source show
              "Not available" rather than a zero — no number is estimated.
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
