import PageContainer from "../../components/PageContainer";
import GlassCard from "../../components/GlassCard";
import { Code2, ArrowRight } from "lucide-react";

export default function Skills() {
  const SKILLS = [
    { name: "TypeScript", level: "Strong", verified: true },
    { name: "React", level: "Strong", verified: true },
    { name: "Go", level: "Learned", verified: false },
    { name: "Docker", level: "Limited", verified: false },
  ];

  return (
    <PageContainer
      title="Skills Profile"
      description="Inspect your skills, evidence thresholds, and verified proficiency data."
    >
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {SKILLS.map((skill) => (
          <GlassCard key={skill.name} className="p-6 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-white/[0.03] border border-white/10 flex items-center justify-center text-white/50">
                <Code2 className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-white uppercase tracking-wider">{skill.name}</h3>
                <p className="text-xs mt-0.5" style={{ color: "var(--text-tertiary)" }}>
                  Level: <span className="font-semibold">{skill.level}</span>
                </p>
              </div>
            </div>
            
            {skill.verified ? (
              <span className="text-[10px] font-bold tracking-widest text-primary px-3 py-1 rounded-full border border-primary/20 bg-primary/10">
                VERIFIED
              </span>
            ) : (
              <button className="text-[10px] font-bold tracking-widest text-white/50 px-3 py-1 rounded-full border border-white/10 hover:border-white/20 transition-all cursor-pointer">
                REQUEST VERIFICATION
              </button>
            )}
          </GlassCard>
        ))}
      </div>
    </PageContainer>
  );
}
