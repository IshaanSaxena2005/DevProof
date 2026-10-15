import { useState } from "react";
import { motion } from "motion/react";
import {
  Trophy,
  ExternalLink,
  Loader2,
  Pencil,
  Trash2,
  CalendarDays,
  Building2,
  ChevronDown,
  Users,
} from "lucide-react";
import { ApiError } from "../../../lib/api";
import { hackathonsService } from "../../../services/hackathons";
import { LAStatLabel } from "./shared";
import type { Hackathon, HackathonInput } from "../../../lib/types";

/**
 * Hackathons section backed by the existing /hackathons backend (list, add,
 * update, remove) — no duplicate endpoints.
 *
 * Honesty rules for this page: every field shown comes straight from the API
 * contract (name, organizer, role, project, result, team size, dates,
 * technologies). Nothing is invented — an unrecorded date stays "No date
 * recorded" rather than guessed, and there is no verification state because
 * the API has none. Listed technologies are recorded by the backend as CLAIMED
 * skills only; the mutation response's `recordedSkills` is what gets shown.
 */
export default function HackathonSection({
  formOpen: formOpenProp,
  onToggleForm,
  hackathons,
  loading,
  error,
  reload,
}: {
  /** Controlled from the page so the section header's Add button owns it. */
  formOpen: boolean;
  onToggleForm: () => void;
  /** Live data from the page-level GET /hackathons — one request, shared upward. */
  hackathons: Hackathon[];
  loading: boolean;
  error: string | null;
  reload: () => void;
}) {
  const [actionError, setActionError] = useState<string | null>(null);
  /** Technologies the backend reported as newly recorded at CLAIMED. */
  const [recorded, setRecorded] = useState<string[]>([]);
  /** Hackathon being edited, or null for create mode. */
  const [editing, setEditing] = useState<Hackathon | null>(null);

  /** Success closes whichever form is open and refreshes the list; failure
   * rethrows so the form shows the backend's message inline. */
  async function handleSave(input: HackathonInput) {
    setActionError(null);
    setRecorded([]);
    const wasEditing = editing !== null;
    const result = wasEditing
      ? await hackathonsService.update(editing.id, input)
      : await hackathonsService.add(input);
    setRecorded(result.recordedSkills);
    setEditing(null);
    if (!wasEditing) onToggleForm();
    reload();
  }

  async function handleRemove(hackathon: Hackathon) {
    setActionError(null);
    setRecorded([]);
    try {
      await hackathonsService.remove(hackathon.id);
      reload();
    } catch (err) {
      setActionError(
        err instanceof ApiError ? err.message : `Could not remove ${hackathon.name}.`
      );
    }
  }

  // The edit form opens in place of the create form — one visible form slot.
  const showCreateForm = formOpenProp && editing === null;

  if (error) {
    return (
      <div className="flex flex-col items-center gap-3 py-10 text-center">
        <div className="w-11 h-11 rounded-2xl border border-red-500/25 bg-red-500/[0.08] flex items-center justify-center text-red-300">
          <Trophy className="w-5 h-5" />
        </div>
        <h3 className="text-sm font-bold text-white uppercase tracking-wider">
          Hackathons could not be loaded
        </h3>
        <p className="text-[12px] max-w-md leading-relaxed text-red-300">{error}</p>
        <button
          type="button"
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
        <div className="mb-3 rounded-2xl border border-red-500/25 bg-red-500/[0.08] px-5 py-3.5">
          <p className="text-[12px] text-red-300">{actionError}</p>
        </div>
      )}

      {recorded.length > 0 && (
        <div className="mb-3 rounded-2xl border border-primary/25 bg-primary/[0.06] px-5 py-3.5">
          <p className="text-[12px] text-white/75">
            <span className="text-primary font-semibold">Technologies recorded</span> —{" "}
            <span className="text-white font-medium">{recorded.join(", ")}</span> added as claimed
            skills on the Skills page. A hackathon never raises a skill's evidence level on its own.
          </p>
        </div>
      )}

      {showCreateForm && (
        <HackathonForm key="hackathon-create" onSubmit={handleSave} onCancel={onToggleForm} />
      )}

      {editing && (
        <HackathonForm
          key={`hackathon-edit-${editing.id}`}
          initial={editing}
          onSubmit={handleSave}
          onCancel={() => setEditing(null)}
        />
      )}

      {loading && hackathons.length === 0 ? (
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
      ) : hackathons.length === 0 ? (
        <div className="flex flex-col items-center gap-3 py-10 text-center">
          <div className="w-11 h-11 rounded-2xl border border-white/10 bg-white/[0.03] flex items-center justify-center text-white/40">
            <Trophy className="w-5 h-5" />
          </div>
          <h3 className="text-sm font-bold text-white uppercase tracking-wider">
            No hackathon experiences added yet
          </h3>
          <p className="text-[12px] max-w-md leading-relaxed" style={{ color: "var(--text-secondary)" }}>
            Record the competitive projects you have taken part in — organizer, dates, your role,
            the project, result, and the technologies used. Everything you enter is your own
            account of the event, so it is stored as claimed evidence only.
          </p>
          <button
            type="button"
            onClick={onToggleForm}
            className="mt-1 text-xs font-bold uppercase tracking-widest px-5 py-2.5 rounded-full border border-primary/30 bg-primary/10 text-primary hover:bg-primary/20 hover:border-primary/50 transition-all cursor-pointer hover:-translate-y-0.5"
          >
            Add hackathon
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-3">
          {hackathons.map((hackathon, i) => (
            <HackathonCard
              key={hackathon.id}
              hackathon={hackathon}
              index={i}
              onRemove={handleRemove}
              onEdit={setEditing}
            />
          ))}
        </div>
      )}
    </div>
  );
}

