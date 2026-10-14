import { useState } from "react";
import { Loader2 } from "lucide-react";
import { ApiError } from "../../../lib/api";
import type { CourseInput, CertificationInput, Course, Certification } from "../../../lib/types";

type RecordKind = "course" | "certification";

/** Shared form for the combined Courses & Certifications section. One form slot
 * handles both shapes; `kind` selects the backend service and validation path,
 * and the submit label reflects the record type so the user always knows what
 * they are saving.
 */
export function RecordForm({
  kind,
  initial,
  onSubmit: onSubmitProp,
  onCancel,
  onSuccess,
}: {
  kind: RecordKind;
  /** Prefilled when editing — Course for courses, Certification for certifications. */
  initial?: Course | Certification;
  /** Parent-provided submit handler for the create path (used for edit-to-create
   * conversion when the parent owns the list). */
  onSubmit?: (input: CourseInput | CertificationInput) => Promise<void>;
  onCancel: () => void;
  onSuccess?: () => void;
}) {
  const isCourse = kind === "course";
  const submitLabel = isCourse ? "Save course" : "Save certification";
  const savingLabel = isCourse ? "Saving course…" : "Saving certification…";

  // One cast each rather than one per read: the dates are nullable, so a second
  // unguarded cast of the same value is what made these reads possibly-null.
  const course = isCourse ? (initial as Course | undefined) : undefined;
  const certification = isCourse ? undefined : (initial as Certification | undefined);

  const [name, setName] = useState(course?.title ?? certification?.name ?? "");
  const [platform, setPlatform] = useState(course?.platform ?? "");
  const [issuer, setIssuer] = useState(certification?.issuer ?? "");
  const [isCompleted, setIsCompleted] = useState(Boolean(course?.isCompleted));
  const [completedAt, setCompletedAt] = useState(course?.completedAt?.slice(0, 10) ?? "");
  // A certification's URL is credentialUrl; certificateUrl is the course field.
  const [certificateUrl, setCertificateUrl] = useState(
    course?.certificateUrl ?? certification?.credentialUrl ?? ""
  );
  const [credentialId, setCredentialId] = useState(certification?.credentialId ?? "");
  const [issueDate, setIssueDate] = useState(certification?.issueDate?.slice(0, 10) ?? "");
  const [skillsText, setSkillsText] = useState(course?.learnedSkills?.join(", ") ?? "");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const parsedSkills = skillsText
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);

  function field(
    id: string,
    value: string,
    onChange: (e: React.ChangeEvent<HTMLInputElement>) => void,
    placeholder: string,
    label: string,
    required?: boolean
  ) {
    return (
      <div className="sm:col-span-2">
        <label
          htmlFor={id}
          className={`block text-[11px] uppercase tracking-widest text-white/40 mb-2 ${required ? "" : "opacity-60"}`}
        >
          {label}
          {required && <span className="text-red-400 ml-1">*</span>}
        </label>
        <input
          id={id}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          className="w-full rounded-xl border border-white/10 bg-white/[0.03] px-4 py-2.5 text-sm text-white placeholder:text-white/25 outline-none focus:border-white/25"
        />
      </div>
    );
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (isCourse && !name.trim()) return;
    if (!isCourse && (!name.trim() || !issuer.trim())) return;

    if (isCourse) {
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
    }

    setSaving(true);
    setError(null);
    try {
      if (isCourse) {
        const input: CourseInput = {
          title: name.trim(),
          platform: platform.trim(),
          isCompleted,
          ...(isCompleted && completedAt ? { completedAt: new Date(completedAt).toISOString() } : {}),
          ...(certificateUrl.trim() ? { certificateUrl: certificateUrl.trim() } : {}),
          ...(parsedSkills.length > 0 ? { learnedSkills: parsedSkills } : {}),
        };
        await onSubmitProp?.(input);
      } else {
        const input: CertificationInput = {
          name: name.trim(),
          issuer: issuer.trim(),
          ...(credentialId.trim() ? { credentialId: credentialId.trim() } : {}),
          ...(certificateUrl.trim() ? { credentialUrl: certificateUrl.trim() } : {}),
          ...(issueDate ? { issueDate: new Date(issueDate).toISOString() } : {}),
        };
        await onSubmitProp?.(input);
      }
      onSuccess?.();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : `Could not save the ${isCourse ? "course" : "certification"}.`);
      setSaving(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="glass-panel p-5 mb-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {isCourse ? (
          <>
            {field("rc-title", name, (e) => setName(e.target.value), "e.g. Distributed Systems (MIT 6.824)", "Course title *", true)}
            {field("rc-platform", platform, (e) => setPlatform(e.target.value), "Coursera, YouTube, edX", "Platform *", true)}
            <div className="flex items-center gap-2.5">
              <input
                id="rc-completed"
                type="checkbox"
                checked={isCompleted}
                onChange={(e) => setIsCompleted(e.target.checked)}
                className="w-4 h-4 rounded accent-[hsl(var(--primary))] cursor-pointer"
              />
              <label htmlFor="rc-completed" className="text-[11px] uppercase tracking-widest text-white/40 cursor-pointer select-none">
                Completed
              </label>
            </div>
            <div>
              <label htmlFor="rc-completed-at" className="block text-[11px] uppercase tracking-widest text-white/40 mb-2">
                Completion date{isCompleted ? "" : " (when completed)"}
              </label>
              <input
                id="rc-completed-at"
                type="date"
                value={completedAt}
                onChange={(e) => setCompletedAt(e.target.value)}
                disabled={!isCompleted}
                className={`w-full rounded-xl border border-white/10 bg-white/[0.03] px-4 py-2.5 text-sm text-white placeholder:text-white/25 outline-none focus:border-white/25 ${isCompleted ? "" : "cursor-not-allowed disabled:opacity-40"}`}
              />
            </div>
            {field("rc-certificate-url", certificateUrl, (e) => setCertificateUrl(e.target.value), "https://…", "Certificate URL")}
            <div className="sm:col-span-2">
              <label htmlFor="rc-skills" className="block text-[11px] uppercase tracking-widest text-white/40 mb-2">
                Skills this course taught (comma-separated)
              </label>
              <input id="rc-skills" value={skillsText} onChange={(e) => setSkillsText(e.target.value)} placeholder="Consensus, MapReduce, Raft" className="w-full rounded-xl border border-white/10 bg-white/[0.03] px-4 py-2.5 text-sm text-white placeholder:text-white/25 outline-none focus:border-white/25" />
              <p className="text-[10px] text-white/25 mt-1.5">Up to 20 names, 60 characters each. Matching recorded skills are promoted.</p>
            </div>
          </>
        ) : (
          <>
            {field("rc-name", name, (e) => setName(e.target.value), "AWS Solutions Architect", "Certification name *", true)}
            {field("rc-issuer", issuer, (e) => setIssuer(e.target.value), "Amazon Web Services", "Issuing organization *", true)}
            {field("rc-credential-id", credentialId, (e) => setCredentialId(e.target.value), "Optional", "Credential ID")}
            {field("rc-certificate-url", certificateUrl, (e) => setCertificateUrl(e.target.value), "https://…", "Credential URL")}
            <div>
              <label htmlFor="rc-issue-date" className="block text-[11px] uppercase tracking-widest text-white/40 mb-2">
                Issue date
              </label>
              <input
                id="rc-issue-date"
                type="date"
                value={issueDate}
                onChange={(e) => setIssueDate(e.target.value)}
                className="w-full rounded-xl border border-white/10 bg-white/[0.03] px-4 py-2.5 text-sm text-white placeholder:text-white/25 outline-none focus:border-white/25"
              />
            </div>
          </>
        )}
      </div>

      {error && <p className="text-[12px] text-red-300 mt-3">{error}</p>}

      <div className="flex items-center gap-3 mt-4">
        <button
          type="submit"
          disabled={saving || (isCourse ? !name.trim() : !name.trim() || !issuer.trim())}
          className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-widest px-5 py-2.5 rounded-full transition-all cursor-pointer disabled:opacity-40"
          style={{ backgroundColor: "hsl(var(--primary))", color: "hsl(var(--primary-foreground))" }}
        >
          {saving && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
          {saving ? savingLabel : submitLabel}
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="text-xs font-bold uppercase tracking-widest px-5 py-2.5 rounded-full border border-white/10 bg-white/[0.04] text-white/70 hover:bg-white/[0.08] transition-all cursor-pointer"
        >
          Cancel
        </button>
        <p className="text-[11px] text-white/30 ml-auto hidden sm:block">
          {isCourse ? "Submitted to /courses — nothing is tracked until your backend receives it." : "Recorded as credential evidence — verification coming later."}
        </p>
      </div>
    </form>
  );
}
