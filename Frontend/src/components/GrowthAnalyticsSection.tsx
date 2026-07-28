import { motion } from "motion/react";
import { TrendingUp, TrendingDown, BarChart2, Info } from "lucide-react";
import { cn } from "../lib/utils";
import { GlassPanel, PanelHeader, SectionShell, SectionTitle, WindowDots } from "./Primitives";

const TRENDS = [
  { label: "Backend Activity", value: "+31%", isPositive: true },
  { label: "Testing Maturity", value: "+12%", isPositive: true },
  { label: "Problem Solving Consistency", value: "-8%", isPositive: false },
];

const CHART_DATA = [
  { month: "March", score: 61 },
  { month: "April", score: 69 },
  { month: "May", score: 77 },
  { month: "June", score: 74 },
];

export default function GrowthAnalyticsSection() {
  const maxScore = 100;

  return (
    <SectionShell
      id="growth"
      decor={
        <div className="ambient-glow-green w-[600px] h-[400px] top-1/2 left-0 -translate-y-1/2 -translate-x-1/4 animate-glow-pulse" />
      }
    >
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-80px" }}
        transition={{ duration: 0.7 }}
        className="text-center mb-12 md:mb-14"
      >
        <SectionTitle align="center">
          See how your engineering
          <br className="hidden md:block" />
          <span style={{ color: "hsl(var(--primary))" }}> Evolves.</span>
        </SectionTitle>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 lg:gap-6 items-stretch">
        {/* Chart widget */}
        <motion.div
          initial={{ opacity: 0, scale: 0.98 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true, margin: "-60px" }}
          transition={{ duration: 0.65 }}
          className="lg:col-span-8"
        >
          <GlassPanel hover={false} className="h-full overflow-hidden">
            <PanelHeader>
              <WindowDots />
              <div className="flex items-center gap-2 text-sm font-semibold text-white">
                <BarChart2 className="w-4 h-4" style={{ color: "hsl(var(--primary))" }} />
                Engineering Score Trend
              </div>
              <span
                className="ml-auto text-[10px] italic flex items-center gap-1"
                style={{ color: "var(--text-tertiary)" }}
              >
                <Info className="w-3 h-3" />
                Demo Analytics
              </span>
            </PanelHeader>

            <div className="p-6 md:p-8">
              <div className="h-56 flex items-end justify-between gap-3 md:gap-5">
                {CHART_DATA.map((data, idx) => {
                  const heightPercent = (data.score / maxScore) * 100;
                  const isLatest = idx === CHART_DATA.length - 1;
                  return (
                    <div key={data.month} className="flex flex-col items-center gap-3 flex-1 group h-full">
                      <span
                        className={cn(
                          "text-xs font-mono tabular-nums",
                          isLatest ? "text-primary font-bold" : ""
                        )}
                        style={!isLatest ? { color: "var(--text-tertiary)" } : {}}
                      >
                        {data.score}
                      </span>
                      <div className="w-full h-full rounded-t-lg relative flex items-end bg-white/[0.03] border border-white/[0.04] border-b-0 overflow-hidden">
                        <motion.div
                          initial={{ height: 0 }}
                          whileInView={{ height: `${heightPercent}%` }}
                          viewport={{ once: true, margin: "-40px" }}
                          transition={{
                            duration: 1,
                            delay: 0.1 + idx * 0.1,
                            type: "spring",
                            stiffness: 80,
                          }}
                          className="w-full rounded-t-md"
                          style={{
                            background: isLatest
                              ? "hsl(var(--primary))"
                              : "rgba(255,255,255,0.2)",
                            boxShadow: isLatest ? "0 0 24px rgba(119,252,117,0.35)" : "none",
                          }}
                        />
                      </div>
                      <span
                        className="text-[10px] md:text-xs font-medium uppercase tracking-wider"
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

        {/* Insight + trend widgets */}
        <div className="lg:col-span-4 flex flex-col gap-5">
          <motion.div
            initial={{ opacity: 0, x: 16 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, margin: "-60px" }}
            transition={{ duration: 0.6, delay: 0.15 }}
          >
            <GlassPanel hover={false} className="p-6 relative overflow-hidden">
              <div className="absolute top-0 left-0 w-1 h-full" style={{ background: "hsl(var(--primary))" }} />
              <div
                className="text-[10px] font-bold tracking-[0.22em] mb-3 uppercase"
                style={{ color: "hsl(var(--primary))" }}
              >
                AI Insight
              </div>
              <p className="text-sm leading-relaxed italic" style={{ color: "var(--text-secondary)" }}>
                "Project quality improved through April and May, while maintainability began declining as complexity grew faster than test coverage."
              </p>
            </GlassPanel>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 16 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, margin: "-60px" }}
            transition={{ duration: 0.6, delay: 0.28 }}
            className="flex flex-col gap-2.5 flex-1"
          >
            <p
              className="text-[10px] font-bold tracking-[0.2em] uppercase px-1"
              style={{ color: "var(--text-tertiary)" }}
            >
              Trend Indicators
            </p>
            {TRENDS.map((trend) => (
              <div
                key={trend.label}
                className="glass-inset flex items-center justify-between px-4 py-3.5 hover:border-white/15 transition-colors"
              >
                <span className="text-sm text-white/90">{trend.label}</span>
                <div
                  className={cn(
                    "flex items-center gap-1 text-sm font-bold tabular-nums",
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
      </div>
    </SectionShell>
  );
}
