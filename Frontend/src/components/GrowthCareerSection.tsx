import { motion } from "motion/react";
import {
  TrendingUp,
  TrendingDown,
  BarChart2,
  Briefcase,
  Target,
  ArrowRight,
  Zap,
  Info,
} from "lucide-react";
import { cn } from "../lib/utils";
import {
  GlassPanel,
  PanelHeader,
  SectionShell,
  SectionTitle,
  WindowDots,
} from "./Primitives";

/* ────── Growth data ────── */
const TRENDS = [
  { label: "Backend Activity", value: "+31%", isPositive: true },
  { label: "Testing Maturity", value: "+12%", isPositive: true },
  { label: "Problem Solving", value: "-8%", isPositive: false },
];

const CHART_DATA = [
  { month: "March", score: 61 },
  { month: "April", score: 69 },
  { month: "May", score: 77 },
  { month: "June", score: 74 },
];

/* ────── Career data ────── */
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
    return {
      color: "hsl(var(--primary))",
      labelBg: "rgba(119,252,117,0.1)",
      border: "rgba(119,252,117,0.2)",
    };
  if (tier === "low")
    return {
      color: "rgb(248,113,113)",
      labelBg: "rgba(220,38,38,0.08)",
      border: "rgba(220,38,38,0.2)",
    };
  return {
    color: "var(--text-secondary)",
    labelBg: "rgba(255,255,255,0.03)",
    border: "rgba(255,255,255,0.08)",
  };
}

