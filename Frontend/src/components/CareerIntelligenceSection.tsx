import { motion } from "motion/react";
import { Briefcase, Target, ArrowRight, Zap } from "lucide-react";
import { GlassPanel, PanelHeader, SectionLead, SectionShell, SectionTitle, WindowDots } from "./Primitives";

const DIMENSIONS = [
  { name: "Programming", level: "Strong", tier: "high" },
  { name: "Problem Solving", level: "Good", tier: "med" },
  { name: "Development", level: "Strong", tier: "high" },
  { name: "Databases", level: "Moderate", tier: "med" },
  { name: "Testing", level: "Weak", tier: "low" },
  { name: "System Design", level: "Limited Evidence", tier: "low" },
];

function getTierStyle(tier: string) {
  if (tier === "high")
    return { color: "hsl(var(--primary))", labelBg: "rgba(119,252,117,0.1)", border: "rgba(119,252,117,0.2)" };
  if (tier === "low")
    return { color: "rgb(248,113,113)", labelBg: "rgba(220,38,38,0.08)", border: "rgba(220,38,38,0.2)" };
  return { color: "var(--text-secondary)", labelBg: "rgba(255,255,255,0.03)", border: "rgba(255,255,255,0.08)" };
}

export default function CareerIntelligenceSection() {
  return (
    <SectionShell id="career">
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-80px" }}
        transition={{ duration: 0.7 }}
        className="text-center mb-16"
      >
        <SectionTitle align="center">
          Don't follow a
          <br className="hidden md:block" />
          <span style={{ color: "hsl(var(--primary))" }}> Generic Roadmap.</span>
        </SectionTitle>
        <SectionLead align="center" className="mt-5">
          Recommendations come from what you have actually built — not from a generic checklist.
        </SectionLead>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
        {/* Target role dashboard */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true, margin: "-60px" }}
          transition={{ duration: 0.65 }}
          className="lg:col-span-5"
        >
          <GlassPanel hover={false} className="h-full overflow-hidden shadow-2xl">
            <PanelHeader>
              <WindowDots />
              <span className="text-sm font-bold text-white/90 ml-2">Career Readiness</span>
            </PanelHeader>

            <div className="p-6 md:p-7 flex flex-col gap-6">
              <div className="flex items-center gap-4.5 pb-6 border-b border-white/[0.06]">
                <div
                  className="w-12 h-12 rounded-xl border border-white/10 flex items-center justify-center shrink-0"
                  style={{ background: "rgba(119,252,117,0.08)" }}
                >
                  <Briefcase className="w-5 h-5 text-primary" />
                </div>
                <div className="min-w-0">
                  <div
                    className="text-[10px] font-bold uppercase tracking-widest mb-1"
                    style={{ color: "var(--text-tertiary)" }}
                  >
                    Target Role
                  </div>
                  <div className="text-xl font-bold text-white tracking-tight">SDE Intern</div>
                </div>
                <div className="ml-auto text-right shrink-0">
                  <div
                    className="text-[10px] font-bold uppercase tracking-widest mb-1"
                    style={{ color: "var(--text-tertiary)" }}
                  >
                    Readiness
                  </div>
                  <div className="text-xl font-bold text-primary font-mono tracking-tight">
                    74%
                  </div>
                </div>
              </div>

              {/* Progress bar visual */}
              <div className="w-full h-2 rounded-full bg-white/[0.05] overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  whileInView={{ width: "74%" }}
                  viewport={{ once: true }}
                  transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1] }}
                  className="h-full rounded-full"
                  style={{
                    background: "hsl(var(--primary))",
                    boxShadow: "0 0 12px rgba(119,252,117,0.5)",
                  }}
                />
              </div>

              <div className="flex flex-col gap-2.5">
                <div
                  className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.2em] mb-1"
                  style={{ color: "var(--text-tertiary)" }}
                >
                  <Target className="w-3.5 h-3.5 text-primary" />
                  Skill Breakdown
                </div>

                {DIMENSIONS.map((dim) => {
                  const style = getTierStyle(dim.tier);
                  return (
                    <div
                      key={dim.name}
                      className="flex items-center justify-between py-2 px-3.5 rounded-xl bg-white/[0.01] border border-white/[0.03] hover:border-white/10 transition-colors duration-300"
                    >
                      <span className="text-sm font-medium text-white/90">{dim.name}</span>
                      <span
                        className="text-[10px] font-bold tracking-wide uppercase px-2.5 py-1 rounded-md border"
                        style={{
                          color: style.color,
                          background: style.labelBg,
                          borderColor: style.border,
                        }}
                      >
                        {dim.level}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          </GlassPanel>
        </motion.div>

        {/* Recommendation panel */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true, margin: "-60px" }}
          transition={{ duration: 0.65, delay: 0.1 }}
          className="lg:col-span-7"
        >
          <GlassPanel hover={false} className="h-full overflow-hidden relative shadow-2xl">
            <div
              className="absolute top-0 right-0 w-72 h-72 rounded-full blur-[100px] pointer-events-none"
              style={{ background: "rgba(119,252,117,0.05)" }}
            />
            <PanelHeader>
              <WindowDots />
              <span className="text-sm font-bold text-white/90 ml-2">Recommended Action</span>
            </PanelHeader>

            <div className="p-8 md:p-10 flex flex-col gap-8 relative z-10 h-full justify-center">
              <div>
                <div
                  className="flex items-center gap-2 text-[10px] font-bold tracking-[0.2em] uppercase mb-4"
                  style={{ color: "rgb(248,113,113)" }}
                >
                  <Zap className="w-4 h-4 animate-pulse" />
                  Largest Current Engineering Gap
                </div>
                <h3
                  className="text-display uppercase tracking-tight"
                  style={{ fontSize: "clamp(1.75rem, 3.5vw, 2.5rem)", lineHeight: 1.1 }}
                >
                  Automated Testing
                </h3>
              </div>

              <div>
                <div
                  className="text-[10px] font-semibold uppercase tracking-[0.2em] mb-4"
                  style={{ color: "hsl(var(--primary))" }}
                >
                  Recommended Next Action
                </div>

                <div className="glass-inset p-6 relative group cursor-default hover:border-primary/30 hover:bg-white/[0.05] transition-all duration-300">
                  <div
                    className="absolute left-0 top-0 bottom-0 w-[3px] rounded-l-xl"
                    style={{ background: "hsl(var(--primary))" }}
                  />
                  <p
                    className="text-base leading-relaxed pr-8 pl-2"
                    style={{ color: "var(--text-secondary)" }}
                  >
                    Add authentication integration tests and transaction-service unit tests to{" "}
                    <span
                      className="cursor-pointer hover:underline font-semibold"
                      style={{ color: "hsl(var(--primary))" }}
                    >
                      SpendWise Pro
                    </span>
                    .
                  </p>
                  <ArrowRight
                    className="absolute right-5 top-1/2 -translate-y-1/2 w-5 h-5 opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all duration-300"
                    style={{ color: "hsl(var(--primary))" }}
                  />
                </div>
              </div>
            </div>
          </GlassPanel>
        </motion.div>
      </div>
    </SectionShell>
  );
}