/** Card for one recorded hackathon — only fields the API actually returns. */
function HackathonCard({
  hackathon,
  index,
  onRemove,
  onEdit,
}: {
  hackathon: Hackathon;
  index: number;
  onRemove: (h: Hackathon) => void;
  onEdit: (h: Hackathon) => void;
}) {
  const [open, setOpen] = useState(false);
  const hasExtras =
    Boolean(hackathon.role) ||
    Boolean(hackathon.projectName) ||
    Boolean(hackathon.result) ||
    hackathon.teamSize != null ||
    hackathon.technologies.length > 0;

  const heldLabel = hackathon.heldAt
    ? `Held ${new Date(hackathon.heldAt).toLocaleDateString(undefined, { month: "short", year: "numeric" })}`
    : "No date recorded";

  return (
    <motion.div
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.05 * index, duration: 0.4 }}
      className="glass-panel overflow-hidden relative"
    >
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/[0.10] to-transparent pointer-events-none" />

      <div className="p-5 flex items-start gap-4">
        <div className="w-10 h-10 rounded-xl border border-amber-400/25 bg-amber-400/10 flex items-center justify-center text-amber-300 shrink-0">
          <Trophy className="w-5 h-5" />
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="text-sm font-bold text-white leading-tight">{hackathon.name}</h3>
            <span className="inline-flex items-center gap-1 text-[9px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-full border border-white/12 bg-white/[0.04] text-white/50">
              Hackathon
            </span>
            {hackathon.result && (
              <span className="inline-flex items-center gap-1 text-[9px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-full border border-primary/25 bg-primary/10 text-primary">
                {hackathon.result}
              </span>
            )}
          </div>
          <p className="text-[12px] text-white/45 mt-1 flex flex-wrap items-center gap-x-2 gap-y-1">
            <Building2 className="w-3 h-3 text-white/25 shrink-0" /> {hackathon.organizer}
            <span className="text-white/20">·</span>
            <CalendarDays className="w-3 h-3 text-white/25 shrink-0" /> {heldLabel}
          </p>
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          {hackathon.projectUrl && (
            <a
              href={hackathon.projectUrl}
              target="_blank"
              rel="noreferrer"
              title="Open project"
              className="w-8 h-8 rounded-lg border border-white/10 flex items-center justify-center text-white/50 hover:text-primary hover:border-primary/40 transition-all cursor-pointer"
            >
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          )}
          <button
            type="button"
            onClick={() => onEdit(hackathon)}
            title={`Edit ${hackathon.name}`}
            className="w-8 h-8 rounded-lg border border-white/10 flex items-center justify-center text-white/40 hover:text-white hover:border-white/30 transition-all cursor-pointer"
          >
            <Pencil className="w-3.5 h-3.5" />
          </button>
          {hasExtras && (
            <button
              type="button"
              onClick={() => setOpen((v) => !v)}
              title="Details"
              aria-expanded={open}
              className="w-8 h-8 rounded-lg border border-white/10 flex items-center justify-center text-white/40 hover:text-white transition-all cursor-pointer"
            >
              <ChevronDown className={`w-3.5 h-3.5 transition-transform ${open ? "rotate-180" : ""}`} />
            </button>
          )}
          <button
            type="button"
            onClick={() => onRemove(hackathon)}
            title={`Remove ${hackathon.name}`}
            className="w-8 h-8 rounded-lg border border-white/10 flex items-center justify-center text-white/40 hover:text-red-400 hover:border-red-400/30 transition-all cursor-pointer"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {open && hasExtras && (
        <div className="px-5 pb-5 pl-[72px] space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {hackathon.role && (
              <div className="rounded-xl border border-white/[0.07] bg-white/[0.02] px-4 py-3">
                <LAStatLabel>Role</LAStatLabel>
                <p className="text-[12px] font-medium text-white/70 mt-1">{hackathon.role}</p>
              </div>
            )}
            {hackathon.teamSize != null && (
              <div className="rounded-xl border border-white/[0.07] bg-white/[0.02] px-4 py-3">
                <LAStatLabel>Team size</LAStatLabel>
                <p className="text-[12px] font-medium text-white/70 mt-1 flex items-center gap-1.5">
                  <Users className="w-3 h-3 text-white/25 shrink-0" />
                  {hackathon.teamSize} {hackathon.teamSize === 1 ? "member" : "members"}
                </p>
              </div>
            )}
            {hackathon.projectName && (
              <div className="rounded-xl border border-white/[0.07] bg-white/[0.02] px-4 py-3">
                <LAStatLabel>Project</LAStatLabel>
                {hackathon.projectUrl ? (
                  <a
                    href={hackathon.projectUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="text-[12px] font-medium text-primary hover:underline mt-1 block truncate"
                  >
                    {hackathon.projectName}
                  </a>
                ) : (
                  <p className="text-[12px] font-medium text-white/70 mt-1 truncate">
                    {hackathon.projectName}
                  </p>
                )}
              </div>
            )}
            {hackathon.result && (
              <div className="rounded-xl border border-white/[0.07] bg-white/[0.02] px-4 py-3">
                <LAStatLabel>Result</LAStatLabel>
                <p className="text-[12px] font-medium text-white/70 mt-1">{hackathon.result}</p>
              </div>
            )}
          </div>

          {hackathon.technologies.length > 0 && (
            <div>
              <LAStatLabel>Technologies used</LAStatLabel>
              <div className="flex flex-wrap gap-2 mt-2">
                {hackathon.technologies.map((tech) => (
                  <span
                    key={tech}
                    className="text-[11px] px-2.5 py-1 rounded-full border border-white/[0.08] bg-white/[0.03] text-white/60"
                  >
                    {tech}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </motion.div>
  );
}

/**
 * Create/edit form. Field names, requiredness and limits mirror the backend
 * zod schema (hackathon.validator.ts): name and organizer required; role,
 * project, result, team size, date and up to 20 technologies optional.
 */
function HackathonForm({
  initial,
  onSubmit,
  onCancel,
}: {
  /** Present when editing — fields are prefilled from the stored record. */
  initial?: Hackathon;
  onSubmit: (input: HackathonInput) => Promise<void>;
  onCancel: () => void;
}) {
  const [name, setName] = useState(initial?.name ?? "");
  const [organizer, setOrganizer] = useState(initial?.organizer ?? "");
  const [role, setRole] = useState(initial?.role ?? "");
  const [projectName, setProjectName] = useState(initial?.projectName ?? "");
  const [projectUrl, setProjectUrl] = useState(initial?.projectUrl ?? "");
  const [result, setResult] = useState(initial?.result ?? "");
  const [teamSize, setTeamSize] = useState(
    initial?.teamSize != null ? String(initial.teamSize) : ""
  );
  // date input wants yyyy-mm-dd
  const [heldAt, setHeldAt] = useState(initial?.heldAt ? initial.heldAt.slice(0, 10) : "");
  const [technologiesText, setTechnologiesText] = useState(
    initial?.technologies?.length ? initial.technologies.join(", ") : ""
  );
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const parsedTechnologies = technologiesText
    .split(",")
    .map((t) => t.trim())
    .filter(Boolean);

  function field(
    id: string,
    value: string,
    onChange: (e: React.ChangeEvent<HTMLInputElement>) => void,
    placeholder: string,
    label: string,
    required?: boolean,
    inputProps: { type?: string; min?: string; max?: string; maxLength?: number } = {}
  ) {
    return (
      <div>
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
          {...inputProps}
          className="w-full rounded-xl border border-white/10 bg-white/[0.03] px-4 py-2.5 text-sm text-white placeholder:text-white/25 outline-none focus:border-white/25"
        />
      </div>
    );
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim() || !organizer.trim()) return;

    if (parsedTechnologies.length > 20) {
      setError("A hackathon can list at most 20 technologies.");
      return;
    }
    if (parsedTechnologies.some((t) => t.length > 60)) {
      setError("Each technology name must be 60 characters or fewer.");
      return;
    }
    if (teamSize.trim()) {
      const n = Number(teamSize);
      if (!Number.isInteger(n) || n < 1 || n > 50) {
        setError("Team size must be a whole number between 1 and 50.");
        return;
      }
    }

    setSaving(true);
    setError(null);
    try {
      const input: HackathonInput = {
        name: name.trim(),
        organizer: organizer.trim(),
        ...(role.trim() ? { role: role.trim() } : {}),
        ...(projectName.trim() ? { projectName: projectName.trim() } : {}),
        ...(projectUrl.trim() ? { projectUrl: projectUrl.trim() } : {}),
        ...(result.trim() ? { result: result.trim() } : {}),
        ...(teamSize.trim() ? { teamSize: Number(teamSize) } : {}),
        ...(heldAt ? { heldAt: new Date(heldAt).toISOString() } : {}),
        ...(parsedTechnologies.length > 0 ? { technologies: parsedTechnologies } : {}),
      };
      await onSubmit(input);
    } catch (err) {
      setError(
        err instanceof ApiError ? err.message : "Could not save the hackathon experience."
      );
      setSaving(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="glass-panel p-5 mb-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {field("hx-name", name, (e) => setName(e.target.value), "e.g. Smart India Hackathon", "Hackathon name *", true, { maxLength: 160 })}
        {field("hx-organizer", organizer, (e) => setOrganizer(e.target.value), "e.g. Government of India", "Organizer *", true, { maxLength: 120 })}
        {field("hx-role", role, (e) => setRole(e.target.value), "Optional — e.g. Team lead", "Your role", false, { maxLength: 80 })}
        {field("hx-result", result, (e) => setResult(e.target.value), "Optional — e.g. Finalist, Winner", "Result", false, { maxLength: 80 })}
        {field("hx-project-name", projectName, (e) => setProjectName(e.target.value), "Optional", "Project name", false, { maxLength: 160 })}
        {field("hx-project-url", projectUrl, (e) => setProjectUrl(e.target.value), "https://…", "Project URL", false, { type: "url", maxLength: 500 })}
        {field("hx-team-size", teamSize, (e) => setTeamSize(e.target.value), "e.g. 4", "Team size", false, { type: "number", min: "1", max: "50" })}
        <div>
          <label htmlFor="hx-held-at" className="block text-[11px] uppercase tracking-widest text-white/40 mb-2 opacity-60">
            Date held
          </label>
          <input
            id="hx-held-at"
            type="date"
            value={heldAt}
            onChange={(e) => setHeldAt(e.target.value)}
            className="w-full rounded-xl border border-white/10 bg-white/[0.03] px-4 py-2.5 text-sm text-white placeholder:text-white/25 outline-none focus:border-white/25"
          />
        </div>
        <div className="sm:col-span-2">
          <label htmlFor="hx-technologies" className="block text-[11px] uppercase tracking-widest text-white/40 mb-2 opacity-60">
            Technologies used (comma-separated)
          </label>
          <input
            id="hx-technologies"
            value={technologiesText}
            onChange={(e) => setTechnologiesText(e.target.value)}
            placeholder="React, Node.js, PostgreSQL"
            className="w-full rounded-xl border border-white/10 bg-white/[0.03] px-4 py-2.5 text-sm text-white placeholder:text-white/25 outline-none focus:border-white/25"
          />
          <p className="text-[10px] text-white/25 mt-1.5">
            Up to 20 names, 60 characters each. New names are recorded as claimed skills — a
            hackathon never raises a skill's evidence level.
          </p>
        </div>
      </div>

      {error && <p className="text-[12px] text-red-300 mt-3">{error}</p>}

      <div className="flex items-center gap-3 mt-4">
        <button
          type="submit"
          disabled={saving || !name.trim() || !organizer.trim()}
          className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-widest px-5 py-2.5 rounded-full transition-all cursor-pointer disabled:opacity-40"
          style={{ backgroundColor: "hsl(var(--primary))", color: "hsl(var(--primary-foreground))" }}
        >
          {saving && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
          {saving ? "Saving…" : initial ? "Save hackathon" : "Add hackathon"}
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="text-xs font-bold uppercase tracking-widest px-5 py-2.5 rounded-full border border-white/10 bg-white/[0.04] text-white/70 hover:bg-white/[0.08] transition-all cursor-pointer"
        >
          Cancel
        </button>
        <p className="text-[11px] text-white/30 ml-auto hidden sm:block">
          {initial
            ? "Updating via PATCH /hackathons — the stored record is the source of truth."
            : "Submitted to /hackathons — stored as your own account of the event."}
        </p>
      </div>
    </form>
  );
}
