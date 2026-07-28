import { motion } from "motion/react";
import { FolderGit2, Activity, ShieldAlert, CheckCircle2, ChevronRight } from "lucide-react";
import { cn } from "../lib/utils";
import { GlassPanel, PanelHeader, SectionShell, SectionTitle, WindowDots } from "./Primitives";

const METRICS = [
  { label: "Architecture", score: 82 },
  { label: "Code Quality", score: 76 },
  { label: "Security", score: 71 },
  { label: "Testing", score: 38, isWarning: true },
  { label: "Documentation", score: 84 },
  { label: "Maintainability", score: 69 },
];

export default function RepositoryIntelligenceSection() {
  return (
    <SectionShell
      id="intelligence"
      decor={
        <div className="ambient-glow-green w-[600px] h-[400px] top-1/2 right-0 -translate-y-1/2 translate-x-1/4 animate-glow-pulse" />
      }
    >
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-10 md:mb-14">
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.7 }}
        >
          <SectionTitle>
            Your Repository.
            <br />
            <span className="font-light" style={{ color: "var(--text-secondary)" }}>
              Explained.
            </span>
          </SectionTitle>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, x: 20 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.7 }}
          className="glass-chip flex items-center gap-3 px-5 py-2.5 shrink-0"
        >
          <FolderGit2 className="w-4 h-4" style={{ color: "var(--text-tertiary)" }} />
          <span className="text-sm font-medium text-white">SpendWise Pro</span>
          <div className="w-px h-4 bg-white/20" />
          <div className="flex items-center gap-2 text-sm">
            <span style={{ color: "var(--text-tertiary)" }}>Health</span>
            <span className="font-bold" style={{ color: "hsl(var(--primary))" }}>
              74<span className="text-xs font-normal" style={{ color: "var(--text-tertiary)" }}>/100</span>
            </span>
          </div>
        </motion.div>
      </div>

      {/* Dashboard preview */}
      <GlassPanel hover={false} className="overflow-hidden">
        <PanelHeader className="justify-between">
          <div className="flex items-center gap-3">
            <WindowDots />
            <span className="text-sm font-semibold text-white/90">Repository Intelligence</span>
          </div>
          <span className="text-[10px] italic tracking-wide" style={{ color: "var(--text-tertiary)" }}>
            Illustrative Preview
          </span>
        </PanelHeader>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-0 lg:divide-x lg:divide-white/[0.06]">
          {/* Metrics sidebar */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="lg:col-span-4 p-4 md:p-5 flex flex-col gap-2 border-b lg:border-b-0 border-white/[0.06]"
          >
            <p className="text-[10px] font-bold tracking-[0.2em] uppercase mb-2 px-1" style={{ color: "var(--text-tertiary)" }}>
              Health Dimensions
            </p>
            {METRICS.map((metric) => (
              <div
                key={metric.label}
                className={cn(
                  "flex items-center justify-between px-3.5 py-3 rounded-xl border transition-all relative overflow-hidden",
                  metric.isWarning
                    ? "border-red-500/30 bg-red-500/[0.08]"
                    : "border-white/[0.06] bg-white/[0.02] hover:border-white/12 hover:bg-white/[0.04]"
                )}
              >
                {metric.isWarning && (
                  <div className="absolute left-0 top-0 bottom-0 w-[3px] bg-red-500" />
                )}
                <span
                  className={cn("text-sm font-medium", metric.isWarning && "pl-1.5 text-white")}
                  style={!metric.isWarning ? { color: "var(--text-secondary)" } : {}}
                >
                  {metric.label}
                </span>
                <div className="flex items-center gap-2.5">
                  <div className="w-16 h-1 rounded-full bg-white/10 hidden sm:block">
                    <div
                      className="h-full rounded-full"
                      style={{
                        width: `${metric.score}%`,
                        background: metric.isWarning
                          ? "rgb(248,113,113)"
                          : "hsl(var(--primary))",
                        opacity: metric.isWarning ? 1 : 0.7,
                      }}
                    />
                  </div>
                  <span
                    className={cn(
                      "font-bold font-mono text-sm tabular-nums w-7 text-right",
                      metric.isWarning ? "text-red-400" : "text-white"
                    )}
                  >
                    {metric.score}
                  </span>
                </div>
              </div>
            ))}
          </motion.div>

          {/* Deep dive */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.15 }}
            className="lg:col-span-8 p-5 md:p-7 flex flex-col gap-6"
          >
            <div className="flex flex-wrap items-center gap-3">
              <span
                className="px-3 py-1 rounded-full text-[10px] font-bold tracking-widest border"
                style={{
                  background: "rgba(220,38,38,0.12)",
                  color: "rgb(248,113,113)",
                  borderColor: "rgba(220,38,38,0.3)",
                }}
              >
                SCORE: 38
              </span>
              <ChevronRight className="w-4 h-4" style={{ color: "var(--text-tertiary)" }} />
              <span className="text-sm font-semibold text-white tracking-wide">TESTING ANALYSIS</span>
            </div>

            <div className="flex flex-col gap-3">
              <div
                className="flex items-center gap-2 text-[10px] font-bold tracking-[0.2em] uppercase"
                style={{ color: "var(--text-tertiary)" }}
              >
                <Activity className="w-3.5 h-3.5" />
                Evidence Detected
              </div>
              <ul className="flex flex-col gap-2.5">
                {[
                  { text: "11 test files detected across the repository", warn: false },
                  { text: "Critical authentication paths lack integration coverage", warn: true },
                  { text: "Several core modules have no tests", warn: true },
                ].map(({ text, warn }) => (
                  <li
                    key={text}
                    className="glass-inset flex items-start gap-3 text-sm px-3.5 py-2.5"
                    style={{ color: "var(--text-secondary)" }}
                  >
                    <div
                      className={cn(
                        "w-1.5 h-1.5 rounded-full mt-1.5 shrink-0",
                        warn ? "bg-red-400" : "bg-white/30"
                      )}
                    />
                    {text}
                  </li>
                ))}
              </ul>
            </div>

            <div className="h-px w-full bg-white/[0.06]" />

            <div className="flex flex-col gap-3">
              <div
                className="flex items-center gap-2 text-[10px] font-bold tracking-[0.2em] uppercase"
                style={{ color: "var(--text-tertiary)" }}
              >
                <ShieldAlert className="w-3.5 h-3.5" />
                Findings &amp; Actions
              </div>

              <div
                className="flex flex-col md:flex-row gap-4 p-4 rounded-xl border"
                style={{ background: "rgba(220,38,38,0.06)", borderColor: "rgba(220,38,38,0.2)" }}
              >
                <div className="flex flex-col gap-0.5 md:w-28 shrink-0">
                  <span className="text-[10px] font-bold tracking-widest" style={{ color: "rgb(248,113,113)" }}>
                    HIGH
                  </span>
                  <span className="text-xs" style={{ color: "var(--text-tertiary)" }}>
                    Action Required
                  </span>
                </div>
                <p className="text-sm leading-relaxed" style={{ color: "var(--text-secondary)" }}>
                  Authentication routes lack integration tests.{" "}
                  <span className="cursor-pointer hover:underline" style={{ color: "hsl(var(--primary))" }}>
                    Add integration tests to src/auth/routes.ts
                  </span>{" "}
                  to improve score and demonstrate backend reliability.
                </p>
              </div>

              <div
                className="flex flex-col md:flex-row gap-4 p-4 rounded-xl border"
                style={{ background: "rgba(119,252,117,0.05)", borderColor: "rgba(119,252,117,0.18)" }}
              >
                <div className="flex flex-col gap-0.5 md:w-28 shrink-0">
                  <span className="text-[10px] font-bold tracking-widest" style={{ color: "hsl(var(--primary))" }}>
                    GOOD
                  </span>
                  <span className="text-xs" style={{ color: "var(--text-tertiary)" }}>
                    Best Practice
                  </span>
                </div>
                <div className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" style={{ color: "hsl(var(--primary))" }} />
                  <p className="text-sm leading-relaxed" style={{ color: "var(--text-secondary)" }}>
                    Environment secrets are separated from source configuration securely.
                  </p>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </GlassPanel>
    </SectionShell>
  );
}
