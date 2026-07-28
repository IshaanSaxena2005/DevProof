import { motion } from "motion/react";
import { FolderGit2, Activity, ShieldAlert, CheckCircle2, ChevronRight } from "lucide-react";
import { cn } from "../lib/utils";

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
    <section id="intelligence" className="relative w-full bg-black py-24 md:py-32">
      <div className="max-w-7xl mx-auto px-6 lg:px-8">
        
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-8 mb-16 md:mb-24">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.7 }}
          >
            <h2 className="text-3xl md:text-5xl font-bold uppercase tracking-tight text-foreground">
              Your Repository.<br />
              <span className="text-muted-foreground font-light">Explained.</span>
            </h2>
          </motion.div>
          
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.7 }}
            className="flex items-center gap-4 bg-white/5 border border-white/10 rounded-full px-6 py-3"
          >
            <FolderGit2 className="w-5 h-5 text-muted-foreground" />
            <span className="text-sm font-medium tracking-wide text-foreground">SpendWise Pro</span>
            <div className="w-px h-4 bg-white/20 mx-2" />
            <div className="flex items-center gap-2 text-sm font-bold">
              <span className="text-muted-foreground">Health</span>
              <span className="text-primary">74<span className="text-muted-foreground text-xs font-normal">/100</span></span>
            </div>
          </motion.div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* Metrics Grid */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.7 }}
            className="lg:col-span-4 flex flex-col gap-3"
          >
            {METRICS.map((metric) => (
              <div 
                key={metric.label}
                className={cn(
                  "flex items-center justify-between p-4 rounded-xl border transition-all cursor-default",
                  metric.isWarning 
                    ? "bg-destructive/10 border-destructive/30 relative overflow-hidden" 
                    : "bg-white/[0.02] border-white/5 hover:bg-white/[0.04]"
                )}
              >
                {metric.isWarning && (
                  <div className="absolute left-0 top-0 bottom-0 w-1 bg-destructive" />
                )}
                <span className={cn("text-sm font-medium", metric.isWarning ? "text-foreground" : "text-muted-foreground")}>
                  {metric.label}
                </span>
                <span className={cn(
                  "font-bold font-mono",
                  metric.isWarning ? "text-destructive" : "text-foreground"
                )}>
                  {metric.score}
                </span>
              </div>
            ))}
          </motion.div>

          {/* Deep Dive Panel */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.7, delay: 0.2 }}
            className="lg:col-span-8 flex flex-col rounded-2xl border border-white/10 bg-hero-bg overflow-hidden"
          >
            {/* Header */}
            <div className="px-6 py-5 border-b border-white/10 bg-white/[0.02] flex flex-wrap items-center gap-3">
              <span className="px-3 py-1 bg-destructive/20 text-destructive text-xs font-bold tracking-widest rounded-full border border-destructive/30">
                SCORE: 38
              </span>
              <ChevronRight className="w-4 h-4 text-muted-foreground" />
              <span className="text-sm font-medium text-foreground tracking-wide">TESTING ANALYSIS</span>
              <span className="ml-auto text-xs text-muted-foreground italic">Illustrative Preview</span>
            </div>

            {/* Body */}
            <div className="p-6 md:p-8 flex flex-col gap-8">
              
              {/* Evidence */}
              <div className="flex flex-col gap-4">
                <div className="flex items-center gap-2 text-xs font-semibold tracking-widest text-muted-foreground uppercase">
                  <Activity className="w-4 h-4" />
                  Evidence Detected
                </div>
                <ul className="flex flex-col gap-3">
                  <li className="flex items-start gap-3 text-sm text-foreground/80">
                    <div className="w-1.5 h-1.5 rounded-full bg-white/20 mt-1.5 shrink-0" />
                    11 test files detected across the repository
                  </li>
                  <li className="flex items-start gap-3 text-sm text-foreground/80">
                    <div className="w-1.5 h-1.5 rounded-full bg-destructive/50 mt-1.5 shrink-0" />
                    Critical authentication paths lack integration coverage
                  </li>
                  <li className="flex items-start gap-3 text-sm text-foreground/80">
                    <div className="w-1.5 h-1.5 rounded-full bg-destructive/50 mt-1.5 shrink-0" />
                    Several core modules have no tests
                  </li>
                </ul>
              </div>

              <div className="h-px w-full bg-white/5" />

              {/* Findings */}
              <div className="flex flex-col gap-4">
                <div className="flex items-center gap-2 text-xs font-semibold tracking-widest text-muted-foreground uppercase">
                  <ShieldAlert className="w-4 h-4" />
                  Findings & Actions
                </div>
                
                <div className="flex flex-col gap-4">
                  {/* Negative Finding */}
                  <div className="flex flex-col md:flex-row gap-4 p-4 rounded-xl bg-destructive/5 border border-destructive/20">
                    <div className="flex flex-col gap-1 md:w-32 shrink-0">
                      <span className="text-xs font-bold text-destructive tracking-widest">HIGH</span>
                      <span className="text-xs text-muted-foreground">Action Required</span>
                    </div>
                    <p className="text-sm text-foreground/90 leading-relaxed">
                      Authentication routes lack integration tests. <span className="text-primary cursor-pointer hover:underline">Add integration tests to src/auth/routes.ts</span> to improve score and demonstrate backend reliability.
                    </p>
                  </div>

                  {/* Positive Finding */}
                  <div className="flex flex-col md:flex-row gap-4 p-4 rounded-xl bg-primary/5 border border-primary/20">
                    <div className="flex flex-col gap-1 md:w-32 shrink-0">
                      <span className="text-xs font-bold text-primary tracking-widest">GOOD</span>
                      <span className="text-xs text-muted-foreground">Best Practice</span>
                    </div>
                    <div className="flex items-start gap-2">
                      <CheckCircle2 className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                      <p className="text-sm text-foreground/90 leading-relaxed">
                        Environment secrets are separated from source configuration securely.
                      </p>
                    </div>
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
