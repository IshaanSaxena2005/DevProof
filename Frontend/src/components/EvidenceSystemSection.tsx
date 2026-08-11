import { motion } from "motion/react";
import { Check, AlertTriangle } from "lucide-react";
import { cn } from "../lib/utils";
import { GlassPanel, PanelHeader, SectionShell, SectionTitle, WindowDots } from "./Primitives";

const STEPS = [
  "Claimed",
  "Learned",
  "Credential Verified",
  "Practically Evidenced",
];

function StatusItem({
  label,
  value,
  isPositive,
}: {
  label: string;
  value: React.ReactNode;
  isPositive?: boolean;
}) {
  return (
    <div className="flex items-center justify-between py-2 border-b border-white/[0.05] last:border-0">
      <span className="text-sm" style={{ color: "var(--text-tertiary)" }}>
        {label}
      </span>
      <div
        className={cn("text-sm font-medium", isPositive ? "text-primary" : "")}
        style={!isPositive ? { color: "var(--text-secondary)" } : {}}
      >
        {value}
      </div>
    </div>
  );
}

export default function EvidenceSystemSection() {
  return (
    <SectionShell id="evidence">
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-80px" }}
        transition={{ duration: 0.7 }}
        className="text-center mb-10"
      >
        <SectionTitle align="center">
          A skill on your profile
          <br className="hidden md:block" />
          <span className="font-light" style={{ color: "var(--text-secondary)" }}>
            {" "}
            is not the same as proof.
          </span>
        </SectionTitle>
      </motion.div>

      {/* Evidence timeline */}
      <GlassPanel hover={false} className="p-5 md:p-6 mb-6 overflow-hidden shadow-xl">
        <div className="relative flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4 md:gap-3">
          {/* Desktop timeline horizontal line */}
          <div className="absolute top-[22px] left-[8%] right-[8%] h-[2px] bg-gradient-to-r from-transparent via-white/[0.08] to-transparent hidden md:block z-0" />

          {STEPS.map((step, idx) => {
            const isLast = idx === STEPS.length - 1;
            return (
              <motion.div
                key={step}
                initial={{ opacity: 0, y: 10 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: idx * 0.08 }}
                className="relative z-10 flex md:flex-col items-center gap-4 md:gap-3.5 flex-1"
              >
                <div
                  className={cn(
                    "w-11 h-11 rounded-full flex items-center justify-center border font-bold text-xs shrink-0 backdrop-blur-md transition-all duration-300",
                    isLast
                      ? "border-primary text-primary shadow-[0_0_24px_rgba(119,252,117,0.3)]"
                      : "border-white/10 text-white/55 hover:border-white/20"
                  )}
                  style={{
                    background: isLast
                      ? "rgba(119,252,117,0.12)"
                      : "rgba(255,255,255,0.03)",
                  }}
                >
                  {idx + 1}
                </div>
                <span
                  className={cn(
                    "text-[13px] font-semibold tracking-wide text-left md:text-center transition-colors",
                    isLast ? "text-primary" : ""
                  )}
                  style={!isLast ? { color: "var(--text-secondary)" } : {}}
                >
                  {step}
                </span>
              </motion.div>
            );
          })}
        </div>
      </GlassPanel>

      {/* Skill evidence cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {/* Card 1 */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true, margin: "-60px" }}
          transition={{ duration: 0.65 }}
        >
          <GlassPanel hover={true} className="overflow-hidden h-full flex flex-col hover:-translate-y-1 transition-all duration-500 hover:shadow-2xl">
            <PanelHeader>
              <WindowDots />
              <h3 className="font-bold text-white tracking-wide text-sm ml-2">React</h3>
              <div className="ml-auto flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-primary animate-pulse shadow-[0_0_8px_rgba(119,252,117,0.8)]" />
                <span className="text-[10px] font-bold tracking-widest text-primary">LIVE</span>
              </div>
            </PanelHeader>
            <div className="p-4.5 md:p-5 flex flex-col flex-1 justify-between">
              <div className="flex flex-col">
                <StatusItem label="Claimed" value={<Check className="w-4 h-4 text-primary" />} isPositive />
                <StatusItem label="Learned" value={<Check className="w-4 h-4 text-primary" />} isPositive />
                <StatusItem label="Credential Evidence" value={<Check className="w-4 h-4 text-primary" />} isPositive />
                <StatusItem label="Project Evidence" value={<Check className="w-4 h-4 text-primary" />} isPositive />
              </div>
              <div className="mt-4 pt-3.5 border-t border-white/[0.06] flex items-center justify-between">
                <span className="text-sm font-semibold text-white/90">Practical Evidence</span>
                <span
                  className="px-3.5 py-1 rounded-full text-[10px] font-bold tracking-widest border shadow-[0_0_12px_rgba(119,252,117,0.1)]"
                  style={{
                    background: "rgba(119,252,117,0.08)",
                    color: "hsl(var(--primary))",
                    borderColor: "rgba(119,252,117,0.2)",
                  }}
                >
                  STRONG
                </span>
              </div>
            </div>
          </GlassPanel>
        </motion.div>

        {/* Card 2 */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true, margin: "-60px" }}
          transition={{ duration: 0.65 }}
        >
          <GlassPanel hover={true} className="overflow-hidden h-full flex flex-col hover:-translate-y-1 transition-all duration-500 hover:shadow-2xl">
            <PanelHeader>
              <WindowDots />
              <h3 className="font-bold text-white tracking-wide text-sm ml-2">Docker</h3>
              <div className="ml-auto flex items-center gap-2">
                <span className="w-2 h-2 rounded-full" style={{ background: "rgba(234,179,8,0.7)" }} />
                <span className="text-[10px] font-bold tracking-widest" style={{ color: "rgb(234,179,8)" }}>
                  GAP
                </span>
              </div>
            </PanelHeader>
            <div className="p-4.5 md:p-5 flex flex-col flex-1 justify-between">
              <div className="flex flex-col">
                <StatusItem label="Claimed" value={<Check className="w-4 h-4 text-primary" />} isPositive />
                <StatusItem label="Learned" value={<Check className="w-4 h-4 text-primary" />} isPositive />
                <StatusItem label="Project Evidence" value={<span style={{ color: "rgb(234,179,8)" }} className="font-semibold text-xs">Limited</span>} />
                <StatusItem label="Recent Usage" value={<span style={{ color: "rgb(248,113,113)" }} className="font-semibold text-xs">None</span>} />
              </div>
              <div className="mt-4 pt-3.5 border-t border-white/[0.06] flex items-center justify-between">
                <span className="text-sm font-semibold text-white/90">Practical Evidence</span>
                <span
                  className="px-3.5 py-1 rounded-full text-[10px] font-bold tracking-widest border flex items-center gap-1.5"
                  style={{
                    background: "rgba(255,255,255,0.03)",
                    color: "var(--text-secondary)",
                    borderColor: "rgba(255,255,255,0.08)",
                  }}
                >
                  <AlertTriangle className="w-3.5 h-3.5 text-yellow-500" />
                  LIMITED
                </span>
              </div>
            </div>
          </GlassPanel>
        </motion.div>
      </div>
    </SectionShell>
  );
}
