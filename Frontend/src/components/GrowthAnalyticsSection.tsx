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
        initial={{ opacity: 0, y: 16 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-80px" }}
        transition={{ duration: 0.7 }}
        className="text-center mb-10"
      >
        <SectionTitle align="center">
          See how your engineering
          <br className="hidden md:block" />
          <span style={{ color: "hsl(var(--primary))" }}> Evolves.</span>
        </SectionTitle>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
        {/* Chart widget */}
        <motion.div
          initial={{ opacity: 0, scale: 0.98 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true, margin: "-60px" }}
          transition={{ duration: 0.65 }}
          className="lg:col-span-8"
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

            <div className="p-5 md:p-6">
              <div className="h-48 flex items-end justify-between gap-4 md:gap-8">
                {CHART_DATA.map((data, idx) => {
                  const heightPercent = (data.score / maxScore) * 100;
                  const isLatest = idx === CHART_DATA.length - 1;
                  return (
                    <div key={data.month} className="flex flex-col items-center gap-3.5 flex-1 group h-full">
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
                            boxShadow: isLatest ? "0 0 24px rgba(119,252,117,0.3)" : "none",
                          }}
                        />
                      </div>
                      <span
                        className="text-[10px] md:text-xs font-semibold uppercase tracking-wider"
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
        <div className="lg:col-span-4 flex flex-col gap-4">
          <motion.div
            initial={{ opacity: 0, x: 16 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, margin: "-60px" }}
            transition={{ duration: 0.6, delay: 0.1 }}
          >
            <GlassPanel hover={true} className="p-4 md:p-5 relative overflow-hidden transition-all duration-500 hover:-translate-y-1 hover:shadow-2xl">
              <div className="absolute top-0 left-0 w-1 h-full" style={{ background: "hsl(var(--primary))" }} />
              <div
                className="text-[10px] font-bold tracking-[0.24em] mb-2.5 uppercase"
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
            transition={{ duration: 0.6, delay: 0.2 }}
            className="flex flex-col gap-2.5 flex-1 justify-between"
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
                className="glass-inset flex items-center justify-between px-4.5 py-3 hover:border-white/15 transition-all duration-300"
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
      </div>
    </SectionShell>
  );
}
