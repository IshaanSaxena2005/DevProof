import { useState } from "react";
import { Award, Plus } from "lucide-react";
import PageContainer from "../../components/PageContainer";
import { LAReveal, LALabel } from "./LA/shared";
import { OverviewMetrics, LearningOverviewPanel, type OverviewMetric } from "./LA/LearningOverview";
import {
  SkillsFromLearning,
  LearningTimeline,
  type TimelineEvent,
} from "./LA/EmptySections";
import ResumeSection from "./LA/ResumeSection";
import { AchievementEvidence, DevProofInsight } from "./LA/AchievementEvidence";
import { RecordForm } from "./LA/RecordForm";
import HackathonSection from "./LA/HackathonSection";
import { RecordCard, type RecordKind } from "./LA/shared";
import { certificationsService } from "../../services/certifications";
import { coursesService } from "../../services/courses";
import { hackathonsService } from "../../services/hackathons";
import { useResource } from "../../lib/useResource";
import type { Certification, CertificationInput, Course, CourseInput } from "../../lib/types";

/** One loaded record of the combined section — the kind discriminant keeps the
 * two backend records separate: a course is never rendered or saved as a
 * certification, or the other way around. */
type CombinedRecord =
  | { kind: "course"; record: Course }
  | { kind: "certification"; record: Certification };

/**
 * Learning & Achievements — Resume, one combined Courses & Certifications
 * section, and a separate Hackathons section.
 *
 * Data reality in this build:
 *  - Courses and certifications: real backend CRUD against /courses and
 *    /certifications, shown together but stored and typed separately.
 *  - Hackathons: real backend CRUD against /hackathons, in their own section.
 *  - Resume: real /resume backend for upload, parse and management.
 *  - Learning hours and study streaks: no source — em-dashes, never estimates.
 */