/* ════════════════════════════════════════════════════════ */
export default function GrowthCareerSection() {
  const maxScore = 100;

  return (
    <SectionShell
      id="growth"
      decor={
        <div className="ambient-glow-green w-[600px] h-[400px] top-1/2 left-0 -translate-y-1/2 -translate-x-1/4 animate-glow-pulse" />
      }
    >
      {/* Section header */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-80px" }}
        transition={{ duration: 0.7 }}
        className="text-center mb-10"
      >
        <SectionTitle align="center">
          Growth&nbsp;&amp;&nbsp;
          <span style={{ color: "hsl(var(--primary))" }}>Career Intelligence.</span>
        </SectionTitle>
      </motion.div>

      {/* ── Two main columns ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-stretch">
        {/* ── LEFT: Growth Analytics ── */}
        <div className="flex flex-col gap-4">
          {/* Chart widget */}
          <motion.div
            initial={{ opacity: 0, scale: 0.98 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true, margin: "-60px" }}
            transition={{ duration: 0.65 }}
            className="flex-1"
          >
            <GlassPanel hover={false} className="h-full overflow-hidden shadow-2xl">
              <PanelHeader>
                <WindowDots />
                <div className="flex items-center gap-2 text-sm font-bold text-white ml-2">
                  <BarChart2 className="w-4 h-4" style={{ color: "hsl(var(--primary))" }} />
                  Engineering Score Trend
                </div>
                <span
                  className="ml-auto text-[10px] italic flex items-center gap-1 font-semibold uppercase tracking-wider"
                  style={{ color: "var(--text-tertiary)" }}
                >
                  <Info className="w-3 h-3 text-primary" />
                  Evidence History
                </span>
              </PanelHeader>

              <div className="p-5">
                <div className="h-40 flex items-end justify-between gap-4">
                  {CHART_DATA.map((data, idx) => {
                    const heightPercent = (data.score / maxScore) * 100;
                    const isLatest = idx === CHART_DATA.length - 1;
                    return (
                      <div
                        key={data.month}
                        className="flex flex-col items-center gap-2 flex-1 group h-full"
                      >
                        <span
                          className={cn(
                            "text-xs font-mono font-bold tabular-nums",
                            isLatest ? "text-primary scale-110" : ""
                          )}
                          style={!isLatest ? { color: "var(--text-tertiary)" } : {}}
                        >
                          {data.score}
                        </span>
                        <div className="w-full h-full rounded-t-xl relative flex items-end bg-white/[0.02] border border-white/[0.04] border-b-0 overflow-hidden">
                          <motion.div
                            initial={{ height: 0 }}
                            whileInView={{ height: `${heightPercent}%` }}
                            viewport={{ once: true, margin: "-40px" }}
                            transition={{
                              duration: 1.2,
                              delay: 0.1 + idx * 0.08,
                              type: "spring",
                              stiffness: 70,
                            }}
                            className="w-full rounded-t-md"
                            style={{
                              background: isLatest
                                ? "hsl(var(--primary))"
                                : "rgba(255, 255, 255, 0.16)",
                              boxShadow: isLatest
                                ? "0 0 24px rgba(119,252,117,0.3)"
                                : "none",
                            }}
                          />
                        </div>
                        <span
                          className="text-[10px] font-semibold uppercase tracking-wider"
                          style={{ color: "var(--text-tertiary)" }}
                        >
                          {data.month}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </GlassPanel>
          </motion.div>

          {/* Trend indicators */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-60px" }}
            transition={{ duration: 0.6, delay: 0.15 }}
            className="flex flex-col gap-2"
          >
            <p
              className="text-[10px] font-bold tracking-[0.2em] uppercase px-1 mb-1"
              style={{ color: "var(--text-tertiary)" }}
            >
              Trend Indicators
            </p>
            {TRENDS.map((trend) => (
              <div
                key={trend.label}
                className="glass-inset flex items-center justify-between px-4 py-2.5 hover:border-white/15 transition-all duration-300"
              >
                <span className="text-sm font-medium text-white/95">{trend.label}</span>
                <div
                  className={cn(
                    "flex items-center gap-1.5 text-sm font-bold font-mono tabular-nums",
                    trend.isPositive ? "text-primary" : "text-red-400"
                  )}
                >
                  {trend.isPositive ? (
                    <TrendingUp className="w-4 h-4" />
                  ) : (
                    <TrendingDown className="w-4 h-4" />
                  )}
                  {trend.value}
                </div>
              </div>
            ))}
          </motion.div>
        </div>

        {/* ── RIGHT: Career Intelligence ── */}
        <div className="flex flex-col gap-4">
          {/* Career readiness widget */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, margin: "-60px" }}
            transition={{ duration: 0.65 }}
            className="flex-1"
          >
            <GlassPanel hover={false} className="h-full overflow-hidden shadow-2xl">
              <PanelHeader>
                <WindowDots />
                <span className="text-sm font-bold text-white/90 ml-2">Career Readiness</span>
              </PanelHeader>

              <div className="p-5 flex flex-col gap-4">
                <div className="flex items-center gap-4 pb-4 border-b border-white/[0.06]">
                  <div
                    className="w-10 h-10 rounded-xl border border-white/10 flex items-center justify-center shrink-0"
                    style={{ background: "rgba(119,252,117,0.08)" }}
                  >
                    <Briefcase className="w-4 h-4 text-primary" />
                  </div>
                  <div className="min-w-0">
                    <div
                      className="text-[10px] font-bold uppercase tracking-widest mb-0.5"
                      style={{ color: "var(--text-tertiary)" }}
                    >
                      Target Role
                    </div>
                    <div className="text-lg font-bold text-white tracking-tight">SDE Intern</div>
                  </div>
                  <div className="ml-auto text-right shrink-0">
                    <div
                      className="text-[10px] font-bold uppercase tracking-widest mb-0.5"
                      style={{ color: "var(--text-tertiary)" }}
                    >
                      Readiness
                    </div>
                    <div className="text-lg font-bold text-primary font-mono tracking-tight">
                      74%
                    </div>
                  </div>
                </div>

                <div className="w-full h-1.5 rounded-full bg-white/[0.05] overflow-hidden">
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

                <div className="flex flex-col gap-1.5">
                  <div
                    className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.2em] mb-0.5"
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
                        className="flex items-center justify-between py-1.5 px-3 rounded-xl bg-white/[0.01] border border-white/[0.03] hover:border-white/10 transition-colors duration-300"
                      >
                        <span className="text-sm font-medium text-white/90">{dim.name}</span>
                        <span
                          className="text-[10px] font-bold tracking-wide uppercase px-2 py-0.5 rounded-md border"
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

          {/* Recommended action widget */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, margin: "-60px" }}
            transition={{ duration: 0.65, delay: 0.1 }}
          >
            <GlassPanel hover={false} className="overflow-hidden relative shadow-2xl">
              <div
                className="absolute top-0 right-0 w-48 h-48 rounded-full blur-[80px] pointer-events-none"
                style={{ background: "rgba(119,252,117,0.05)" }}
              />
              <PanelHeader>
                <WindowDots />
                <span className="text-sm font-bold text-white/90 ml-2">Recommended Action</span>
              </PanelHeader>

              <div className="p-5 flex flex-col gap-3 relative z-10">
                <div>
                  <div
                    className="flex items-center gap-2 text-[10px] font-bold tracking-[0.2em] mb-2"
                    style={{ color: "rgb(248,113,113)" }}
                  >
                    <Zap className="w-3.5 h-3.5 animate-pulse" />
                    Largest Current Engineering Gap
                  </div>
                  <h3
                    className="text-display uppercase tracking-tight"
                    style={{ fontSize: "clamp(1.25rem, 2.5vw, 1.75rem)", lineHeight: 1.1 }}
                  >
                    Automated Testing
                  </h3>
                </div>

                <div className="glass-inset p-4 relative group cursor-default hover:border-primary/30 hover:bg-white/[0.05] transition-all duration-300">
                  <div
                    className="absolute left-0 top-0 bottom-0 w-[3px] rounded-l-xl"
                    style={{ background: "hsl(var(--primary))" }}
                  />
                  <p
                    className="text-sm leading-relaxed pr-6 pl-1.5"
                    style={{ color: "var(--text-secondary)" }}
                  >
                    Add auth integration tests and transaction-service unit tests to{" "}
                    <span
                      className="cursor-pointer hover:underline font-semibold"
                      style={{ color: "hsl(var(--primary))" }}
                    >
                      SpendWise Pro
                    </span>
                    .
                  </p>
                  <ArrowRight
                    className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all duration-300"
                    style={{ color: "hsl(var(--primary))" }}
                  />
                </div>
              </div>
            </GlassPanel>
          </motion.div>
        </div>
      </div>
    </SectionShell>
  );
}
