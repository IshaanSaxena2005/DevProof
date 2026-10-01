import { useState } from "react";
import { motion } from "motion/react";
import { Award, ExternalLink, Loader2, Plus, Trash2, Fingerprint, CalendarDays, Building2, ChevronDown } from "lucide-react";
import { LAStatLabel } from "./shared";
import type { Certification, CertificationInput } from "../../../lib/types";

/** ISO -> "Aug 2026"; null renders an em-dash. */
function formatMonth(iso: string | null) {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString(undefined, { month: "short", year: "numeric" });
}

/**
 * A recorded credential. Verification is not part of the certification API, so
 * the strongest claim this card can make is "Credential added" — never
 * "Verified", which would fabricate a trust signal the backend cannot back.
 */
export function CertificationCard({
  cert,
  index,
  onRemove,
}: {
  cert: Certification;
  index: number;
  onRemove: (c: Certification) => void;
}) {
  const [open, setOpen] = useState(false);
  const hasExtras = Boolean(cert.credentialId || cert.credentialUrl || cert.issueDate);

  return (
    <motion.div
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.05 * index, duration: 0.4 }}
      className="glass-panel overflow-hidden relative"
    >
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/[0.10] to-transparent pointer-events-none" />

      <div className="p-5 flex items-start gap-4">
        <div className="w-10 h-10 rounded-xl border border-violet-400/25 bg-violet-400/10 flex items-center justify-center text-violet-300 shrink-0">
          <Award className="w-5 h-5" />
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="text-sm font-bold text-white leading-tight">{cert.name}</h3>
            <span className="inline-flex items-center gap-1 text-[9px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-full border border-white/12 bg-white/[0.04] text-white/50">
              Credential added
            </span>
          </div>
          <p className="text-[12px] text-white/45 mt-1 flex items-center gap-1.5">
            <Building2 className="w-3 h-3 text-white/25" /> {cert.issuer}
            <span className="text-white/20">·</span>
            <CalendarDays className="w-3 h-3 text-white/25" /> Issued {formatMonth(cert.issueDate)}
          </p>
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          {cert.credentialUrl && (
            <a
              href={cert.credentialUrl}
              target="_blank"
              rel="noreferrer"
              title="Open credential"
              className="w-8 h-8 rounded-lg border border-white/10 flex items-center justify-center text-white/50 hover:text-primary hover:border-primary/40 transition-all cursor-pointer"
            >
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          )}
          {hasExtras && (
            <button
              onClick={() => setOpen((v) => !v)}
              title="Details"
              className="w-8 h-8 rounded-lg border border-white/10 flex items-center justify-center text-white/40 hover:text-white transition-all cursor-pointer"
            >
              <ChevronDown className={`w-3.5 h-3.5 transition-transform ${open ? "rotate-180" : ""}`} />
            </button>
          )}
          <button
            onClick={() => onRemove(cert)}
            title={`Remove ${cert.name}`}
            className="w-8 h-8 rounded-lg border border-white/10 flex items-center justify-center text-white/40 hover:text-red-400 hover:border-red-400/30 transition-all cursor-pointer"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {open && (
        <div className="px-5 pb-5 pl-[72px] grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="rounded-xl border border-white/[0.07] bg-white/[0.02] px-4 py-3">
            <LAStatLabel>Credential ID</LAStatLabel>
            <p className="text-[12px] font-medium text-white/70 mt-1 flex items-center gap-1.5 truncate">
              <Fingerprint className="w-3 h-3 text-white/25 shrink-0" />
              {cert.credentialId ?? "Not provided"}
            </p>
          </div>
          <div className="rounded-xl border border-white/[0.07] bg-white/[0.02] px-4 py-3">
            <LAStatLabel>Credential Link</LAStatLabel>
            {cert.credentialUrl ? (
              <a
                href={cert.credentialUrl}
                target="_blank"
                rel="noreferrer"
                className="text-[12px] font-medium text-primary hover:underline mt-1 block truncate"
              >
                {cert.credentialUrl}
              </a>
            ) : (
              <p className="text-[12px] text-white/35 mt-1">Not provided</p>
            )}
          </div>
        </div>
      )}
    </motion.div>
  );
}

/** Empty state for the certifications list itself. */
export function CertificationsEmpty({ onAdd }: { onAdd: () => void }) {
  return (
    <div className="flex flex-col items-center gap-3 py-10 text-center">
      <div className="w-11 h-11 rounded-2xl border border-white/10 bg-white/[0.03] flex items-center justify-center text-white/40">
        <Award className="w-5 h-5" />
      </div>
      <h3 className="text-sm font-bold text-white uppercase tracking-wider">No certifications recorded</h3>
      <p className="text-[12px] max-w-md leading-relaxed" style={{ color: "var(--text-secondary)" }}>
        Add the credentials you have earned — issuer, credential ID, and link turn each one into
        profile evidence.
      </p>
      <button
        onClick={onAdd}
        className="mt-1 text-xs font-bold uppercase tracking-widest px-5 py-2.5 rounded-full border border-primary/30 bg-primary/10 text-primary hover:bg-primary/20 hover:border-primary/50 transition-all cursor-pointer hover:-translate-y-0.5"
      >
        Add certification
      </button>
    </div>
  );
}

