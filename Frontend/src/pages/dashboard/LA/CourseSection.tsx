import { useState } from "react";
import { motion } from "motion/react";
import { BookOpen, ExternalLink, Loader2, Trash2, CalendarDays, Globe, ChevronDown } from "lucide-react";
import { useResource } from "../../../lib/useResource";
import { ApiError } from "../../../lib/api";
import { coursesService } from "../../../services/courses";
import { LAStatLabel } from "./shared";
import type { Course, CourseInput } from "../../../lib/types";

/**
 * Courses section backed by the existing /courses backend.
 *
 * Honesty rules for this page: completedAt is null while in progress and is
 * never invented; learnedSkills are rendered as names the user says the course
 * taught — the backend may promote matching skills, which is reported after
 * each mutation, not assumed here.
 */
export default function CourseSection({
  formOpen,
  onToggleForm,
}: {
  /** Controlled so the Learning Overview's "Add course" CTA opens this form too. */
  formOpen: boolean;
  onToggleForm: () => void;
}) {
  const { data, loading, error, reload } = useResource(() => coursesService.list(), []);
  const [actionError, setActionError] = useState<string | null>(null);
  const [promoted, setPromoted] = useState<string[] | null>(null);

  async function handleCreate(input: CourseInput) {
    setActionError(null);
    try {
      const result = await coursesService.add(input);
      setPromoted(result.promotedSkills);
      // The list closes the form only after a successful create.
      reload();
      return null;
    } catch (err) {
      const message = err instanceof ApiError ? err.message : "Could not save the course.";
      setActionError(message);
      return message;
    }
  }

  async function handleRemove(course: Course) {
    setActionError(null);
    setPromoted(null);
    try {
      await coursesService.remove(course.id);
      reload();
    } catch (err) {
      setActionError(err instanceof ApiError ? err.message : `Could not remove ${course.title}.`);
    }
  }

  const courses = data?.courses ?? [];

  if (error) {
    return (
      <div className="flex flex-col items-center gap-3 py-10 text-center">
        <div className="w-11 h-11 rounded-2xl border border-red-500/25 bg-red-500/[0.08] flex items-center justify-center text-red-300">
          <BookOpen className="w-5 h-5" />
        </div>
        <h3 className="text-sm font-bold text-white uppercase tracking-wider">Courses could not be loaded</h3>
        <p className="text-[12px] max-w-md leading-relaxed text-red-300">{error}</p>
        <button
          onClick={reload}
          className="mt-1 text-xs font-bold uppercase tracking-widest px-5 py-2.5 rounded-full border border-white/10 bg-white/[0.04] text-white/70 hover:bg-white/[0.08] transition-all cursor-pointer"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div>
      {actionError && (
        <p className="text-[12px] text-red-300 mb-3">{actionError}</p>
      )}

      {promoted && promoted.length > 0 && (
        <div className="mb-3 rounded-2xl border border-primary/25 bg-primary/[0.06] px-5 py-3.5">
          <p className="text-[12px] text-white/75">
            <span className="text-primary font-semibold">Skills promoted</span> — recorded as{" "}
            <span className="text-white font-medium">{promoted.join(", ")}</span> on the Skills page.
          </p>
        </div>
      )}

      {formOpen && (
        <CourseForm
          submitLabel="Save course"
          onSubmit={handleCreate}
          onSuccess={onToggleForm}
        />
      )}

      {loading ? (
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-3 mt-4" aria-hidden="true">
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
      ) : courses.length === 0 ? (
        <div className="flex flex-col items-center gap-3 py-10 text-center">
          <div className="w-11 h-11 rounded-2xl border border-white/10 bg-white/[0.03] flex items-center justify-center text-white/40">
            <BookOpen className="w-5 h-5" />
          </div>
          <h3 className="text-sm font-bold text-white uppercase tracking-wider">No courses added yet</h3>
          <p className="text-[12px] max-w-md leading-relaxed" style={{ color: "var(--text-secondary)" }}>
            Record your coursework — platform, completion, and certificate link. Skills a course
            taught can be listed and are promoted on the Skills page where they match recorded names.
          </p>
          <button
            onClick={onToggleForm}
            className="mt-1 text-xs font-bold uppercase tracking-widest px-5 py-2.5 rounded-full border border-amber-400/30 bg-amber-400/10 text-amber-300 hover:bg-amber-400/20 transition-all cursor-pointer hover:-translate-y-0.5"
          >
            Add course
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-3 mt-4">
          {courses.map((course, i) => (
            <CourseCard key={course.id} course={course} index={i} onRemove={handleRemove} />
          ))}
        </div>
      )}
    </div>
  );
}

function CourseCard({
  course,
  index,
  onRemove,
}: {
  course: Course;
  index: number;
  onRemove: (c: Course) => void;
}) {
  const [open, setOpen] = useState(false);
  const hasSkills = (course.learnedSkills?.length ?? 0) > 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.05 * index, duration: 0.4 }}
      className="glass-panel overflow-hidden relative"
    >
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/[0.10] to-transparent pointer-events-none" />

      <div className="p-5 flex items-start gap-4">
        <div className="w-10 h-10 rounded-xl border border-sky-400/25 bg-sky-400/10 flex items-center justify-center text-sky-300 shrink-0">
          <BookOpen className="w-5 h-5" />
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="text-sm font-bold text-white leading-tight">{course.title}</h3>
            {course.isCompleted ? (
              <span className="inline-flex items-center gap-1 text-[9px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-full border border-primary/25 bg-primary/10 text-primary">
                Completed
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 text-[9px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-full border border-amber-400/25 bg-amber-400/10 text-amber-300">
                In progress
              </span>
            )}
          </div>
          <p className="text-[12px] text-white/45 mt-1 flex flex-wrap items-center gap-x-2 gap-y-1">
            <Globe className="w-3 h-3 text-white/25 shrink-0" /> {course.platform}
            <span className="text-white/20">·</span>
            <CalendarDays className="w-3 h-3 text-white/25 shrink-0" />
            {course.completedAt
              ? `Completed ${new Date(course.completedAt).toLocaleDateString(undefined, { month: "short", year: "numeric" })}`
              : "No completion date yet"}
          </p>
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          {course.certificateUrl && (
            <a
              href={course.certificateUrl}
              target="_blank"
              rel="noreferrer"
              title="Open certificate"
              className="w-8 h-8 rounded-lg border border-white/10 flex items-center justify-center text-white/50 hover:text-primary hover:border-primary/40 transition-all cursor-pointer"
            >
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          )}
          {hasSkills && (
            <button
              onClick={() => setOpen((v) => !v)}
              title="Learned skills"
              className="w-8 h-8 rounded-lg border border-white/10 flex items-center justify-center text-white/40 hover:text-white transition-all cursor-pointer"
            >
              <ChevronDown className={`w-3.5 h-3.5 transition-transform ${open ? "rotate-180" : ""}`} />
            </button>
          )}
          <button
            onClick={() => onRemove(course)}
            title={`Remove ${course.title}`}
            className="w-8 h-8 rounded-lg border border-white/10 flex items-center justify-center text-white/40 hover:text-red-400 hover:border-red-400/30 transition-all cursor-pointer"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {open && hasSkills && (
        <div className="px-5 pb-5 pl-[72px]">
          <LAStatLabel>Skills this course taught</LAStatLabel>
          <div className="flex flex-wrap gap-2 mt-2">
            {course.learnedSkills.map((s) => (
              <span key={s} className="text-[11px] px-2.5 py-1 rounded-full border border-white/[0.08] bg-white/[0.03] text-white/60">
                {s}
              </span>
            ))}
          </div>
        </div>
      )}
    </motion.div>
  );
}

