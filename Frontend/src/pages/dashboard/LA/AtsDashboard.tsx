import {
  AlertTriangle,
  CheckCircle2,
  Lightbulb,
  MinusCircle,
  Sparkles,
  ThumbsUp,
  XCircle,
} from "lucide-react";
import type {
  AtsAnalysis,
  AtsCategoryScore,
  AtsCheck,
  AtsCheckStatus,
  AtsRecommendation,
  AtsStrength,
  AtsWeakness,
  KeywordSection,
} from "../../../lib/types";

/**
 * ATS Resume Intelligence — the actionable half of the resume feature.
 *
 * Everything rendered here is what the deterministic backend engine produced
 * over this user's own document (parsed.ats): no client-side scoring, no
 * placeholder numbers, and excluded categories render as "not graded" rather
 * than as zeroes. Records parsed before the feature existed fall through to an
 * honest absent state that names how to gain the analysis.
 */
export default function AtsDashboard({
  ats,
  readOnly = false,
}: {
  ats: AtsAnalysis | null;
  /** Demo mode: the sample document has no ATS analysis and cannot gain one. */
  readOnly?: boolean;
}) {
  if (!ats) {
    return (
      <div className="mt-5 border-t border-white/[0.07] pt-5">
        <h2 className="text-base font-bold text-white tracking-tight">ATS Resume Intelligence</h2>
        <p className="text-[12px] text-white/45 mt-1.5 leading-relaxed max-w-2xl">
          {readOnly
            ? "The sample document carries no ATS analysis — the score is computed from your own uploaded resume, never faked for the demo."
            : "This resume was uploaded before ATS analysis existed. Run Re-analyse above to compute it from the stored file — no re-upload needed, and nothing is written to your skills or certifications."}
        </p>
      </div>
    );
  }

  const { score, sectionChecks, formattingChecks, keywords, strengths, weaknesses, recommendations } = ats;

  return (
    <div className="mt-5 border-t border-white/[0.07] pt-5">
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
        <h2 className="text-base font-bold text-white tracking-tight">ATS Resume Intelligence</h2>
        <span className="text-[9px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-full border border-primary/25 bg-primary/10 text-primary">
          Deterministic · v{ats.methodologyVersion}
        </span>
      </div>
      <p className="text-[12px] text-white/40 mt-1">
        Analysed{" "}
        {new Date(ats.analysedAt).toLocaleDateString(undefined, {
          month: "short",
          day: "numeric",
          year: "numeric",
        })}{" "}
        from your uploaded document.
      </p>

      {/* ── Score: the number, how it was built, and what went into it ── */}
      <div className="mt-5 grid grid-cols-1 md:grid-cols-[auto_1fr] gap-6 items-start">
        <div className="flex items-center gap-5">
          <ScoreRing overall={score.overall} />
          <div className="min-w-0">
            <ScoreLabel>Overall ATS score</ScoreLabel>
            <p className="text-[11px] text-white/45 mt-1.5 leading-relaxed max-w-[16rem]">
              {score.basis}
            </p>
          </div>
        </div>

        <div>
          <SubHeading>Score breakdown</SubHeading>
          <ul className="space-y-3">
            {score.categories.map((category) => (
              <CategoryBar key={category.id} category={category} />
            ))}
          </ul>
        </div>
      </div>

      {/* ── Recommendations: what to change, in the order that matters ── */}
      <div className="mt-7">
        <SubHeading>Prioritised recommendations</SubHeading>
        {recommendations.length === 0 ? (
          <p className="text-[12px] text-white/45 leading-relaxed">
            Nothing was flagged for change — the checks below explain what passed.
          </p>
        ) : (
          <ol className="space-y-3">
            {recommendations.map((rec, i) => (
              <RecommendationCard key={rec.id} rec={rec} index={i} />
            ))}
          </ol>
        )}
      </div>

      {/* ── Evidence-grounded findings ── */}
      <div className="mt-7 grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
        <div>
          <SubHeading>Strengths</SubHeading>
          {strengths.length === 0 ? (
            <p className="text-[12px] text-white/45 leading-relaxed">
              No strength could be evidenced from this document yet.
            </p>
          ) : (
            <ul className="space-y-3">
              {strengths.map((s) => (
                <StrengthCard key={s.id} strength={s} />
              ))}
            </ul>
          )}
        </div>
        <div>
          <SubHeading>Weaknesses</SubHeading>
          {weaknesses.length === 0 ? (
            <p className="text-[12px] text-white/45 leading-relaxed">
              No weakness was detected in this document.
            </p>
          ) : (
            <ul className="space-y-3">
              {weaknesses.map((w) => (
                <WeaknessCard key={w.id} weakness={w} />
              ))}
            </ul>
          )}
        </div>
      </div>

      {/* ── Keyword intelligence ── */}
      <div className="mt-7">
        <SubHeading>Keyword intelligence</SubHeading>
        {keywords.distinctCount === 0 ? (
          <p className="text-[12px] text-white/45 leading-relaxed">
            No recognised technology or concept was found in this resume, so no keyword profile
            could be built.
          </p>
        ) : (
          <>
            <p className="text-[12px] text-white/45 leading-relaxed">
              {keywords.distinctCount} distinct term{keywords.distinctCount === 1 ? "" : "s"} read
              from your resume text — claims from the document, not verified skills.{" "}
              <Sparkles className="w-3 h-3 inline -mt-0.5 text-primary/70" aria-hidden="true" />
            </p>
            <div className="flex flex-wrap gap-1.5 mt-3">
              {[...keywords.keywords]
                .sort((a, b) => b.count - a.count || a.term.localeCompare(b.term))
                .map((kw) => (
                  <span
                    key={`${kw.source}:${kw.term}`}
                    title={`${kw.category} · found in ${kw.sections
                      .map((s) => s.replace("_", " "))
                      .join(", ")}${kw.count > 1 ? ` · ×${kw.count}` : ""}`}
                    className={`text-[11px] px-2.5 py-1 rounded-full border ${
                      kw.source === "taxonomy"
                        ? "border-primary/25 bg-primary/[0.06] text-primary/90"
                        : "border-dashed border-white/15 bg-white/[0.03] text-white/55"
                    }`}
                  >
                    {kw.term}
                    {kw.count > 1 && (
                      <span className="ml-1.5 text-[10px] opacity-70">×{kw.count}</span>
                    )}
                  </span>
                ))}
            </div>
            <div className="flex flex-wrap gap-x-3 gap-y-1 mt-3">
              {(Object.entries(keywords.sectionCounts) as [KeywordSection, number][])
                .filter(([, count]) => count > 0)
                .map(([section, count]) => (
                  <span key={section} className="text-[10px] uppercase tracking-wider text-white/35">
                    {section.replace("_", " ")} <span className="text-white/55">{count}</span>
                  </span>
                ))}
            </div>
          </>
        )}
      </div>

      {/* ── Checks: what needs attention first, what passed second ── */}
      <div className="mt-7">
        <SubHeading>Section checks</SubHeading>
        <CheckList checks={sectionChecks} />
      </div>
      <div className="mt-6">
        <SubHeading>Formatting checks</SubHeading>
        <CheckList checks={formattingChecks} />
      </div>
    </div>
  );
}

