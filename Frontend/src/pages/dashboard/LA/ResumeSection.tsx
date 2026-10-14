import { useRef, useState } from "react";
import { useResource } from "../../../lib/useResource";
import { ApiError } from "../../../lib/api";
import { resumeService } from "../../../services/resume";
import GlassCard from "../../../components/GlassCard";
import { LAStatLabel } from "./shared";
import { ResumeGlyph } from "../PP/icons";
import type { ResumeSummary } from "../../../lib/types";

/**
 * Resume management, relocated from the Professional Profile page.
 *
 * Reuses the existing /resume backend (GET/POST/DELETE + download) through
 * resumeService — no second implementation. Detected technologies are
 * labelled "mentioned in your resume": the backend reports them, it never
 * records them, and the wording keeps that visible.
 */
export default function ResumeSection() {
  const { data, loading, reload } = useResource(() => resumeService.get(), []);
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
        <ResumeCard resume={resume} uploading={uploading} onReplace={() => fileInput.current?.click()} onRemove={remove} />
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
              <h3 className="text-base font-bold text-white tracking-tight">Resume</h3>
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

/** Uploaded state: file facts, parse status, and only what parsing returned. */
function ResumeCard({
  resume,
  uploading,
  onReplace,
  onRemove,
}: {
  resume: ResumeSummary;
  uploading: boolean;
  onReplace: () => void;
  onRemove: () => void;
}) {
  const sections = Object.keys(resume.parsed?.sections ?? {});
  const detected = resume.parsed?.detectedSkills ?? [];

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
            <h3 className="text-base font-bold text-white tracking-tight">{resume.fileName}</h3>
            <span className="inline-flex items-center gap-1.5 text-[9px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-full border border-primary/25 bg-primary/10 text-primary">
              <span className="w-1.5 h-1.5 rounded-full bg-primary" />
              Uploaded
            </span>
          </div>
          <p className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] mt-1" style={{ color: "var(--text-tertiary)" }}>
            {resume.pageCount !== null && <span>{resume.pageCount} page{resume.pageCount === 1 ? "" : "s"}</span>}
            <span>{Math.max(1, Math.round(resume.fileSize / 1024))} KB</span>
            <span>Uploaded {new Date(resume.uploadedAt).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" })}</span>
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
          </p>

          {/* Parse status and results — only what the backend actually returned. */}
          {resume.parseError ? (
            <p className="text-[11px] text-amber-200/80 mt-4 leading-relaxed">
              {resume.parseError} The file is kept and can be downloaded, but nothing was extracted
              from it — scanned resumes have no text layer to read.
            </p>
          ) : sections.length === 0 ? (
            <p className="text-[11px] mt-4" style={{ color: "var(--text-tertiary)" }}>
              No recognised heading was found in this file, so nothing was read from it yet.
            </p>
          ) : (
            <div className="flex flex-col gap-4 mt-4">
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
              {detected.length > 0 && (
                <div>
                  <LAStatLabel>Technologies mentioned</LAStatLabel>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {detected.map((s) => (
                      <span key={s} className="text-[11px] px-2.5 py-1 rounded-full border border-white/[0.08] bg-white/[0.03] text-white/60">
                        {s}
                      </span>
                    ))}
                  </div>
                  <p className="text-[11px] text-white/30 mt-2.5 leading-relaxed">
                    These are names found in your resume text, not skills DevProof has recorded. Add
                    them on the Skills page to turn them into recorded evidence.
                  </p>
                </div>
              )}
            </div>
          )}
        </div>

        <button
          onClick={onReplace}
          disabled={uploading}
          className="shrink-0 text-xs font-bold uppercase tracking-widest px-5 py-3 rounded-full border border-violet-400/30 bg-violet-400/10 text-violet-300 hover:bg-violet-400/20 hover:border-violet-400/50 transition-all cursor-pointer hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-wait"
        >
          {uploading ? "Uploading…" : "Replace resume"}
        </button>
      </div>
    </GlassCard>
  );
}
