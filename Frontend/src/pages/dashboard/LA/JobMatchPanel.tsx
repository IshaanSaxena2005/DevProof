import { useState } from "react";
import { CheckCircle2, CircleDashed, Loader2, X } from "lucide-react";
import { ApiError } from "../../../lib/api.mts";
import { resumeService } from "../../../services/resume";
import type {
  JobMatchResult,
  JobRequirement,
} from "../../../lib/types";

/** Bounds mirrored from the backend validator so the obvious failures are
 * caught here too — the server still validates every submission. */
const MIN_LENGTH = 40;
const MAX_LENGTH = 20000;

/**
 * Transient job-description comparison against the stored resume.
 *
 * The posting is pasted, compared once by POST /resume/match, and held only
 * in this component's state — nothing is persisted on either side, and the
 * panel itself disappears on refresh. Rendering happens only in an
 * authenticated session (never in demo mode), because the endpoint compares
 * against the caller's own resume and 404s without one.
 */
export default function JobMatchPanel() {
  const [text, setText] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<JobMatchResult | null>(null);

  const trimmed = text.trim();
  const tooShort = trimmed.length > 0 && trimmed.length < MIN_LENGTH;
  const tooLong = trimmed.length > MAX_LENGTH;
  const canSubmit = trimmed.length >= MIN_LENGTH && !tooLong && !submitting;

  async function compare(event: React.FormEvent) {
    event.preventDefault();
    // Double-submit guard: the disabled button covers clicks, this covers
    // Enter pressed twice or a stale state during the request.
    if (!canSubmit) return;
    setSubmitting(true);
    setError(null);
    setResult(null);
    try {
      const response = await resumeService.match(trimmed);
      setResult(response.match);
    } catch (err) {
      const fieldDetail =
        err instanceof ApiError ? err.fieldError("jobDescription") : undefined;
      setError(
        fieldDetail ??
          (err instanceof ApiError ? err.message : "Could not compare that job description.")
      );
    } finally {
      setSubmitting(false);
    }
  }

  function reset() {
    setText("");
    setResult(null);
    setError(null);
  }

  return (
    <form onSubmit={compare} className="mt-6" noValidate>
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h3 className="text-[12px] font-bold uppercase tracking-[0.18em] text-white/35 mb-3">
          Job description match
        </h3>
        {(result || text) && (
          <button
            type="button"
            onClick={reset}
            className="text-[10px] uppercase tracking-widest text-white/35 hover:text-white/70 underline underline-offset-2 cursor-pointer mb-3 inline-flex items-center gap-1"
          >
            <X className="w-3 h-3" aria-hidden="true" />
            Clear
          </button>
        )}
      </div>

      <label htmlFor="job-match-input" className="block text-[11px] uppercase tracking-widest text-white/40 mb-2">
        Paste a job posting
      </label>
      <textarea
        id="job-match-input"
        value={text}
        onChange={(e) => setText(e.target.value)}
        rows={6}
        maxLength={MAX_LENGTH + 1}
        placeholder="Paste the requirements section of a job posting — the skills, experience and qualifications it asks for…"
        aria-describedby="job-match-hint"
        className="w-full rounded-xl border border-white/10 bg-white/[0.03] px-3.5 py-2.5 text-sm text-white placeholder:text-white/25 outline-none focus:border-white/25 resize-y"
      />
      <div className="flex flex-wrap items-center justify-between gap-3 mt-2">
        <p id="job-match-hint" className="text-[11px] text-white/35">
          {tooLong
            ? `${trimmed.length.toLocaleString()} characters — the limit is ${MAX_LENGTH.toLocaleString()}.`
            : tooShort
              ? `${trimmed.length} of ${MIN_LENGTH} minimum characters.`
              : trimmed.length > 0
                ? `${trimmed.length.toLocaleString()} characters — compared in this request only, never stored.`
                : `At least ${MIN_LENGTH} characters. The posting is compared and discarded, never saved.`}
        </p>
        <button
          type="submit"
          disabled={!canSubmit}
          className="text-xs font-bold uppercase tracking-widest px-5 py-2.5 rounded-full border border-violet-400/30 bg-violet-400/10 text-violet-300 hover:bg-violet-400/20 hover:border-violet-400/50 transition-all cursor-pointer hover:-translate-y-0.5 disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:translate-y-0 inline-flex items-center gap-2"
        >
          {submitting && <Loader2 className="w-3 h-3 animate-spin" aria-hidden="true" />}
          {submitting ? "Comparing…" : "Compare"}
        </button>
      </div>

      <p role="alert" aria-live="polite" className="text-[12px] text-red-300 mt-2">
        {error ?? ""}
      </p>

      {result && <MatchResult result={result} />}
    </form>
  );
}