/** Sub-section heading inside the dashboard — an h3 under the card's h2s. */
function SubHeading({ children }: { children: React.ReactNode }) {
  return (
    <h3 className="text-[12px] font-bold uppercase tracking-[0.18em] text-white/35 mb-3">
      {children}
    </h3>
  );
}

/** Micro-label matching the page's LAStatLabel treatment. */
function ScoreLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-[10px] font-bold uppercase tracking-widest text-white/35">{children}</p>
  );
}

/** Score colour bands — shared by the ring and every bar. */
function bandColor(score: number): string {
  if (score >= 80) return "hsl(var(--primary))";
  if (score >= 60) return "#fbbf24";
  return "#f87171";
}

function bandLabel(score: number): string {
  if (score >= 80) return "strong";
  if (score >= 60) return "room to improve";
  return "needs work";
}

/** The overall number as a progress ring; the text beside it carries the
 * accessible meaning, so the SVG itself stays decorative. */
function ScoreRing({ overall }: { overall: number }) {
  const r = 52;
  const circumference = 2 * Math.PI * r;
  const filled = (Math.max(0, Math.min(100, overall)) / 100) * circumference;
  const color = bandColor(overall);

  return (
    <div className="relative w-28 h-28 shrink-0">
      <svg viewBox="0 0 120 120" className="w-28 h-28 -rotate-90" aria-hidden="true">
        <circle cx="60" cy="60" r={r} fill="none" stroke="rgba(255,255,255,0.07)" strokeWidth="9" />
        <circle
          cx="60"
          cy="60"
          r={r}
          fill="none"
          stroke={color}
          strokeWidth="9"
          strokeLinecap="round"
          strokeDasharray={`${filled} ${circumference}`}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-3xl font-bold text-white tabular-nums leading-none">{overall}</span>
        <span className="text-[10px] uppercase tracking-widest text-white/40 mt-1">/ 100</span>
      </div>
      <span className="sr-only">
        Overall ATS score {overall} out of 100 — {bandLabel(overall)}
      </span>
    </div>
  );
}

