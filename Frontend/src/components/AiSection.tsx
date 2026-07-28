import { motion } from "motion/react";
import { MessageSquare, Sparkles, FileCode2, Network, ArrowRight } from "lucide-react";
import { cn } from "../lib/utils";

const ARCHITECTURE = [
  "Measured signals",
  "Structured analytics",
  "Evidence",
  "AI explanation"
];

export default function AiSection() {
  return (
    <section className="relative w-full bg-black py-24 md:py-32">
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
            AI that explains.<br className="hidden md:block" />
            <span className="text-muted-foreground font-light">Not AI that invents.</span>
          </h2>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center max-w-5xl mx-auto">
          
          {/* Architecture Flow */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.7 }}
            className="lg:col-span-5 flex flex-col gap-6"
          >
            <div className="flex flex-col gap-4">
              {ARCHITECTURE.map((step, idx) => (
                <div key={step} className="flex items-center gap-4 group">
                  <div className={cn(
                    "w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs border transition-colors",
                    idx === ARCHITECTURE.length - 1
                      ? "bg-primary/20 text-primary border-primary shadow-[0_0_15px_rgba(119,252,117,0.3)]"
                      : "bg-white/5 text-muted-foreground border-white/10 group-hover:border-white/30"
                  )}>
                    {idx + 1}
                  </div>
                  <span className={cn(
                    "text-sm font-semibold tracking-wide uppercase transition-colors",
                    idx === ARCHITECTURE.length - 1 ? "text-primary" : "text-muted-foreground group-hover:text-foreground"
                  )}>
                    {step}
                  </span>
                  {idx < ARCHITECTURE.length - 1 && (
                    <ArrowRight className="w-4 h-4 text-white/20 ml-auto hidden md:block" />
                  )}
                </div>
              ))}
            </div>
          </motion.div>

          {/* Copilot Interface */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.7, delay: 0.2 }}
            className="lg:col-span-7 flex flex-col rounded-2xl bg-hero-bg border border-white/10 shadow-2xl overflow-hidden"
          >
            {/* Header */}
            <div className="px-6 py-4 border-b border-white/10 bg-white/[0.02] flex items-center gap-3">
              <Sparkles className="w-4 h-4 text-primary" />
              <span className="text-sm font-semibold tracking-wide text-foreground">DevProof Copilot</span>
            </div>

            {/* Chat Area */}
            <div className="p-6 flex flex-col gap-6">
              
              {/* User Message */}
              <div className="flex gap-4 items-start justify-end">
                <div className="bg-white/10 border border-white/10 rounded-2xl rounded-tr-sm px-4 py-3 max-w-[80%] text-sm text-foreground">
                  Why is my testing score low?
                </div>
                <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center shrink-0">
                  <span className="text-xs font-bold text-foreground">U</span>
                </div>
              </div>

              {/* AI Response */}
              <div className="flex gap-4 items-start">
                <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center shrink-0 shadow-[0_0_10px_rgba(119,252,117,0.3)]">
                  <Sparkles className="w-4 h-4 text-primary" />
                </div>
                <div className="flex flex-col gap-4 max-w-[90%]">
                  <div className="bg-black border border-white/10 rounded-2xl rounded-tl-sm px-4 py-4 text-sm text-foreground/90 leading-relaxed">
                    Testing is currently one of this repository's largest engineering gaps. The analysis detected limited test coverage and no integration tests around authentication.
                  </div>
                  
                  {/* Evidence References */}
                  <div className="flex flex-wrap gap-2">
                    <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/5 border border-white/10 text-xs text-muted-foreground hover:bg-white/10 transition-colors cursor-pointer">
                      <FileCode2 className="w-3 h-3 text-primary" />
                      src/auth/routes.ts
                    </div>
                    <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/5 border border-white/10 text-xs text-muted-foreground hover:bg-white/10 transition-colors cursor-pointer">
                      <Network className="w-3 h-3 text-destructive" />
                      Missing Integration Tests
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
