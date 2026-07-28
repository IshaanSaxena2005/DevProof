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
    <div className="flex items-center justify-between py-2.5 border-b border-white/[0.06] last:border-0">
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
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-80px" }}
        transition={{ duration: 0.7 }}
        className="text-center mb-12 md:mb-16"
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
      <GlassPanel hover={false} className="p-6 md:p-8 mb-8 overflow-hidden">
        <div className="relative flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4 md:gap-2">
          <div className="absolute top-[22px] left-[10%] right-[10%] h-px bg-gradient-to-r from-transparent via-white/15 to-transparent hidden md:block z-0" />

          {STEPS.map((step, idx) => {
            const isLast = idx === STEPS.length - 1;
            return (
              <motion.div
                key={step}
                initial={{ opacity: 0, y: 12 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.45, delay: idx * 0.1 }}
                className="relative z-10 flex md:flex-col items-center gap-3 md:gap-3 flex-1"
              >
                <div
                  className={cn(
                    "w-11 h-11 rounded-full flex items-center justify-center border font-bold text-sm shrink-0 backdrop-blur-md",
                    isLast
                      ? "border-primary text-primary shadow-[0_0_20px_rgba(119,252,117,0.35)]"
                      : "border-white/15 text-white/55"
                  )}
                  style={{
                    background: isLast
                      ? "rgba(119,252,117,0.12)"
                      : "rgba(255,255,255,0.04)",
                  }}
                >
                  {idx + 1}
                </div>
                <span
                  className={cn(
                    "text-xs md:text-sm font-semibold tracking-wide text-left md:text-center",
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
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5 lg:gap-6">
        <motion.div
          initial={{ opacity: 0, x: -24 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true, margin: "-60px" }}
          transition={{ duration: 0.65 }}
        >
          <GlassPanel hover={false} className="overflow-hidden h-full">
            <PanelHeader>
              <WindowDots />
              <h3 className="font-semibold text-white tracking-wide">React</h3>
              <div className="ml-auto flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-primary animate-pulse shadow-[0_0_8px_rgba(119,252,117,0.8)]" />
                <span className="text-[10px] font-bold tracking-widest text-primary">LIVE</span>
              </div>
            </PanelHeader>
            <div className="p-5 md:p-6">
              <StatusItem label="Claimed" value={<Check className="w-4 h-4" />} isPositive />
              <StatusItem label="Learned" value={<Check className="w-4 h-4" />} isPositive />
              <StatusItem label="Credential Evidence" value={<Check className="w-4 h-4" />} isPositive />
              <StatusItem label="Project Evidence" value={<Check className="w-4 h-4" />} isPositive />
              <div className="mt-5 pt-5 border-t border-white/[0.08] flex items-center justify-between">
                <span className="text-sm font-medium text-white">Practical Evidence</span>
                <span
                  className="px-3 py-1 rounded-full text-[10px] font-bold tracking-widest border"
                  style={{
                    background: "rgba(119,252,117,0.12)",
                    color: "hsl(var(--primary))",
                    borderColor: "rgba(119,252,117,0.3)",
                  }}
                >
                  STRONG
                </span>
              </div>
            </div>
          </GlassPanel>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, x: 24 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true, margin: "-60px" }}
          transition={{ duration: 0.65 }}
        >
          <GlassPanel hover={false} className="overflow-hidden h-full">
            <PanelHeader>
              <WindowDots />
              <h3 className="font-semibold text-white tracking-wide">Docker</h3>
              <div className="ml-auto flex items-center gap-2">
                <span className="w-2 h-2 rounded-full" style={{ background: "rgba(234,179,8,0.7)" }} />
                <span className="text-[10px] font-bold tracking-widest" style={{ color: "rgb(234,179,8)" }}>
                  GAP
                </span>
              </div>
            </PanelHeader>
            <div className="p-5 md:p-6">
              <StatusItem label="Claimed" value={<Check className="w-4 h-4" />} isPositive />
              <StatusItem label="Learned" value={<Check className="w-4 h-4" />} isPositive />
              <StatusItem label="Project Evidence" value={<span style={{ color: "rgb(234,179,8)" }}>Limited</span>} />
              <StatusItem label="Recent Usage" value={<span style={{ color: "rgb(248,113,113)" }}>None</span>} />
              <div className="mt-5 pt-5 border-t border-white/[0.08] flex items-center justify-between">
                <span className="text-sm font-medium text-white">Practical Evidence</span>
                <span
                  className="px-3 py-1 rounded-full text-[10px] font-bold tracking-widest border flex items-center gap-1.5"
                  style={{
                    background: "rgba(255,255,255,0.05)",
                    color: "var(--text-secondary)",
                    borderColor: "rgba(255,255,255,0.12)",
                  }}
                >
                  <AlertTriangle className="w-3 h-3" />
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