/**
 * Create form. Fields match the backend validator exactly: title and platform
 * required, completion state, completion date, optional certificate URL, and
 * up to 20 skill names (≤60 chars each) that the backend may promote.
 */
export function CourseForm({
  onSubmit,
  submitLabel,
  onSuccess,
}: {
  onSubmit: (input: CourseInput) => Promise<string | null>;
  submitLabel: string;
  /** Called after a successful create, so the parent can close the form. */
  onSuccess?: () => void;
}) {
  const [title, setTitle] = useState("");
  const [platform, setPlatform] = useState("");
  const [isCompleted, setIsCompleted] = useState(false);
  const [completedAt, setCompletedAt] = useState("");
  const [certificateUrl, setCertificateUrl] = useState("");
  const [skillsText, setSkillsText] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const parsedSkills = skillsText
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim() || !platform.trim()) return;

    const skillError =
      parsedSkills.length > 20
        ? "A course can list at most 20 skills."
        : parsedSkills.some((s) => s.length > 60)
          ? "Each skill name must be 60 characters or fewer."
          : null;
    if (skillError) {
      setError(skillError);
      return;
    }

    setSaving(true);
    setError(null);
    try {
      const result = await onSubmit({
        title: title.trim(),
        platform: platform.trim(),
        isCompleted,
        ...(isCompleted && completedAt ? { completedAt: new Date(completedAt).toISOString() } : {}),
        ...(certificateUrl.trim() ? { certificateUrl: certificateUrl.trim() } : {}),
        ...(parsedSkills.length > 0 ? { learnedSkills: parsedSkills } : {}),
      });
      if (result) {
        setError(result);
        setSaving(false);
      } else {
        // Successful create: the parent closes/unmounts this form.
        onSuccess?.();
      }
      // Only the parent clears the form after a successful create.
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not save the course.");
      setSaving(false);
    }
  }

  const field =
    "w-full rounded-xl border border-white/10 bg-white/[0.03] px-4 py-2.5 text-sm text-white placeholder:text-white/25 outline-none focus:border-white/25";

  return (
    <form onSubmit={handleSubmit} className="glass-panel p-5 mb-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <label htmlFor="course-title" className="block text-[11px] uppercase tracking-widest text-white/40 mb-2">Course title *</label>
          <input id="course-title" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Distributed Systems (MIT 6.824)" className={field} />
        </div>
        <div>
          <label htmlFor="course-platform" className="block text-[11px] uppercase tracking-widest text-white/40 mb-2">Platform *</label>
          <input id="course-platform" value={platform} onChange={(e) => setPlatform(e.target.value)} placeholder="e.g. Coursera, YouTube, edX" className={field} />
        </div>
        <div className="flex items-center gap-2.5">
          <input
            id="course-completed"
            type="checkbox"
            checked={isCompleted}
            onChange={(e) => setIsCompleted(e.target.checked)}
            className="w-4 h-4 rounded accent-[hsl(var(--primary))] cursor-pointer"
          />
          <label htmlFor="course-completed" className="text-[11px] uppercase tracking-widest text-white/40 cursor-pointer select-none">
            Completed
          </label>
        </div>
        <div>
          <label htmlFor="course-completed-at" className="block text-[11px] uppercase tracking-widest text-white/40 mb-2">
            Completion date{isCompleted ? "" : " (when completed)"}
          </label>
          <input
            id="course-completed-at"
            type="date"
            value={completedAt}
            onChange={(e) => setCompletedAt(e.target.value)}
            disabled={!isCompleted}
            className={`${field} disabled:opacity-40 ${isCompleted ? "" : "cursor-not-allowed"}`}
          />
        </div>
        <div>
          <label htmlFor="course-certificate-url" className="block text-[11px] uppercase tracking-widest text-white/40 mb-2">Certificate URL</label>
          <input id="course-certificate-url" type="url" value={certificateUrl} onChange={(e) => setCertificateUrl(e.target.value)} placeholder="https://…" className={field} />
        </div>
        <div className="sm:col-span-2">
          <label htmlFor="course-skills" className="block text-[11px] uppercase tracking-widest text-white/40 mb-2">
            Skills this course taught (comma-separated)
          </label>
          <input id="course-skills" value={skillsText} onChange={(e) => setSkillsText(e.target.value)} placeholder="e.g. Consensus, MapReduce, Raft" className={field} />
          <p className="text-[10px] text-white/25 mt-1.5">Up to 20 names, 60 characters each. Matching recorded skills are promoted.</p>
        </div>
      </div>

      {error && <p className="text-[12px] text-red-300 mt-3">{error}</p>}

      <div className="flex items-center gap-3 mt-4">
        <button
          type="submit"
          disabled={saving || !title.trim() || !platform.trim()}
          className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-widest px-5 py-2.5 rounded-full transition-all cursor-pointer disabled:opacity-40"
          style={{ backgroundColor: "hsl(var(--primary))", color: "hsl(var(--primary-foreground))" }}
        >
          {saving && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
          {saving ? "Saving…" : submitLabel}
        </button>
        <span className="text-[11px] text-white/30 hidden sm:block">
          Submitted to /courses — nothing is tracked until your backend receives it.
        </span>
      </div>
    </form>
  );
}
