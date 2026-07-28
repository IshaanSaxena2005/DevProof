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
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-14 items-center">
        <motion.div
          initial={{ opacity: 0, x: -28 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.7 }}
          className="lg:col-span-5 flex flex-col gap-6"
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
          <GlassPanel hover={false} className="p-4 md:p-5 flex flex-col gap-3 shadow-2xl">
            {HIGHLIGHTS.map((item, idx) => {
              const Icon = item.icon;
              return (
                <motion.div
                  key={item.label}
                  initial={{ opacity: 0, x: 16 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: 0.12 + idx * 0.06 }}
                  whileHover={{ x: 4 }}
                  className="glass-inset flex items-center gap-4.5 p-4 hover:border-white/18 hover:bg-white/[0.05] transition-all duration-300 group cursor-default"
                >
                  <div
                    className="w-10 h-10 rounded-lg border border-white/10 flex items-center justify-center shrink-0 transition-all duration-300 group-hover:border-primary/40 group-hover:shadow-[0_0_16px_rgba(119,252,117,0.15)] group-hover:bg-primary/5"
                    style={{ background: "rgba(119,252,117,0.06)" }}
                  >
                    <Icon className="w-5 h-5 text-primary group-hover:scale-110 transition-transform duration-300" />
                  </div>
                  <span className="text-sm md:text-base font-semibold text-white/90 tracking-wide transition-colors group-hover:text-white">
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
