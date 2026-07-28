import { motion } from "motion/react";
import { Lock, Shield, EyeOff, Server, Trash2 } from "lucide-react";
import { GlassPanel, SectionLead, SectionShell, SectionTitle } from "./Primitives";

const HIGHLIGHTS = [
  { label: "Least-privilege repository access", icon: Shield },
  { label: "Private repository isolation", icon: Server },
  { label: "Secure authentication flow", icon: Lock },
  { label: "Explainable, transparent analysis", icon: EyeOff },
  { label: "Account and data deletion controls", icon: Trash2 },
];

export default function PrivacySecuritySection() {
  return (
    <SectionShell
      decor={
        <div className="ambient-glow-green w-[700px] h-[700px] top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 animate-glow-pulse" />
      }
    >
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-12 items-center">
        <motion.div
          initial={{ opacity: 0, x: -28 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.7 }}
          className="lg:col-span-5 flex flex-col gap-5"
        >
          <SectionTitle>
            Your Code.
            <br />
            Your Evidence.
            <br />
            <span style={{ color: "hsl(var(--primary))" }}>Your Control.</span>
          </SectionTitle>
          <SectionLead>
            We access only what we need, analyze what you share, and never store raw code.
          </SectionLead>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, x: 28 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.7, delay: 0.1 }}
          className="lg:col-span-7"
        >
          <GlassPanel hover={false} className="p-3 md:p-4 flex flex-col gap-2">
            {HIGHLIGHTS.map((item, idx) => {
              const Icon = item.icon;
              return (
                <motion.div
                  key={item.label}
                  initial={{ opacity: 0, x: 16 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: 0.2 + idx * 0.07 }}
                  className="glass-inset flex items-center gap-4 p-4 hover:border-white/18 transition-all group"
                >
                  <div
                    className="w-10 h-10 rounded-lg border border-white/10 flex items-center justify-center shrink-0 transition-all group-hover:border-primary/30 group-hover:shadow-[0_0_16px_rgba(119,252,117,0.15)]"
                    style={{ background: "rgba(119,252,117,0.08)" }}
                  >
                    <Icon className="w-5 h-5" style={{ color: "hsl(var(--primary))" }} />
                  </div>
                  <span className="text-sm md:text-base font-medium text-white tracking-wide">
                    {item.label}
                  </span>
                </motion.div>
              );
            })}
          </GlassPanel>
        </motion.div>
      </div>
    </SectionShell>
  );
}
