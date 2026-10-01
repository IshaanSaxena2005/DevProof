import { useState } from "react";
import { Award } from "lucide-react";
import PageContainer from "../../components/PageContainer";
import { LAReveal, LALabel } from "./LA/shared";
import { OverviewMetrics, LearningOverviewPanel, type OverviewMetric } from "./LA/LearningOverview";
import {
  CertificationCard,
  CertificationsEmpty,
  CertificationForm,
  AddCertificationButton,
} from "./LA/CertificationCard";
import {
  CoursesEmpty,
  HackathonsEmpty,
  SkillsFromLearning,
  LearningTimeline,
  type TimelineEvent,
} from "./LA/EmptySections";
import { AchievementEvidence, DevProofInsight } from "./LA/AchievementEvidence";
import { certificationsService } from "../../services/certifications";
import { useResource } from "../../lib/useResource";
import type { Certification, CertificationInput } from "../../lib/types";

/**
 * Learning & Achievements — the single page for courses, certifications,
 * hackathons, and the timeline that ties them together.
 *
 * Data reality in this build:
 *  - Certifications: real backend (list/add/update/remove) — fully interactive.
 *  - Courses, hackathons, learning hours: no backend — polished empty states
 *    with "coming soon" CTAs, never fabricated records.
 */
export default function LearningAchievements() {
  const { data, loading, error, reload } = useResource(() => certificationsService.list());

  const [showForm, setShowForm] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  const certifications: Certification[] = data?.certifications ?? [];

  async function handleAdd(input: CertificationInput) {
    setActionError(null);
    try {
      await certificationsService.add(input);
      setShowForm(false);
      reload();
    } catch (err) {
      setActionError(err instanceof Error ? err.message : "Could not save the certification.");
    }
  }

  async function handleRemove(cert: Certification) {
    setActionError(null);
    try {
      await certificationsService.remove(cert.id);
      reload();
    } catch (err) {
      setActionError(err instanceof Error ? err.message : `Could not remove ${cert.name}.`);
    }
  }

  // Overview metrics: certifications are real; everything without a backend
  // source renders an em-dash — absence, not a measured zero.
  const metrics: OverviewMetric[] = [
    { icon: "courses", label: "Courses", value: null, sub: "No tracking connected" },
    { icon: "certifications", label: "Certifications", value: loading ? null : certifications.length, sub: "Recorded credentials" },
    { icon: "hackathons", label: "Hackathons", value: null, sub: "No records yet" },
    { icon: "activity", label: "Learning Activity", value: null, sub: "Awaiting course data" },
  ];

  // Timeline is fed exclusively by real records (certifications today).
  const timelineEvents: TimelineEvent[] = certifications.map((c) => ({
    date: c.issueDate ?? c.createdAt,
    context: c.issuer,
    title: c.name,
  }));

  return (
    <PageContainer
      title="Learning & Achievements"
      description="Track the learning, credentials, and experiences that strengthen your developer profile."
    >
      {/* ── 1. Overview metrics ── */}
      <LAReveal>
        <OverviewMetrics metrics={metrics} />
      </LAReveal>

      {actionError && (
        <div className="mt-4 rounded-2xl border border-red-500/25 bg-red-500/[0.08] px-5 py-3.5">
          <p className="text-[13px] text-red-300">{actionError}</p>
        </div>
      )}

      {error && (
        <div className="mt-4 rounded-2xl border border-red-500/25 bg-red-500/[0.08] px-5 py-3.5 flex items-center justify-between gap-3">
          <p className="text-[13px] text-red-300">{error}</p>
          <button
            onClick={reload}
            className="text-xs font-bold uppercase tracking-widest px-4 py-2 rounded-full border border-white/10 bg-white/[0.04] text-white/70 hover:bg-white/[0.08] transition-all cursor-pointer shrink-0"
          >
            Retry
          </button>
        </div>
      )}

      {/* ── 2. Learning overview ── */}
      <div className="mt-8">
        <LAReveal delay={0.05}>
          <LALabel>Learning Overview</LALabel>
          <LearningOverviewPanel />
        </LAReveal>
      </div>

      {/* ── 3. Certifications ── */}
      <div className="mt-8">
        <LAReveal delay={0.1}>
          <div className="flex items-center justify-between gap-3 mb-4">
            <LALabel>Certifications</LALabel>
            <AddCertificationButton open={showForm} onClick={() => setShowForm((v) => !v)} />
          </div>

          {showForm && (
            <CertificationForm
              onSubmit={handleAdd}
              onCancel={() => setShowForm(false)}
              submitLabel="Save certification"
            />
          )}

          {loading ? (
            /* Skeleton while /certifications is in flight — without it the
               grid renders zero cards and reads as an empty list. */
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-3">
              {[0, 1].map((i) => (
                <div key={i} className="glass-panel p-5 animate-pulse" aria-hidden="true">
                  <div className="flex items-start gap-4">
                    <div className="w-10 h-10 rounded-xl bg-white/[0.05] shrink-0" />
                    <div className="flex-1 space-y-2.5">
                      <div className="h-4 w-1/3 rounded bg-white/[0.05]" />
                      <div className="h-3 w-1/2 rounded bg-white/[0.05]" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : !error && certifications.length === 0 ? (
            <CertificationsEmpty onAdd={() => setShowForm(true)} />
          ) : (
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-3">
              {certifications.map((cert, i) => (
                <CertificationCard key={cert.id} cert={cert} index={i} onRemove={handleRemove} />
              ))}
            </div>
          )}
        </LAReveal>
      </div>

      {/* ── 4. Courses ── */}
      <div className="mt-8">
        <LAReveal delay={0.15}>
          <LALabel>Courses</LALabel>
          <CoursesEmpty />
        </LAReveal>
      </div>

      {/* ── 5. Hackathons ── */}
      <div className="mt-8">
        <LAReveal delay={0.2}>
          <LALabel>Hackathons</LALabel>
          <HackathonsEmpty />
        </LAReveal>
      </div>

      {/* ── 6. Learning timeline ── */}
      <div className="mt-8">
        <LAReveal delay={0.25}>
          <LALabel>Learning Timeline</LALabel>
          <LearningTimeline events={timelineEvents} />
        </LAReveal>
      </div>

      {/* ── 7. Skills developed ── */}
      <div className="mt-8">
        <LAReveal delay={0.3}>
          <LALabel>Skills Developed</LALabel>
          {/* No learning-source attribution exists yet, so the panel explains
              the Learning → Skills → Evidence flow rather than listing chips. */}
          <SkillsFromLearning skills={[]} loading={false} />
        </LAReveal>
      </div>

      {/* ── 8. Achievement evidence ── */}
      <div className="mt-8">
        <LAReveal delay={0.35}>
          <LALabel>Achievement Evidence</LALabel>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <AchievementEvidence
              sources={[
                { name: "Course", available: false, note: "Course tracking not connected" },
                { name: "Certification", available: certifications.length > 0, note: certifications.length > 0 ? `${certifications.length} recorded — live backend` : "None recorded yet" },
                { name: "Hackathon", available: false, note: "No records can be added yet" },
              ]}
            />
            <AchievementEvidence
              sources={[
                { name: "Credential Link", available: certifications.some((c) => c.credentialUrl), note: "Attach a URL when recording a certification" },
                { name: "Project Repository", available: false, note: "Link repositories from the Repositories page" },
              ]}
            />
          </div>
        </LAReveal>
      </div>

      {/* ── 9. DevProof insight ── */}
      <div className="mt-8">
        <LAReveal delay={0.4}>
          <DevProofInsight certificationCount={certifications.length} />
        </LAReveal>
      </div>

      {/* Data-scope footnote */}
      <LAReveal delay={0.45}>
        <div className="mt-8 rounded-2xl border border-white/[0.06] bg-white/[0.02] px-6 py-4 flex items-start gap-3">
          <Award className="w-4 h-4 text-white/30 shrink-0 mt-0.5" />
          <p className="text-[12px] text-white/35 leading-relaxed">
            Certification records are stored in your DevProof account. Courses, hackathons, and
            learning-hour tracking are on the roadmap — those sections stay empty until their
            integrations exist, so nothing here is assumed or invented.
          </p>
        </div>
      </LAReveal>

    </PageContainer>
  );
}
