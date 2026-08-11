import { motion } from "motion/react";
import { Check, AlertTriangle } from "lucide-react";
import { cn } from "../lib/utils";
import { GlassPanel, PanelHeader, SectionShell, SectionTitle, WindowDots } from "./Primitives";

const STEPS = [
  { title: "Claimed", desc: "Developer self-reports skill" },
  { title: "Learned", desc: "Courses & study hours" },
  { title: "Credential Verified", desc: "Third-party certification" },
  { title: "Practically Evidenced", desc: "Proven via repository static code analysis", isHighlight: true },
];

function StatusItem({
  label,
  value,
  isPositive,
}: {
  label: string;
  value: React.ReactNode;
  isPositive?: boolean;
}) {
  return (
    <div className="flex items-center justify-between py-2 border-b border-white/[0.05] last:border-0">
      <span className="text-sm" style={{ color: "var(--text-tertiary)" }}>
        {label}
      </span>
      <div
        className={cn("text-sm font-medium", isPositive ? "text-primary" : "")}
        style={!isPositive ? { color: "var(--text-secondary)" } : {}}
      >
        {value}
      </div>
    </div>
  );
}

export default function CoreValueSection() {
  return (
    <SectionShell
      id="product"
      decor={
        <div className="ambient-glow-white w-[800px] h-[500px] top-0 left-1/2 -translate-x-1/2" />
      }
    >
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-80px" }}
        transition={{ duration: 0.7 }}
        className="mb-10 md:mb-12"
      >
        <SectionTitle>
          From Claims
          <br />
          <span style={{ color: "hsl(var(--primary))" }}>To Engineering Evidence.</span>
        </SectionTitle>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-stretch">
        {/* Left Column: Timeline progression */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true, margin: "-60px" }}
          transition={{ duration: 0.6 }}
          className="lg:col-span-5 flex flex-col justify-center gap-6"
        >
          <div className="flex flex-col gap-4 relative">
            {/* Timeline vertical connector line */}
            <div className="absolute left-[21px] top-4 bottom-4 w-px bg-white/[0.08]" />

            {STEPS.map((step, idx) => (
              <div key={step.title} className="relative flex items-start gap-4">
                <div
                  className={cn(
                    "w-11 h-11 rounded-full flex items-center justify-center border font-bold text-xs shrink-0 backdrop-blur-md z-10",
                    step.isHighlight
                      ? "border-primary text-primary shadow-[0_0_20px_rgba(119,252,117,0.25)] bg-primary/10"
                      : "border-white/10 text-white/55 bg-white/[0.02]"
                  )}
                >
                  {idx + 1}
                </div>
                <div className="pt-1.5">
                  <h4 className={cn("text-sm font-semibold tracking-wide", step.isHighlight ? "text-primary" : "text-white")}>
                    {step.title}
                  </h4>
                  <p className="text-xs text-white/50 leading-relaxed mt-0.5">{step.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Right Column: Visual Verification Widgets */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true, margin: "-60px" }}
          transition={{ duration: 0.6 }}
          className="lg:col-span-7 flex flex-col sm:flex-row gap-5"
        >
          {/* Card 1: Strong Evidence */}
          <GlassPanel hover={true} className="overflow-hidden flex-1 flex flex-col hover:-translate-y-1 transition-all duration-500 hover:shadow-2xl">
            <PanelHeader>
              <WindowDots />
              <h3 className="font-bold text-white tracking-wide text-xs ml-2">React</h3>
              <div className="ml-auto flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse shadow-[0_0_6px_rgba(119,252,117,0.8)]" />
                <span className="text-[9px] font-bold tracking-widest text-primary">LIVE</span>
              </div>
            </PanelHeader>
            <div className="p-4.5 md:p-5 flex flex-col flex-1 justify-between gap-4">
              <div className="flex flex-col">
                <StatusItem label="Claimed" value={<Check className="w-4 h-4 text-primary" />} isPositive />
                <StatusItem label="Learned" value={<Check className="w-4 h-4 text-primary" />} isPositive />
                <StatusItem label="Credential Verified" value={<Check className="w-4 h-4 text-primary" />} isPositive />
                <StatusItem label="Project Code Proof" value={<Check className="w-4 h-4 text-primary" />} isPositive />
              </div>
              <div className="pt-3 border-t border-white/[0.06] flex items-center justify-between">
                <span className="text-xs font-semibold text-white/70">Practical Evidence</span>
                <span
                  className="px-2.5 py-0.5 rounded-full text-[9px] font-bold tracking-widest border bg-primary/10 text-primary border-primary/20"
                >
                  STRONG
                </span>
              </div>
            </div>
          </GlassPanel>

          {/* Card 2: Limited Evidence / Gap */}
          <GlassPanel hover={true} className="overflow-hidden flex-1 flex flex-col hover:-translate-y-1 transition-all duration-500 hover:shadow-2xl">
            <PanelHeader>
              <WindowDots />
              <h3 className="font-bold text-white tracking-wide text-xs ml-2">Docker</h3>
              <div className="ml-auto flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-yellow-500" />
                <span className="text-[9px] font-bold tracking-widest text-yellow-500">GAP</span>
              </div>
            </PanelHeader>
            <div className="p-4.5 md:p-5 flex flex-col flex-1 justify-between gap-4">
              <div className="flex flex-col">
                <StatusItem label="Claimed" value={<Check className="w-4 h-4 text-primary" />} isPositive />
                <StatusItem label="Learned" value={<Check className="w-4 h-4 text-primary" />} isPositive />
                <StatusItem label="Project Code Proof" value={<span className="text-yellow-500 font-semibold text-xs">Limited</span>} />
                <StatusItem label="Recent Activity" value={<span className="text-red-400 font-semibold text-xs">None</span>} />
              </div>
              <div className="pt-3 border-t border-white/[0.06] flex items-center justify-between">
                <span className="text-xs font-semibold text-white/70">Practical Evidence</span>
                <span
                  className="px-2.5 py-0.5 rounded-full text-[9px] font-bold tracking-widest border flex items-center gap-1 bg-white/[0.02] text-white/50 border-white/10"
                >
                  <AlertTriangle className="w-3 h-3 text-yellow-500" />
                  LIMITED
                </span>
              </div>
            </div>
          </GlassPanel>
        </motion.div>
      </div>
    </SectionShell>
  );
}
