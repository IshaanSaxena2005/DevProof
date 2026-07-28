import { motion } from "motion/react";
import { Briefcase, Target, ArrowRight, Zap } from "lucide-react";
import { cn } from "../lib/utils";

const DIMENSIONS = [
  { name: "Programming", level: "Strong", score: 85 },
  { name: "Problem Solving", level: "Good", score: 75 },
  { name: "Development", level: "Strong", score: 80 },
  { name: "Databases", level: "Moderate", score: 50 },
  { name: "Testing", level: "Weak", score: 30, isWarning: true },
  { name: "System Design", level: "Limited Evidence", score: 15 },
];

export default function CareerIntelligenceSection() {
  return (
    <section id="career" className="relative w-full bg-hero-bg py-24 md:py-32 border-t border-white/5">
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
            Don't follow a<br className="hidden md:block" />
            <span style={{ color: "hsl(var(--primary))" }}>Generic Roadmap.</span>
          </h2>
          <p className="text-sm md:text-base text-muted-foreground mt-6 max-w-2xl mx-auto leading-relaxed">
            Recommendations should come from what you have actually built — not from a generic checklist.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* Target Role Panel */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.7 }}
            className="lg:col-span-5 flex flex-col p-8 rounded-2xl bg-black border border-white/10"
          >
            <div className="flex items-center gap-3 mb-8 pb-8 border-b border-white/5">
              <div className="w-12 h-12 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center">
                <Briefcase className="w-6 h-6 text-primary" />
              </div>
              <div>
                <div className="text-xs font-semibold text-muted-foreground uppercase tracking-widest mb-1">Target Role</div>
                <div className="text-xl font-bold text-foreground">SDE Intern</div>
              </div>
              <div className="ml-auto text-right">
                <div className="text-xs font-semibold text-muted-foreground uppercase tracking-widest mb-1">Readiness</div>
                <div className="text-xl font-bold text-primary">74%</div>
              </div>
            </div>

            <div className="flex flex-col gap-5">
              <div className="text-xs font-semibold text-muted-foreground uppercase tracking-widest flex items-center gap-2">
                <Target className="w-4 h-4" />
                Skill Breakdown
              </div>
              
              {DIMENSIONS.map((dim) => (
                <div key={dim.name} className="flex items-center justify-between">
                  <span className="text-sm text-foreground/90">{dim.name}</span>
                  <span className={cn(
                    "text-xs font-bold tracking-wider uppercase px-2 py-1 rounded-sm",
                    dim.isWarning ? "text-destructive bg-destructive/10 border border-destructive/20" : 
                    dim.score >= 80 ? "text-primary" : 
                    dim.score >= 60 ? "text-foreground" : "text-muted-foreground"
                  )}>
                    {dim.level}
                  </span>
                </div>
              ))}
            </div>
          </motion.div>

          {/* Action Recommendation */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.7, delay: 0.2 }}
            className="lg:col-span-7 flex flex-col h-full"
          >
            <div className="flex flex-col h-full rounded-2xl bg-gradient-to-br from-primary/5 to-transparent border border-white/10 p-1">
              <div className="flex flex-col h-full bg-hero-bg rounded-xl p-8 overflow-hidden relative">
                {/* Background Glow */}
                <div className="absolute top-0 right-0 w-64 h-64 bg-primary/10 rounded-full blur-[100px] pointer-events-none" />
                
                <div className="flex items-center gap-2 text-xs font-bold text-destructive tracking-widest uppercase mb-4">
                  <Zap className="w-4 h-4" />
                  Largest Current Engineering Gap
                </div>
                
                <h3 className="text-2xl md:text-3xl font-bold text-foreground uppercase tracking-tight mb-8">
                  Automated Testing
                </h3>

                <div className="mt-auto">
                  <div className="text-xs font-semibold text-primary uppercase tracking-widest mb-4">
                    Recommended Next Action
                  </div>
                  
                  <div className="p-6 rounded-xl bg-black border border-white/10 relative group">
                    <div className="absolute left-0 top-0 bottom-0 w-1 bg-primary rounded-l-xl" />
                    <p className="text-base text-foreground/90 leading-relaxed pr-8">
                      Add authentication integration tests and transaction-service unit tests to <span className="text-primary cursor-pointer hover:underline">SpendWise Pro</span>.
                    </p>
                    <ArrowRight className="absolute right-6 top-1/2 -translate-y-1/2 w-5 h-5 text-primary opacity-0 group-hover:opacity-100 transition-opacity" />
                  </div>
                </div>

              </div>
            </div>
          </motion.div>

        </div>
      </div>
    </section>
  );
}
