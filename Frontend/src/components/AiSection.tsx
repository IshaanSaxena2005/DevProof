import { motion } from "motion/react";
import { Sparkles, FileCode2, Network, ArrowRight } from "lucide-react";
import { GlassPanel, PanelHeader, SectionShell, SectionTitle, WindowDots } from "./Primitives";

const ARCHITECTURE = [
  "Measured signals",
  "Structured analytics",
  "Evidence",
  "AI explanation",
];

export default function AiSection() {
  return (
    <SectionShell
      decor={
        <div className="ambient-glow-green w-[500px] h-[300px] top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 animate-glow-pulse" />
      }
    >
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-80px" }}
        transition={{ duration: 0.7 }}
        className="text-center mb-16"
      >
        <SectionTitle align="center">
          AI that explains.
          <br className="hidden md:block" />
          <span className="font-light" style={{ color: "var(--text-secondary)" }}>
            {" "}
            Not AI that invents.
          </span>
        </SectionTitle>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch max-w-6xl mx-auto">
        {/* Pipeline panel */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true, margin: "-60px" }}
          transition={{ duration: 0.65 }}
          className="lg:col-span-4"
        >
          <GlassPanel hover={false} className="h-full overflow-hidden shadow-2xl bg-black/[0.15]">
            <PanelHeader>
              <WindowDots />
              <span className="text-sm font-bold text-white/90 ml-2">Evidence Pipeline</span>
            </PanelHeader>
            <div className="p-6 md:p-7 flex flex-col gap-1.5">
              {ARCHITECTURE.map((step, idx) => {
                const isLast = idx === ARCHITECTURE.length - 1;
                return (
                  <div key={step}>
                    <div className="flex items-center gap-4 py-3.5 px-3 rounded-xl hover:bg-white/[0.03] transition-all duration-300 group">
                      <div
                        className="w-9 h-9 rounded-full flex items-center justify-center font-bold text-xs border shrink-0 transition-all duration-300"
                        style={
                          isLast
                            ? {
                                background: "rgba(119,252,117,0.12)",
                                borderColor: "hsl(var(--primary))",
                                color: "hsl(var(--primary))",
                                boxShadow: "0 0 14px rgba(119,252,117,0.35)",
                              }
                            : {
                                background: "rgba(255,255,255,0.03)",
                                borderColor: "rgba(255,255,255,0.08)",
                                color: "var(--text-tertiary)",
                              }
                        }
                      >
                        {idx + 1}
                      </div>
                      <span
                        className="text-sm font-semibold tracking-wide transition-colors group-hover:text-white"
                        style={
                          isLast
                            ? { color: "hsl(var(--primary))" }
                            : { color: "var(--text-secondary)" }
                        }
                      >
                        {step}
                      </span>
                    </div>
                    {!isLast && (
                      <div className="ml-[1.35rem] w-[2px] h-4 bg-white/[0.08]" />
                    )}
                  </div>
                );
              })}
            </div>
          </GlassPanel>
        </motion.div>

        {/* Chat interface */}
        <motion.div
          initial={{ opacity: 0, scale: 0.98 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true, margin: "-60px" }}
          transition={{ duration: 0.65, delay: 0.1 }}
          className="lg:col-span-8"
        >
          <GlassPanel hover={false} className="h-full overflow-hidden flex flex-col shadow-2xl">
            <PanelHeader>
              <WindowDots />
              <div className="flex items-center gap-2.5 ml-2">
                <div
                  className="w-6 h-6 rounded-full border border-white/10 flex items-center justify-center"
                  style={{ background: "rgba(119,252,117,0.1)" }}
                >
                  <Sparkles className="w-3.5 h-3.5" style={{ color: "hsl(var(--primary))" }} />
                </div>
                <span className="text-sm font-bold text-white tracking-wide">
                  DevProof Copilot
                </span>
              </div>
              <div className="ml-auto flex items-center gap-1.5">
                <div
                  className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse"
                  style={{ boxShadow: "0 0 6px rgba(119,252,117,0.8)" }}
                />
                <span className="text-xs font-semibold" style={{ color: "var(--text-tertiary)" }}>
                  Online
                </span>
              </div>
            </PanelHeader>

            <div className="p-6 flex flex-col gap-6 flex-1 bg-black/[0.1]">
              {/* User message */}
              <div className="flex gap-3.5 items-start justify-end">
                <div
                  className="rounded-2xl rounded-tr-sm px-4.5 py-3.5 max-w-[80%] text-sm text-white/95 border border-white/[0.08] shadow-md"
                  style={{ background: "rgba(255,255,255,0.06)", backdropFilter: "blur(12px)" }}
                >
                  Why is my testing score low?
                </div>
                <div
                  className="w-8 h-8 rounded-full flex items-center justify-center shrink-0 border border-white/10 bg-white/[0.08] font-bold text-xs text-white"
                >
                  U
                </div>
              </div>

              {/* AI message */}
              <div className="flex gap-3.5 items-start">
                <div
                  className="w-8 h-8 rounded-full flex items-center justify-center shrink-0 border"
                  style={{
                    background: "rgba(119,252,117,0.1)",
                    borderColor: "rgba(119,252,117,0.2)",
                    boxShadow: "0 0 12px rgba(119,252,117,0.2)",
                  }}
                >
                  <Sparkles className="w-4 h-4" style={{ color: "hsl(var(--primary))" }} />
                </div>
                <div className="flex flex-col gap-3.5 max-w-[85%]">
                  <div
                    className="rounded-2xl rounded-tl-sm px-4.5 py-4 text-sm leading-relaxed border shadow-md"
                    style={{
                      background: "rgba(255,255,255,0.03)",
                      borderColor: "rgba(255,255,255,0.06)",
                      color: "var(--text-secondary)",
                    }}
                  >
                    Testing is currently one of this repository's largest engineering gaps. The
                    analysis detected limited test coverage and no integration tests around
                    authentication.
                  </div>

                  <div className="flex flex-wrap gap-2.5">
                    <div className="glass-chip flex items-center gap-2.5 px-4 py-2 text-xs font-semibold cursor-pointer hover:border-white/25 hover:bg-white/[0.08] transition-all duration-300" style={{ color: "var(--text-secondary)" }}>
                      <FileCode2 className="w-3.5 h-3.5" style={{ color: "hsl(var(--primary))" }} />
                      src/auth/routes.ts
                    </div>
                    <div className="glass-chip flex items-center gap-2.5 px-4 py-2 text-xs font-semibold cursor-pointer hover:border-white/25 hover:bg-white/[0.08] transition-all duration-300" style={{ color: "var(--text-secondary)" }}>
                      <Network className="w-3.5 h-3.5 text-red-400" />
                      Missing Integration Tests
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Fake input bar */}
            <div className="px-6 pb-6 bg-black/[0.1]">
              <div className="glass-inset flex items-center gap-3 px-4.5 py-3 hover:border-white/15 transition-all duration-300">
                <span className="text-sm flex-1 font-medium" style={{ color: "var(--text-tertiary)" }}>
                  Ask about your evidence…
                </span>
                <button
                  className="w-8 h-8 rounded-full flex items-center justify-center transition-all duration-300 hover:scale-105 active:scale-95 shadow-[0_0_12px_rgba(119,252,117,0.3)] hover:brightness-110 cursor-pointer"
                  style={{ background: "hsl(var(--primary))" }}
                >
                  <ArrowRight className="w-4 h-4" style={{ color: "hsl(var(--primary-foreground))" }} />
                </button>
              </div>
            </div>
          </GlassPanel>
        </motion.div>
      </div>
    </SectionShell>
  );
}
