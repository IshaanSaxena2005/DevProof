import { motion } from "motion/react";
import { Lock, Shield, EyeOff, Server } from "lucide-react";

const TRUST_ITEMS = [
  { label: "Secure Authentication", icon: Lock },
  { label: "Private Repository Access", icon: Server },
  { label: "Evidence-Based Analysis", icon: Shield },
  { label: "Controlled Integrations", icon: EyeOff },
];

export default function PrivacySecuritySection() {
  return (
    <div className="relative w-full py-8 border-t border-b border-white/[0.06] bg-black/30 backdrop-blur-sm z-20">
      <div className="max-w-7xl mx-auto px-6 lg:px-8">
        <div className="flex flex-wrap items-center justify-center lg:justify-between gap-y-4 gap-x-8">
          <p className="text-[10px] font-bold tracking-[0.2em] uppercase text-white/50 text-center lg:text-left shrink-0">
            SECURITY & PRIVACY:
          </p>
          <div className="flex flex-wrap justify-center items-center gap-x-8 gap-y-3.5">
            {TRUST_ITEMS.map((item, idx) => {
              const Icon = item.icon;
              return (
                <motion.div
                  key={item.label}
                  initial={{ opacity: 0, y: 6 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.4, delay: idx * 0.05 }}
                  className="flex items-center gap-2 group cursor-default"
                >
                  <Icon className="w-4 h-4 text-primary/75 group-hover:text-primary transition-colors" />
                  <span className="text-xs font-semibold text-white/70 group-hover:text-white transition-colors">
                    {item.label}
                  </span>
                </motion.div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
