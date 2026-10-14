import GlassCard from "../../../components/GlassCard";
import { ResumeGlyph } from "./icons";

export default function ResumeIntelligencePlaceholder() {
  return (
    <GlassCard hover={false} className="p-6 md:p-8 mb-8">
      <div className="flex flex-col items-center text-center gap-3 py-6">
        <div className="w-11 h-11 rounded-2xl border border-white/10 bg-white/[0.03] flex items-center justify-center text-white/35">
          <ResumeGlyph className="w-5 h-5" />
        </div>
        <h3 className="text-sm font-bold text-white uppercase tracking-wider">
          Upload a resume to unlock professional intelligence
        </h3>
        <p className="text-[12px] max-w-md leading-relaxed" style={{ color: "var(--text-secondary)" }}>
          Once your resume is analyzed, DevProof surfaces skills detected, projects, experience years,
          certifications, and how much of your profile they complete.
        </p>

        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 mt-4 w-full">
          {["Skills Detected", "Projects", "Experience", "Certifications", "Completeness"].map(
            (label) => (
              <div key={label} className="rounded-xl border border-white/[0.07] bg-white/[0.02] px-3 py-3.5">
                <p className="text-[10px] font-bold uppercase tracking-widest text-white/35">
                  {label}
                </p>
                <div className="h-5 w-10 rounded bg-white/[0.05] mt-2" aria-hidden="true" />
              </div>
            )
          )}
        </div>
      </div>
    </GlassCard>
  );
}