export default function LearningAchievements() {
  const {
    data: certData,
    loading: certsLoading,
    error: certsError,
    reload: reloadCerts,
  } = useResource(() => certificationsService.list());
  const {
    data: courseData,
    loading: coursesLoading,
    error: coursesError,
    reload: reloadCourses,
  } = useResource(() => coursesService.list());
  const {
    data: hackathonData,
    loading: hackathonsLoading,
    error: hackathonsError,
    reload: reloadHackathons,
  } = useResource(() => hackathonsService.list());

  const [activeFilter, setActiveFilter] = useState<"all" | "courses" | "certifications">("all");
  const [createKind, setCreateKind] = useState<RecordKind | null>(null);
  const [editTarget, setEditTarget] = useState<{ kind: RecordKind; id: string } | null>(null);
  const [showHackathonForm, setShowHackathonForm] = useState(false);
  /** Error from a delete request (create/edit errors render inside the form). */
  const [actionError, setActionError] = useState<string | null>(null);
  /** Skill names the backend reported as promoted by the last course/cert save. */
  const [promotedSkills, setPromotedSkills] = useState<string[]>([]);

  const certifications: Certification[] = certData?.certifications ?? [];
  const courses = courseData?.courses ?? [];
  const hackathons = hackathonData?.hackathons ?? [];

  /** Client-side display only — records are never merged or retyped. */
  const combined: CombinedRecord[] = [
    ...courses.map((c): CombinedRecord => ({ kind: "course", record: c })),
    ...certifications.map((c): CombinedRecord => ({ kind: "certification", record: c })),
  ];

  /** Filters the in-memory list; switching filters never refetches or mutates. */
  const filtered =
    activeFilter === "all"
      ? combined
      : combined.filter((item) => item.kind === (activeFilter === "courses" ? "course" : "certification"));

  const loadError = certsError ?? coursesError;

  async function handleRemove(item: CombinedRecord) {
    setActionError(null);
    try {
      if (item.kind === "course") {
        await coursesService.remove(item.record.id);
        reloadCourses();
      } else {
        await certificationsService.remove(item.record.id);
        reloadCerts();
      }
    } catch (err) {
      setActionError(
        err instanceof Error
          ? err.message
          : `Could not remove ${item.kind === "course" ? item.record.title : item.record.name}.`
      );
    }
  }

  /** Create/edit submit for the shared form. Success closes the form and
   * refreshes the owning list; failure rethrows so RecordForm shows the
   * backend's message inline and re-enables its submit button. */
  async function handleSave(kind: RecordKind, input: CourseInput | CertificationInput, id?: string) {
    setActionError(null);
    setPromotedSkills([]);
    if (kind === "course") {
      const result = id
        ? await coursesService.update(id, input as CourseInput)
        : await coursesService.add(input as CourseInput);
      setPromotedSkills(result.promotedSkills);
      reloadCourses();
    } else {
      const result = id
        ? await certificationsService.update(id, input as CertificationInput)
        : await certificationsService.add(input as CertificationInput);
      setPromotedSkills(result.promotedSkills);
      reloadCerts();
    }
  }

  // Overview metrics: courses, certifications and hackathons show real counts
  // once loaded; while loading — or after an error — they render an em-dash,
  // which means "nothing measured", never a fabricated zero. Learning activity
  // has no source at all.
  const metrics: OverviewMetric[] = [
    {
      icon: "courses",
      label: "Courses",
      value: coursesError ? null : coursesLoading ? null : courses.length,
      sub: "Recorded coursework",
    },
    {
      icon: "certifications",
      label: "Certifications",
      value: certsError ? null : certsLoading ? null : certifications.length,
      sub: "Recorded credentials",
    },
    {
      icon: "hackathons",
      label: "Hackathons",
      value: hackathonsError ? null : hackathonsLoading ? null : hackathons.length,
      sub: "Recorded experiences",
    },
    { icon: "activity", label: "Learning Activity", value: null, sub: "Awaiting course data" },
  ];

  // Timeline is fed exclusively by real records (certifications, courses and
  // hackathons).
  const timelineEvents: TimelineEvent[] = [
    ...certifications.map((c) => ({
      date: c.issueDate ?? c.createdAt,
      context: c.issuer,
      title: c.name,
    })),
    ...courses.map((c) => ({
      date: c.completedAt ?? c.createdAt,
      context: c.platform,
      title: c.title,
    })),
    ...hackathons.map((h) => ({
      date: h.heldAt ?? h.createdAt,
      context: h.organizer,
      title: h.name,
    })),
  ];

  // Skills from learning, computed only from recorded courses: how many
  // recorded courses taught each listed skill name.
  const learnedSkillMap = new Map<string, number>();
  for (const course of courses) {
    for (const skill of course.learnedSkills ?? []) {
      learnedSkillMap.set(skill, (learnedSkillMap.get(skill) ?? 0) + 1);
    }
  }
  const learnedSkills = [...learnedSkillMap.entries()].map(([name, sources], i) => ({
    id: `learned-${i}`,
    name,
    sources,
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

      {promotedSkills.length > 0 && (
        <div className="mt-4 rounded-2xl border border-primary/25 bg-primary/[0.06] px-5 py-3.5">
          <p className="text-[12px] text-white/75">
            <span className="text-primary font-semibold">Skills promoted</span> — recorded as{" "}
            <span className="text-white font-medium">{promotedSkills.join(", ")}</span> on the
            Skills page.
          </p>
        </div>
      )}

      {/* ── 2. Resume ── */}
      <div className="mt-8">
        <LAReveal delay={0.04}>
          <LALabel>Resume</LALabel>
          <ResumeSection />
        </LAReveal>
      </div>

      {/* ── 3. Learning overview ── */}
      <div className="mt-8">
        <LAReveal delay={0.05}>
          <LALabel>Learning Overview</LALabel>
          <LearningOverviewPanel
            onAddCourse={() => setCreateKind("course")}
            completedCount={coursesError || coursesLoading ? null : courses.filter((c) => c.isCompleted).length}
            inProgressCount={coursesError || coursesLoading ? null : courses.length - courses.filter((c) => c.isCompleted).length}
          />
        </LAReveal>
      </div>

      {/* ── 4. Courses & Certifications (one combined section) ── */}
      <div className="mt-8">
        <LAReveal delay={0.1}>
          <div className="flex flex-wrap items-center gap-3 mb-4">
            <LALabel className="mb-0">Courses & Certifications</LALabel>
            <div
              className="flex rounded-full border border-white/10 bg-white/[0.03] p-0.5"
              role="group"
              aria-label="Filter learning records"
            >
              {(["all", "courses", "certifications"] as const).map((f) => (
                <button
                  key={f}
                  type="button"
                  onClick={() => setActiveFilter(f)}
                  className={`rounded-full px-3 py-1 text-[11px] font-bold uppercase tracking-widest transition-all cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/60 ${
                    activeFilter === f
                      ? "bg-primary/10 text-primary border border-primary/25"
                      : "text-white/40 hover:text-white/70 border border-transparent"
                  }`}
                  aria-pressed={activeFilter === f}
                >
                  {f === "all" ? "All" : f === "courses" ? "Courses" : "Certifications"}
                </button>
              ))}
            </div>
            <div className="flex items-center gap-2 ml-auto">
              <button
                type="button"
                onClick={() => setCreateKind((k) => (k === "course" ? null : "course"))}
                className={`inline-flex items-center gap-2 text-xs font-bold uppercase tracking-widest px-4 py-2 rounded-full border transition-all cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/60 ${
                  createKind === "course"
                    ? "border-white/20 bg-white/[0.06] text-white/80"
                    : "border-primary/30 bg-primary/10 text-primary hover:bg-primary/20 hover:border-primary/50"
                }`}
                aria-expanded={createKind === "course"}
              >
                <Plus className="w-3.5 h-3.5" />
                {createKind === "course" ? "Close" : "Add course"}
              </button>
              <button
                type="button"
                onClick={() => setCreateKind((k) => (k === "certification" ? null : "certification"))}
                className={`inline-flex items-center gap-2 text-xs font-bold uppercase tracking-widest px-4 py-2 rounded-full border transition-all cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/60 ${
                  createKind === "certification"
                    ? "border-white/20 bg-white/[0.06] text-white/80"
                    : "border-primary/30 bg-primary/10 text-primary hover:bg-primary/20 hover:border-primary/50"
                }`}
                aria-expanded={createKind === "certification"}
              >
                <Plus className="w-3.5 h-3.5" />
                {createKind === "certification" ? "Close" : "Add certification"}
              </button>
            </div>
          </div>

          {createKind && (
            <RecordForm
              key={`create-${createKind}`}
              kind={createKind}
              onSubmit={(input) => handleSave(createKind, input)}
              onCancel={() => setCreateKind(null)}
              onSuccess={() => setCreateKind(null)}
            />
          )}

          {editTarget && (
            <RecordForm
              key={`edit-${editTarget.kind}-${editTarget.id}`}
              kind={editTarget.kind}
              initial={
                editTarget.kind === "course"
                  ? courses.find((c) => c.id === editTarget.id)
                  : certifications.find((c) => c.id === editTarget.id)
              }
              onSubmit={(input) => handleSave(editTarget.kind, input, editTarget.id)}
              onCancel={() => setEditTarget(null)}
              onSuccess={() => setEditTarget(null)}
            />
          )}

          {loadError ? (
            /* An API failure is not an empty dataset: say so and offer a retry. */
            <div className="flex flex-col items-center gap-3 py-10 text-center">
              <div className="w-11 h-11 rounded-2xl border border-red-500/25 bg-red-500/[0.08] flex items-center justify-center text-red-300">
                <Award className="w-5 h-5" />
              </div>
              <h3 className="text-sm font-bold text-white uppercase tracking-wider">
                Courses &amp; certifications could not be loaded
              </h3>
              <p className="text-[12px] max-w-md leading-relaxed text-red-300">{loadError}</p>
              <button
                type="button"
                onClick={() => {
                  if (certsError) reloadCerts();
                  if (coursesError) reloadCourses();
                }}
                className="mt-1 text-xs font-bold uppercase tracking-widest px-5 py-2.5 rounded-full border border-white/10 bg-white/[0.04] text-white/70 hover:bg-white/[0.08] transition-all cursor-pointer"
              >
                Retry
              </button>
            </div>
          ) : (certsLoading || coursesLoading) && filtered.length === 0 ? (
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-3" aria-hidden="true">
              {[0, 1].map((i) => (
                <div key={i} className="glass-panel p-5 animate-pulse">
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
          ) : filtered.length === 0 ? (
            <div className="flex flex-col items-center gap-3 py-10 text-center">
              <div className="w-11 h-11 rounded-2xl border border-white/10 bg-white/[0.03] flex items-center justify-center text-white/40">
                <Award className="w-5 h-5" />
              </div>
              <h3 className="text-sm font-bold text-white uppercase tracking-wider">
                {activeFilter === "courses"
                  ? "No courses added yet"
                  : activeFilter === "certifications"
                    ? "No certifications recorded yet"
                    : "No courses or certifications yet"}
              </h3>
              <p className="text-[12px] max-w-md leading-relaxed" style={{ color: "var(--text-secondary)" }}>
                {activeFilter === "courses"
                  ? "Record your coursework — platform, completion, and certificate link. Skills a course taught can be listed and are promoted on the Skills page where they match recorded names."
                  : activeFilter === "certifications"
                    ? "Add the credentials you have earned — issuer, credential ID, and link turn each one into profile evidence."
                    : "Add courses and certifications to build your learning record — courses support completion tracking and learned skills; certifications track issuer and credential details."}
              </p>
              <button
                type="button"
                onClick={() =>
                  setCreateKind(activeFilter === "certifications" ? "certification" : "course")
                }
                className="mt-1 text-xs font-bold uppercase tracking-widest px-5 py-2.5 rounded-full border border-primary/30 bg-primary/10 text-primary hover:bg-primary/20 hover:border-primary/50 transition-all cursor-pointer hover:-translate-y-0.5"
              >
                {activeFilter === "certifications" ? "Add certification" : "Add course"}
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-3">
              {filtered.map((item, i) => (
                <RecordCard
                  key={`${item.kind}-${item.record.id}`}
                  kind={item.kind}
                  id={item.record.id}
                  index={i}
                  title={item.kind === "course" ? item.record.title : item.record.name}
                  issuerOrPlatform={item.kind === "course" ? item.record.platform : item.record.issuer}
                  date={item.kind === "course" ? item.record.completedAt : item.record.issueDate}
                  certificateUrl={
                    item.kind === "course" ? item.record.certificateUrl : item.record.credentialUrl
                  }
                  credentialId={item.kind === "certification" ? item.record.credentialId : undefined}
                  issueDate={item.kind === "certification" ? item.record.issueDate : undefined}
                  learnedSkills={item.kind === "course" ? item.record.learnedSkills : undefined}
                  isCompleted={item.kind === "course" ? item.record.isCompleted : undefined}
                  onRemove={() => handleRemove(item)}
                  onEdit={(id, kind) => setEditTarget({ kind, id })}
                />
              ))}
            </div>
          )}
        </LAReveal>
      </div>

      {/* ── 5. Hackathons (separate section) ── */}
      <div className="mt-8">
        <LAReveal delay={0.2}>
          <div className="flex flex-wrap items-center gap-3 mb-4">
            <LALabel className="mb-0">Hackathons</LALabel>
            <button
              type="button"
              onClick={() => setShowHackathonForm((v) => !v)}
              className={`ml-auto inline-flex items-center gap-2 text-xs font-bold uppercase tracking-widest px-4 py-2 rounded-full border transition-all cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/60 ${
                showHackathonForm
                  ? "border-white/20 bg-white/[0.06] text-white/80"
                  : "border-primary/30 bg-primary/10 text-primary hover:bg-primary/20 hover:border-primary/50"
              }`}
              aria-expanded={showHackathonForm}
            >
              <Plus className="w-3.5 h-3.5" />
              {showHackathonForm ? "Close" : "Add hackathon"}
            </button>
          </div>
          <HackathonSection
            formOpen={showHackathonForm}
            onToggleForm={() => setShowHackathonForm((v) => !v)}
            hackathons={hackathons}
            loading={hackathonsLoading}
            error={hackathonsError}
            reload={reloadHackathons}
          />
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
          {/* Chips render only from skills the recorded courses actually
              listed; the empty state explains the Learning → Skills → Evidence
              flow until then. */}
          <SkillsFromLearning skills={learnedSkills} loading={coursesLoading} />
        </LAReveal>
      </div>

      {/* ── 8. Achievement evidence ── */}
      <div className="mt-8">
        <LAReveal delay={0.35}>
          <LALabel>Achievement Evidence</LALabel>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <AchievementEvidence
              sources={[
                { name: "Course", available: courses.length > 0, note: courses.length > 0 ? `${courses.length} recorded — live backend` : "None recorded yet" },
                { name: "Certification", available: certifications.length > 0, note: certifications.length > 0 ? `${certifications.length} recorded — live backend` : "None recorded yet" },
                { name: "Hackathon", available: hackathons.length > 0, note: hackathons.length > 0 ? `${hackathons.length} recorded — live backend` : "None recorded yet" },
              ]}
            />
            <AchievementEvidence
              sources={[
                { name: "Credential Link", available: certifications.some((c) => c.credentialUrl), note: "Attach a URL when recording a certification" },
                { name: "Certificate Link", available: courses.some((c) => c.certificateUrl), note: "Attach a URL when recording a completed course" },
              ]}
            />
          </div>
        </LAReveal>
      </div>

      {/* ── 9. DevProof insight ── */}
      <div className="mt-8">
        <LAReveal delay={0.4}>
          <DevProofInsight
            certificationCount={certifications.length}
            courseCount={courses.length}
            hackathonCount={hackathons.length}
          />
        </LAReveal>
      </div>

      {/* Data-scope footnote */}
      <LAReveal delay={0.45}>
        <div className="mt-8 rounded-2xl border border-white/[0.06] bg-white/[0.02] px-6 py-4 flex items-start gap-3">
          <Award className="w-4 h-4 text-white/30 shrink-0 mt-0.5" />
          <p className="text-[12px] text-white/35 leading-relaxed">
            Certification records, courses, hackathon experiences, and your uploaded resume are
            stored in your DevProof account. Learning-hour and study-streak tracking have no data
            source yet, so those stay blank — nothing here is assumed or invented.
          </p>
        </div>
      </LAReveal>
    </PageContainer>
  );
}
