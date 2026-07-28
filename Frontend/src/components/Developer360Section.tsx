import { motion } from "motion/react";
import { GlassPanel, PanelHeader, SectionLead, SectionShell, SectionTitle, WindowDots } from "./Primitives";

const DIMENSIONS = [
  { name: "Frontend", score: 88, isHighlight: true },
  { name: "Backend", score: 72, isHighlight: false },
  { name: "Databases", score: 65, isHighlight: false },
  { name: "Problem Solving", score: 92, isHighlight: true },
  { name: "Testing", score: 45, isHighlight: false },
  { name: "DevOps", score: 30, isHighlight: false },
  { name: "Security", score: 55, isHighlight: false },
];

export default function Developer360Section() {
  return (
    <SectionShell>
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-14 items-center">
        <motion.div
          initial={{ opacity: 0, x: -28 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.7 }}
          className="lg:col-span-5 flex flex-col gap-6"
        >
          <SectionTitle>
            One Developer.
            <br />
            <span style={{ color: "hsl(var(--primary))" }}>Multiple Signals.</span>
          </SectionTitle>
          <SectionLead>
            DevProof correlates evidence across projects, activity, learning,
            and experience — not just a single platform.
          </SectionLead>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.7, delay: 0.1 }}
          className="lg:col-span-7"
        >
          <GlassPanel hover={false} className="overflow-hidden relative shadow-2xl">
            <div
              className="absolute top-0 right-0 w-64 h-64 rounded-full blur-[100px] pointer-events-none"
              style={{ background: "rgba(119,252,117,0.06)" }}
            />
            <PanelHeader>
              <WindowDots />
              <span className="text-sm font-bold text-white/90 ml-2">Developer 360</span>
              <span
                className="ml-auto text-[10px] font-bold tracking-widest uppercase px-3 py-1 rounded-full border"
                style={{
                  color: "hsl(var(--primary))",
                  borderColor: "rgba(119,252,117,0.2)",
                  background: "rgba(119,252,117,0.06)",
                }}
              >
                Analytics
              </span>
            </PanelHeader>

            <div className="p-6 md:p-8 flex flex-col gap-5 relative z-10">
              <div className="flex items-center justify-between mb-1">
                <span className="text-[10px] font-bold tracking-[0.22em] uppercase" style={{ color: "var(--text-tertiary)" }}>
                  Skill Dimension
                </span>
                <span className="text-[10px] font-bold tracking-[0.22em] uppercase" style={{ color: "var(--text-tertiary)" }}>
                  Evidence Level
                </span>
              </div>

              {DIMENSIONS.map((dim, idx) => (
                <div key={dim.name} className="flex flex-col gap-2">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium text-white/90">{dim.name}</span>
                    <span
                      className="text-xs font-mono font-bold tabular-nums"
                      style={{
                        color: dim.isHighlight ? "hsl(var(--primary))" : "var(--text-secondary)",
                      }}
                    >
                      {dim.score}%
                    </span>
                  </div>
                  <div className="w-full h-1.5 rounded-full bg-white/[0.05] overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      whileInView={{ width: `${dim.score}%` }}
                      viewport={{ once: true, margin: "-40px" }}
                      transition={{ duration: 1.2, delay: 0.1 + idx * 0.06, ease: [0.16, 1, 0.3, 1] }}
                      className="h-full rounded-full"
                      style={{
                        background: dim.isHighlight
                          ? "hsl(var(--primary))"
                          : dim.score > 60
                          ? "rgba(255,255,255,0.6)"
                          : "rgba(255,255,255,0.25)",
                        boxShadow: dim.isHighlight ? "0 0 12px rgba(119,252,117,0.4)" : "none",
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </GlassPanel>
        </motion.div>
      </div>
    </SectionShell>
  );
}
