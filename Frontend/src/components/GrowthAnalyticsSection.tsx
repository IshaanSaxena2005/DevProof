import { motion } from "motion/react";
import { TrendingUp, TrendingDown, Info, BarChart2 } from "lucide-react";
import { cn } from "../lib/utils";

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
    <section id="growth" className="relative w-full bg-black py-24 md:py-32">
      <div className="max-w-7xl mx-auto px-6 lg:px-8">
        
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.7 }}
          className="text-center mb-16 md:mb-24"
        >
          <h2 className="text-3xl md:text-5xl font-bold uppercase tracking-tight text-foreground">
            See how your engineering<br className="hidden md:block" />
            <span style={{ color: "hsl(var(--primary))" }}>Evolves.</span>
          </h2>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* Chart Panel */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.7 }}
            className="lg:col-span-8 flex flex-col p-6 md:p-8 rounded-2xl bg-hero-bg border border-white/10"
          >
            <div className="flex items-center justify-between mb-8">
              <div className="flex items-center gap-2 text-foreground font-semibold uppercase tracking-wide text-sm">
                <BarChart2 className="w-4 h-4 text-primary" />
                Engineering Score Trend
              </div>
              <span className="text-xs text-muted-foreground italic flex items-center gap-1">
                <Info className="w-3 h-3" />
                Demo Analytics
              </span>
            </div>

            {/* Simple Bar Chart */}
            <div className="h-64 flex items-end justify-between gap-4 mt-auto">
              {CHART_DATA.map((data, idx) => {
                const heightPercent = (data.score / maxScore) * 100;
                const isLatest = idx === CHART_DATA.length - 1;
                return (
                  <div key={data.month} className="flex flex-col items-center gap-4 flex-1 group">
                    <span className={cn(
                      "text-xs font-mono transition-colors", 
                      isLatest ? "text-primary font-bold" : "text-muted-foreground group-hover:text-foreground"
                    )}>
                      {data.score}
                    </span>
                    <div className="w-full max-w-[60px] h-full bg-white/5 rounded-t-md relative overflow-hidden flex items-end">
                      <motion.div
                        initial={{ height: 0 }}
                        whileInView={{ height: `${heightPercent}%` }}
                        viewport={{ once: true, margin: "-100px" }}
                        transition={{ duration: 1, delay: 0.2 + (idx * 0.15), type: "spring" }}
                        className={cn(
                          "w-full rounded-t-md transition-colors",
                          isLatest ? "bg-primary shadow-[0_0_15px_rgba(119,252,117,0.3)]" : "bg-white/20 group-hover:bg-white/40"
                        )}
                      />
                    </div>
                    <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                      {data.month}
                    </span>
                  </div>
                );
              })}
            </div>
          </motion.div>

          {/* Insights & Trends */}
          <div className="lg:col-span-4 flex flex-col gap-6">
            
            {/* Insight Card */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true, margin: "-100px" }}
              transition={{ duration: 0.7, delay: 0.2 }}
              className="p-6 rounded-2xl bg-black border border-white/10 relative overflow-hidden"
            >
              <div className="absolute top-0 left-0 w-1 h-full bg-primary" />
              <div className="text-xs font-bold text-primary tracking-widest mb-3 uppercase">AI Insight</div>
              <p className="text-sm text-foreground/80 leading-relaxed italic">
                "Project quality improved significantly through April and May, while maintainability began declining as complexity grew faster than test coverage."
              </p>
            </motion.div>

            {/* Trends List */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true, margin: "-100px" }}
              transition={{ duration: 0.7, delay: 0.4 }}
              className="flex flex-col gap-3"
            >
              <h3 className="text-xs font-semibold tracking-widest text-muted-foreground uppercase mb-2">Trend Indicators</h3>
              {TRENDS.map((trend) => (
                <div key={trend.label} className="flex items-center justify-between p-4 rounded-xl bg-hero-bg border border-white/5">
                  <span className="text-sm text-foreground">{trend.label}</span>
                  <div className={cn(
                    "flex items-center gap-1 text-sm font-bold",
                    trend.isPositive ? "text-primary" : "text-destructive"
                  )}>
                    {trend.isPositive ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
                    {trend.value}
                  </div>
                </div>
              ))}
            </motion.div>
          </div>

        </div>
      </div>
    </section>
  );
}