function MatchResult({ result }: { result: JobMatchResult }) {
  const { score, matched, notEvidenced, sectionsToImprove, tailoring, detected, note } = result;

  const signals: string[] = [];
  if (detected.requiredSkills > 0) signals.push(`${detected.requiredSkills} required skills`);
  if (detected.preferredSkills > 0) signals.push(`${detected.preferredSkills} preferred skills`);
  if (detected.concepts > 0) signals.push(`${detected.concepts} concepts`);
  if (detected.experienceYears != null) {
    signals.push(`${detected.experienceYears} yr${detected.experienceYears === 1 ? "" : "s"} experience stated`);
  }
  if (detected.educationRequired) signals.push("education required");
  if (detected.certificationMentioned) signals.push("certification mentioned");

  return (
    <div className="mt-5 pt-5 border-t border-white/[0.07]" aria-live="polite">
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
        <h4 className="text-[13px] font-bold text-white tracking-tight">Match result</h4>
        <span className="text-[9px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-full border border-primary/25 bg-primary/10 text-primary">
          Deterministic · v{result.methodologyVersion}
        </span>
        <span className="text-[11px] text-white/40">
          {new Date(result.matchedAt).toLocaleTimeString(undefined, {
            hour: "2-digit",
            minute: "2-digit",
          })}
        </span>
      </div>

      {/* Score — a null overall is stated, never rendered as zero. */}
      <div className="mt-4 grid grid-cols-1 md:grid-cols-[auto_1fr] gap-6 items-start">
        <div className="min-w-[10rem]">
          <p className="text-[10px] font-bold uppercase tracking-widest text-white/35">
            Match score
          </p>
          {score.overall === null ? (
            <p className="text-xl font-bold text-white/60 mt-1">Not scored</p>
          ) : (
            <p className="text-3xl font-bold text-white tabular-nums mt-1">
              {score.overall}
              <span className="text-sm font-normal text-white/40"> / 100</span>
            </p>
          )}
          <p className="text-[11px] text-white/45 mt-1.5 leading-relaxed max-w-[16rem]">
            {score.basis}
          </p>
        </div>

        <div>
          <ul className="space-y-3">
            {score.parts.map((part) => (
              <li key={part.label}>
                <div className="flex items-baseline justify-between gap-3">
                  <span className="text-[12px] text-white/75">{part.label}</span>
                  <span className="text-[11px] tabular-nums text-white/45 shrink-0">
                    {part.score === null ? (
                      <span className="text-white/30">excluded</span>
                    ) : (
                      <>
                        <span className="text-white/85 font-bold">{part.score}</span>
                        <span className="text-white/30"> / {part.weight} pts</span>
                      </>
                    )}
                  </span>
                </div>
                <div className="h-1.5 mt-1.5 rounded-full bg-white/[0.06] overflow-hidden">
                  {part.score !== null && (
                    <div
                      className="h-full rounded-full"
                      style={{
                        width: `${part.score}%`,
                        backgroundColor: part.score >= 60 ? "hsl(var(--primary))" : "#fbbf24",
                      }}
                    />
                  )}
                </div>
                <p className="text-[11px] text-white/40 mt-1 leading-relaxed">{part.summary}</p>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {signals.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mt-4">
          {signals.map((s) => (
            <span
              key={s}
              className="text-[10px] uppercase tracking-wider px-2 py-0.5 rounded-full border border-white/10 bg-white/[0.03] text-white/50"
            >
              {s}
            </span>
          ))}
        </div>
      )}

      {/* Matched requirements */}
      <div className="mt-6">
        <h5 className="text-[12px] font-bold uppercase tracking-[0.18em] text-white/35 mb-3">
          Evidenced in your resume
        </h5>
        {matched.length === 0 ? (
          <p className="text-[12px] text-white/45 leading-relaxed">
            No requirement from this posting is stated in your resume as written.
          </p>
        ) : (
          <ul className="space-y-2.5">
            {matched.map((req) => (
              <RequirementRow key={`${req.kind}:${req.label}`} req={req} matched />
            ))}
          </ul>
        )}
      </div>

      {/* Not evidenced — never phrased as a capability the candidate lacks. */}
      <div className="mt-6">
        <h5 className="text-[12px] font-bold uppercase tracking-[0.18em] text-white/35 mb-3">
          Not stated in your resume
        </h5>
        {notEvidenced.length === 0 ? (
          <p className="text-[12px] text-white/45">
            Every requirement the posting states is evidenced in your resume.
          </p>
        ) : (
          <>
            <p className="text-[11px] text-white/40 leading-relaxed mb-3">
              These are things this document does not say — not capabilities you lack. If they are
              true of you, the tailoring suggestions below show where to state them.
            </p>
            <ul className="space-y-2.5">
              {notEvidenced.map((req) => (
                <RequirementRow key={`${req.kind}:${req.label}`} req={req} />
              ))}
            </ul>
          </>
        )}
      </div>

      {/* Sections to improve + tailoring moves */}
      {(sectionsToImprove.length > 0 || tailoring.length > 0) && (
        <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
          {sectionsToImprove.length > 0 && (
            <div>
              <h5 className="text-[12px] font-bold uppercase tracking-[0.18em] text-white/35 mb-3">
                Sections to improve
              </h5>
              <ul className="space-y-2">
                {sectionsToImprove.map((s) => (
                  <li key={s.section} className="text-[12px] leading-relaxed">
                    <span className="font-semibold text-white/85 capitalize">{s.section}</span>
                    <span className="text-white/50"> — {s.reason}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
          {tailoring.length > 0 && (
            <div>
              <h5 className="text-[12px] font-bold uppercase tracking-[0.18em] text-white/35 mb-3">
                Tailoring moves
              </h5>
              <ul className="space-y-2">
                {tailoring.map((t, i) => (
                  <li key={i} className="text-[12px] text-white/60 leading-relaxed flex gap-2">
                    <span className="mt-[7px] w-1 h-1 rounded-full shrink-0 bg-primary/60" />
                    {t}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      <p className="text-[11px] text-white/35 italic mt-5 leading-relaxed">{note}</p>
    </div>
  );
}

function RequirementRow({ req, matched = false }: { req: JobRequirement; matched?: boolean }) {
  const Icon = matched ? CheckCircle2 : CircleDashed;
  return (
    <li
      className={`rounded-xl border px-4 py-2.5 ${
        matched ? "border-primary/20 bg-primary/[0.04]" : "border-white/[0.07] bg-white/[0.02]"
      }`}
    >
      <div className="flex flex-wrap items-center gap-2">
        <Icon
          className={`w-3.5 h-3.5 shrink-0 ${matched ? "text-primary" : "text-white/35"}`}
          aria-hidden="true"
        />
        <span className="text-[13px] font-semibold text-white/85">{req.label}</span>
        <span className="text-[9px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-full border border-white/12 bg-white/[0.04] text-white/50">
          {req.source}
        </span>
        <span className="text-[9px] uppercase tracking-widest text-white/35">{req.kind}</span>
      </div>

      <div className="flex flex-wrap gap-1.5 mt-1.5 ml-5">
        {req.sections.map((s) => (
          <span
            key={s}
            className="text-[10px] uppercase tracking-wider px-1.5 py-0.5 rounded border border-white/10 text-white/45"
          >
            {s.replace("_", " ")}
          </span>
        ))}
      </div>

      {matched && req.evidence.length > 0 && (
        <ul className="mt-1.5 ml-5 space-y-1">
          {req.evidence.map((e, i) => (
            <li key={i} className="text-[11px] text-white/40 italic leading-relaxed">
              “{e}”
            </li>
          ))}
        </ul>
      )}

      {!matched && req.related.length > 0 && (
        <p className="text-[11px] text-white/35 mt-1.5 ml-5 leading-relaxed">
          Related terms your resume does mention:{" "}
          <span className="text-white/55">{req.related.join(", ")}</span> — context only, never
          counted as a match.
        </p>
      )}
    </li>
  );
}
