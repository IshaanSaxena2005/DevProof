import { motion } from "motion/react";
import { Check, ArrowRight, AlertTriangle } from "lucide-react";
import { cn } from "../lib/utils";

const STEPS = [
  "Claimed",
  "Learned",
  "Credential Verified",
  "Practically Evidenced",
];

function StatusItem({ label, value, isPositive }: { label: string; value: React.ReactNode; isPositive?: boolean }) {
  return (
    <div className="flex items-center justify-between py-2 border-b border-white/5 last:border-0">
      <span className="text-sm text-muted-foreground">{label}</span>
      <div className={cn("text-sm font-medium", isPositive ? "text-primary" : "text-muted-foreground")}>
        {value}
      </div>
    </div>
  );
}

export default function EvidenceSystemSection() {
  return (
    <section id="evidence" className="relative w-full bg-hero-bg py-24 md:py-32 border-t border-white/5">
      <div className="max-w-7xl mx-auto px-6 lg:px-8">
        {/* Heading */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.7 }}
          className="text-center mb-16 md:mb-24"
        >
          <h2 className="text-2xl md:text-4xl font-bold uppercase tracking-tight text-foreground">
            A skill on your profile<br className="hidden md:block" />
            <span className="text-muted-foreground font-light"> is not the same as proof.</span>
          </h2>
        </motion.div>

        {/* Step Visualization */}
        <div className="mb-20 max-w-4xl mx-auto">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4 md:gap-0 relative">
            {/* Desktop connecting line */}
            <div className="absolute top-1/2 left-0 right-0 h-px bg-white/10 -translate-y-1/2 hidden md:block z-0" />
            
            {STEPS.map((step, idx) => (
              <motion.div
                key={step}
                initial={{ opacity: 0, scale: 0.8 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true, margin: "-100px" }}
                transition={{ duration: 0.5, delay: idx * 0.15 }}
                className="relative z-10 flex flex-row md:flex-col items-center gap-4 md:gap-3 bg-hero-bg px-4 py-2"
              >
                <div className={cn(
                  "w-10 h-10 rounded-full flex items-center justify-center border font-bold text-sm",
                  idx === STEPS.length - 1 
                    ? "bg-primary/10 border-primary text-primary shadow-[0_0_15px_rgba(119,252,117,0.3)]" 
                    : "bg-black border-white/20 text-muted-foreground"
                )}>
                  {idx + 1}
                </div>
                <span className={cn(
                  "text-xs md:text-sm font-semibold uppercase tracking-wider",
                  idx === STEPS.length - 1 ? "text-primary" : "text-muted-foreground"
                )}>
                  {step}
                </span>
                
                {/* Mobile arrows */}
                {idx < STEPS.length - 1 && (
                  <ArrowRight className="w-4 h-4 text-white/20 md:hidden ml-auto" />
                )}
              </motion.div>
            ))}
          </div>
        </div>

        {/* Example Skills Comparison */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-5xl mx-auto">
          {/* React Card */}
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.7 }}
            className="flex flex-col rounded-2xl bg-black border border-white/10 overflow-hidden"
          >
            <div className="px-6 py-4 border-b border-white/10 bg-white/[0.02] flex items-center justify-between">
              <h3 className="font-bold text-lg text-foreground tracking-wide">React</h3>
              <div className="w-2 h-2 rounded-full bg-primary animate-pulse shadow-[0_0_8px_rgba(119,252,117,0.8)]" />
            </div>
            
            <div className="p-6 flex flex-col gap-2">
              <StatusItem label="Claimed" value={<Check className="w-4 h-4" />} isPositive />
              <StatusItem label="Learned" value={<Check className="w-4 h-4" />} isPositive />
              <StatusItem label="Credential Evidence" value={<Check className="w-4 h-4" />} isPositive />
              <StatusItem label="Project Evidence" value={<Check className="w-4 h-4" />} isPositive />
              
              <div className="mt-6 pt-6 border-t border-white/10 flex items-center justify-between">
                <span className="text-sm font-medium text-foreground">Practical Evidence</span>
                <span className="px-3 py-1 rounded-full bg-primary/20 text-primary text-xs font-bold tracking-widest border border-primary/30">
                  STRONG
                </span>
              </div>
            </div>
          </motion.div>

          {/* Docker Card */}
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.7 }}
            className="flex flex-col rounded-2xl bg-black border border-white/10 overflow-hidden"
          >
            <div className="px-6 py-4 border-b border-white/10 bg-white/[0.02] flex items-center justify-between">
              <h3 className="font-bold text-lg text-foreground tracking-wide">Docker</h3>
              <div className="w-2 h-2 rounded-full bg-yellow-500/50" />
            </div>
            
            <div className="p-6 flex flex-col gap-2">
              <StatusItem label="Claimed" value={<Check className="w-4 h-4" />} isPositive />
              <StatusItem label="Learned" value={<Check className="w-4 h-4" />} isPositive />
              <StatusItem label="Project Evidence" value={<span className="text-yellow-500">Limited</span>} />
              <StatusItem label="Recent Usage" value={<span className="text-red-400">None</span>} />
              
              <div className="mt-6 pt-6 border-t border-white/10 flex items-center justify-between">
                <span className="text-sm font-medium text-foreground">Practical Evidence</span>
                <span className="px-3 py-1 rounded-full bg-white/10 text-muted-foreground text-xs font-bold tracking-widest border border-white/20 flex items-center gap-1.5">
                  <AlertTriangle className="w-3 h-3" />
                  LIMITED
                </span>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