/** One weighted category: label, bar, and the server's explanation. Null
 * scores are excluded from the total and must render as "not graded". */
function CategoryBar({ category }: { category: AtsCategoryScore }) {
  const excluded = category.score === null;
  const value = excluded ? 0 : (category.score as number);

  return (
    <li>
      <div className="flex items-baseline justify-between gap-3">
        <span className="text-[12px] font-semibold text-white/80">{category.label}</span>
        <span className="text-[11px] tabular-nums text-white/45 shrink-0">
          {excluded ? (
            <span className="text-white/30">not graded · excluded</span>
          ) : (
            <>
              <span className="text-white/85 font-bold">{value}</span>
              <span className="text-white/30"> / {category.weight} pts</span>
            </>
          )}
        </span>
      </div>
      <div className="h-1.5 mt-1.5 rounded-full bg-white/[0.06] overflow-hidden">
        {!excluded && (
          <div
            className="h-full rounded-full transition-[width]"
            style={{ width: `${value}%`, backgroundColor: bandColor(value) }}
          />
        )}
      </div>
      <p className="text-[11px] text-white/40 mt-1 leading-relaxed">{category.summary}</p>
    </li>
  );
}

const PRIORITY_STYLE: Record<AtsRecommendation["priority"], string> = {
  high: "border-red-400/25 bg-red-400/10 text-red-300",
  medium: "border-amber-400/25 bg-amber-400/10 text-amber-300",
  low: "border-white/12 bg-white/[0.04] text-white/50",
};

function RecommendationCard({ rec, index }: { rec: AtsRecommendation; index: number }) {
  return (
    <li className="rounded-xl border border-white/[0.07] bg-white/[0.02] px-4 py-3">
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-[10px] font-bold text-white/30 tabular-nums">
          {String(index + 1).padStart(2, "0")}
        </span>
        <span
          className={`text-[9px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-full border ${PRIORITY_STYLE[rec.priority]}`}
        >
          {rec.priority} priority
        </span>
        <p className="text-[13px] font-semibold text-white/85">{rec.title}</p>
      </div>
      <p className="text-[12px] text-white/50 mt-1.5 leading-relaxed">{rec.why}</p>
      <p className="text-[12px] text-white/70 mt-2 leading-relaxed flex gap-2">
        <Lightbulb className="w-3.5 h-3.5 shrink-0 mt-0.5 text-primary/70" aria-hidden="true" />
        <span>{rec.action}</span>
      </p>
      <EvidenceList items={rec.evidence} />
    </li>
  );
}

function StrengthCard({ strength }: { strength: AtsStrength }) {
  return (
    <li className="rounded-xl border border-primary/20 bg-primary/[0.04] px-4 py-3">
      <p className="text-[13px] font-semibold text-white/85 flex items-center gap-2">
        <ThumbsUp className="w-3.5 h-3.5 text-primary shrink-0" aria-hidden="true" />
        {strength.title}
      </p>
      <p className="text-[12px] text-white/55 mt-1.5 leading-relaxed">{strength.explanation}</p>
      <EvidenceList items={strength.evidence} />
    </li>
  );
}

const SEVERITY_STYLE: Record<AtsWeakness["severity"], string> = {
  high: "border-red-400/25 bg-red-400/10 text-red-300",
  medium: "border-amber-400/25 bg-amber-400/10 text-amber-300",
  low: "border-white/12 bg-white/[0.04] text-white/50",
};

