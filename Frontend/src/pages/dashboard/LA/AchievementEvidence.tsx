import { Lightbulb, ArrowRight } from "lucide-react";
import GlassCard from "../../../components/GlassCard";
import { LAStatLabel, EvidenceChip } from "./shared";

export interface EvidenceSource {
  name: string;
  available: boolean;
  /** Where the availability comes from, shown as the row's note. */
  note: string;
}

/**
 * Evidence coverage for the learning profile. `available` reflects real,
 * current data sources only — no scores, no percentages.
 */
export function AchievementEvidence({ sources }: { sources: EvidenceSource[] }) {
  return (
    <GlassCard hover={false} className="p-6 md:p-7 relative overflow-hidden">
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/[0.10] to-transparent pointer-events-none" />
      <div className="relative divide-y divide-white/[0.05]">
        {sources.map((s) => (
          <div key={s.name} className="flex items-center justify-between gap-3 py-3.5 first:pt-0 last:pb-0">
            <div className="min-w-0">
              <p className="text-sm font-semibold text-white/85">{s.name}</p>
              <p className="text-[11px] text-white/35 mt-0.5 truncate">{s.note}</p>
            </div>
            <EvidenceChip available={s.available} label={s.available ? "Available" : "Not available"} />
          </div>
        ))}
      </div>
    </GlassCard>
  );
}

/** DevProof Insight — analytical next steps, disabled when unsupported. */
export function DevProofInsight({
  certificationCount,
  courseCount,
  hackathonCount,
}: {
  certificationCount: number;
  courseCount: number;
  hackathonCount: number;
}) {
  const hasCerts = certificationCount > 0;
  const hasCourses = courseCount > 0;
  const hasHackathons = hackathonCount > 0;

  return (
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

        {hasCerts || hasCourses || hasHackathons ? (
          <p className="text-[14px] leading-relaxed text-white/75 max-w-3xl">
            You have recorded{" "}
            <span className="text-white font-semibold">
              {[
                hasCourses
                  ? `${courseCount} ${courseCount === 1 ? "course" : "courses"}`
                  : null,
                hasCerts
                  ? `${certificationCount} ${certificationCount === 1 ? "certification" : "certifications"}`
                  : null,
                hasHackathons
                  ? `${hackathonCount} hackathon ${hackathonCount === 1 ? "experience" : "experiences"}`
                  : null,
              ]
                .filter(Boolean)
                .join(" and ")}
            </span>{" "}
            as learning evidence. Learning-hour and study-streak tracking still have no data
            source, so those parts stay blank rather than estimated.
          </p>
        ) : (
          <p className="text-[14px] leading-relaxed text-white/75 max-w-3xl">
            Your learning profile is still being built. Add courses, certifications, and hackathon
            experiences to connect your learning history with your verified developer profile.
          </p>
        )}

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mt-5">
          <div className="rounded-xl border border-primary/25 bg-primary/[0.06] p-4">
            <LAStatLabel>Next step</LAStatLabel>
            <p className="text-sm font-bold text-white mt-1 flex items-center gap-1.5">
              Add certification <ArrowRight className="w-3.5 h-3.5 text-primary" />
            </p>
            <p className="text-[11px] text-white/40 mt-1 leading-relaxed">
              Live today — records credential evidence and can promote related skills.
            </p>
          </div>
          <div className="rounded-xl border border-primary/25 bg-primary/[0.06] p-4">
            <LAStatLabel>Next</LAStatLabel>
            <p className="text-sm font-bold text-white mt-1 flex items-center gap-1.5">
              Add course <ArrowRight className="w-3.5 h-3.5 text-primary" />
            </p>
            <p className="text-[11px] text-white/40 mt-1 leading-relaxed">
              Live today — records coursework and can promote skills you list for it.
            </p>
          </div>
          <div className="rounded-xl border border-primary/25 bg-primary/[0.06] p-4">
            <LAStatLabel>Next</LAStatLabel>
            <p className="text-sm font-bold text-white mt-1 flex items-center gap-1.5">
              Add hackathon <ArrowRight className="w-3.5 h-3.5 text-primary" />
            </p>
            <p className="text-[11px] text-white/40 mt-1 leading-relaxed">
              Live today — records your own account of the event; listed technologies are stored
              as claimed skills only.
            </p>
          </div>
        </div>
      </div>
    </GlassCard>
  );
}