/** Add/edit form. Mirrors Skills.tsx's inline-add form anatomy. */
export function CertificationForm({
  initial,
  onSubmit,
  onCancel,
  submitLabel,
}: {
  initial?: Certification;
  onSubmit: (input: CertificationInput) => Promise<void>;
  onCancel: () => void;
  submitLabel: string;
}) {
  const [name, setName] = useState(initial?.name ?? "");
  const [issuer, setIssuer] = useState(initial?.issuer ?? "");
  const [credentialId, setCredentialId] = useState(initial?.credentialId ?? "");
  const [credentialUrl, setCredentialUrl] = useState(initial?.credentialUrl ?? "");
  // date input wants yyyy-mm-dd
  const [issueDate, setIssueDate] = useState(initial?.issueDate ? initial.issueDate.slice(0, 10) : "");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim() || !issuer.trim()) return;
    setSaving(true);
    setError(null);
    try {
      await onSubmit({
        name: name.trim(),
        issuer: issuer.trim(),
        ...(credentialId.trim() ? { credentialId: credentialId.trim() } : {}),
        ...(credentialUrl.trim() ? { credentialUrl: credentialUrl.trim() } : {}),
        ...(issueDate ? { issueDate: new Date(issueDate).toISOString() } : {}),
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not save the certification.");
      setSaving(false);
    }
  }

  const field =
    "w-full rounded-xl border border-white/10 bg-white/[0.03] px-4 py-2.5 text-sm text-white placeholder:text-white/25 outline-none focus:border-white/25";

  return (
    <form onSubmit={handleSubmit} className="glass-panel p-5 mb-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <label htmlFor="cert-name" className="block text-[11px] uppercase tracking-widest text-white/40 mb-2">Certification name *</label>
          <input id="cert-name" value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. AWS Solutions Architect" className={field} />
        </div>
        <div>
          <label htmlFor="cert-issuer" className="block text-[11px] uppercase tracking-widest text-white/40 mb-2">Issuing organization *</label>
          <input id="cert-issuer" value={issuer} onChange={(e) => setIssuer(e.target.value)} placeholder="e.g. Amazon Web Services" className={field} />
        </div>
        <div>
          <label htmlFor="cert-credential-id" className="block text-[11px] uppercase tracking-widest text-white/40 mb-2">Credential ID</label>
          <input id="cert-credential-id" value={credentialId} onChange={(e) => setCredentialId(e.target.value)} placeholder="Optional" className={field} />
        </div>
        <div>
          <label htmlFor="cert-credential-url" className="block text-[11px] uppercase tracking-widest text-white/40 mb-2">Credential URL</label>
          <input id="cert-credential-url" type="url" value={credentialUrl} onChange={(e) => setCredentialUrl(e.target.value)} placeholder="https://…" className={field} />
        </div>
        <div>
          <label htmlFor="cert-issue-date" className="block text-[11px] uppercase tracking-widest text-white/40 mb-2">Issue date</label>
          <input id="cert-issue-date" type="date" value={issueDate} onChange={(e) => setIssueDate(e.target.value)} className={field} />
        </div>
      </div>

      {error && <p className="text-[12px] text-red-300 mt-3">{error}</p>}

      <div className="flex items-center gap-3 mt-4">
        <button
          type="submit"
          disabled={saving || !name.trim() || !issuer.trim()}
          className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-widest px-5 py-2.5 rounded-full transition-all cursor-pointer disabled:opacity-40"
          style={{ backgroundColor: "hsl(var(--primary))", color: "hsl(var(--primary-foreground))" }}
        >
          {saving && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
          {saving ? "Saving…" : submitLabel}
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="text-xs font-bold uppercase tracking-widest px-5 py-2.5 rounded-full border border-white/10 bg-white/[0.04] text-white/70 hover:bg-white/[0.08] transition-all cursor-pointer"
        >
          Cancel
        </button>
        <p className="text-[11px] text-white/30 ml-auto hidden sm:block">Recorded as credential evidence — verification coming later.</p>
      </div>
    </form>
  );
}

/** Small helper for the section header's add button. */
export function AddCertificationButton({ onClick, open }: { onClick: () => void; open: boolean }) {
  return (
    <button
      onClick={onClick}
      className={`inline-flex items-center gap-2 text-xs font-bold uppercase tracking-widest px-4 py-2 rounded-full border transition-all cursor-pointer ${
        open
          ? "border-white/20 bg-white/[0.06] text-white/80"
          : "border-primary/30 bg-primary/10 text-primary hover:bg-primary/20 hover:border-primary/50"
      }`}
    >
      <Plus className="w-3.5 h-3.5" />
      {open ? "Close" : "Add certification"}
    </button>
  );
}