function WeaknessCard({ weakness }: { weakness: AtsWeakness }) {
  return (
    <li className="rounded-xl border border-white/[0.07] bg-white/[0.02] px-4 py-3">
      <div className="flex flex-wrap items-center gap-2">
        <span
          className={`text-[9px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-full border ${SEVERITY_STYLE[weakness.severity]}`}
        >
          {weakness.severity}
        </span>
        <p className="text-[13px] font-semibold text-white/85">{weakness.title}</p>
      </div>
      <p className="text-[12px] text-white/55 mt-1.5 leading-relaxed">{weakness.explanation}</p>
      <p className="text-[12px] text-white/70 mt-2 leading-relaxed">{weakness.recommendation}</p>
      {weakness.example && (
        <p className="text-[11px] text-white/45 mt-2 italic leading-relaxed border-l-2 border-white/10 pl-3">
          {weakness.example}
        </p>
      )}
      <EvidenceList items={weakness.evidence} />
    </li>
  );
}

/** The lines the backend actually read — every claim above stays traceable. */
function EvidenceList({ items }: { items: string[] }) {
  if (items.length === 0) return null;
  return (
    <ul className="mt-2.5 pt-2.5 border-t border-white/[0.06] space-y-1">
      {items.map((e, i) => (
        <li key={i} className="text-[11px] text-white/35 italic leading-relaxed flex gap-2">
          <span className="not-italic text-white/25 shrink-0">·</span>
          <span className="min-w-0">{e}</span>
        </li>
      ))}
    </ul>
  );
}

const STATUS_META: Record<
  AtsCheckStatus,
  { label: string; icon: typeof CheckCircle2; chip: string }
> = {
  passed: {
    label: "Passed",
    icon: CheckCircle2,
    chip: "border-primary/25 bg-primary/10 text-primary",
  },
  needs_improvement: {
    label: "Needs improvement",
    icon: AlertTriangle,
    chip: "border-amber-400/25 bg-amber-400/10 text-amber-300",
  },
  not_detected: {
    label: "Not detected",
    icon: XCircle,
    chip: "border-red-400/25 bg-red-400/10 text-red-300",
  },
  unknown: {
    label: "Not graded",
    icon: MinusCircle,
    chip: "border-white/12 bg-white/[0.04] text-white/50",
  },
};

/** Attention checks as cards (with the fix), passed checks as compact chips.
 * Unavailable and passing are never presented as the same thing. */
function CheckList({ checks }: { checks: AtsCheck[] }) {
  const attention = checks.filter((c) => c.status !== "passed");
  const passed = checks.filter((c) => c.status === "passed");

  if (checks.length === 0) {
    return <p className="text-[12px] text-white/45">No check in this group could be evaluated.</p>;
  }

  return (
    <div>
      {attention.length > 0 ? (
        <ul className="space-y-3">
          {attention.map((check) => {
            const meta = STATUS_META[check.status];
            const Icon = meta.icon;
            return (
              <li key={check.id} className="rounded-xl border border-white/[0.07] bg-white/[0.02] px-4 py-3">
                <div className="flex flex-wrap items-center gap-2">
                  <span
                    className={`inline-flex items-center gap-1 text-[9px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-full border ${meta.chip}`}
                  >
                    <Icon className="w-2.5 h-2.5" aria-hidden="true" />
                    {meta.label}
                  </span>
                  <p className="text-[13px] font-semibold text-white/85">{check.label}</p>
                </div>
                {check.detected && (
                  <p className="text-[11px] text-white/50 mt-1.5 italic leading-relaxed">
                    Read from your resume: “{check.detected}”
                  </p>
                )}
                <p className="text-[12px] text-white/45 mt-1.5 leading-relaxed">{check.whyItMatters}</p>
                {check.improvement && (
                  <p className="text-[12px] text-white/70 mt-1.5 leading-relaxed">
                    <span className="font-semibold text-white/85">Fix: </span>
                    {check.improvement}
                  </p>
                )}
                <EvidenceList items={check.evidence} />
              </li>
            );
          })}
        </ul>
      ) : (
        <p className="text-[12px] text-white/45 leading-relaxed mb-3">
          Every check in this group passed.
        </p>
      )}

      {passed.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mt-3">
          {passed.map((check) => (
            <span
              key={check.id}
              title={check.whyItMatters}
              className="inline-flex items-center gap-1.5 text-[11px] px-2.5 py-1 rounded-full border border-primary/20 bg-primary/[0.05] text-primary/85"
            >
              <CheckCircle2 className="w-3 h-3" aria-hidden="true" />
              {check.label}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
