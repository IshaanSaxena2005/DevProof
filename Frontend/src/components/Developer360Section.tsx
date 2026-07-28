import { motion } from "motion/react";
import { cn } from "../lib/utils";

const DIMENSIONS = [
  { name: "Frontend", score: 88, color: "bg-primary" },
  { name: "Backend", score: 72, color: "bg-white/80" },
  { name: "Databases", score: 65, color: "bg-white/60" },
  { name: "Problem Solving", score: 92, color: "bg-primary" },
  { name: "Testing", score: 45, color: "bg-white/40" },
  { name: "DevOps", score: 30, color: "bg-white/20" },
  { name: "Security", score: 55, color: "bg-white/50" },
];

export default function Developer360Section() {
  return (
    <section className="relative w-full bg-hero-bg py-24 md:py-32 border-t border-white/5">
      <div className="max-w-7xl mx-auto px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          
          {/* Text Content */}
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.7 }}
            className="flex flex-col gap-6"
          >
            <h2 className="text-3xl md:text-5xl font-bold uppercase tracking-tight text-foreground">
              One Developer.<br />
              <span style={{ color: "hsl(var(--primary))" }}>Multiple Signals.</span>
            </h2>
            <p className="text-lg text-muted-foreground leading-relaxed max-w-md font-light">
              DevProof correlates evidence across projects, activity, learning, and experience instead of judging developers from a single platform.
            </p>
          </motion.div>

          {/* Horizontal Bars Visualization */}
          <div className="flex flex-col gap-6 p-8 rounded-2xl bg-black border border-white/10 shadow-2xl relative">
            <div className="absolute inset-0 bg-gradient-to-tr from-primary/5 to-transparent rounded-2xl pointer-events-none" />
            
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold tracking-widest text-muted-foreground uppercase">Skill Dimension</span>
              <span className="text-xs font-semibold tracking-widest text-muted-foreground uppercase">Evidence Level</span>
            </div>

            {DIMENSIONS.map((dim, idx) => (
              <div key={dim.name} className="flex flex-col gap-2 z-10">
                <div className="flex justify-between items-end">
                  <span className="text-sm font-medium text-foreground">{dim.name}</span>
                  <span className="text-xs text-muted-foreground font-mono">{dim.score}%</span>
                </div>
                <div className="w-full h-1.5 bg-white/5 rounded-full overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    whileInView={{ width: `${dim.score}%` }}
                    viewport={{ once: true, margin: "-100px" }}
                    transition={{ duration: 1, delay: 0.2 + (idx * 0.1), ease: "easeOut" }}
                    className={cn("h-full rounded-full shadow-[0_0_10px_currentColor]", dim.color)}
                  />
                </div>
              </div>
            ))}
          </div>

        </div>
      </div>
    </section>
  );
}
