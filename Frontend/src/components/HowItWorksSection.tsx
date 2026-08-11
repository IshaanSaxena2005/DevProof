import { motion } from "motion/react";
import { Link, Search, TrendingUp } from "lucide-react";
import { SectionShell, SectionTitle } from "./Primitives";

const STEPS = [
  {
    number: "01",
    title: "Connect",
    description: "Connect GitHub and developer sources.",
    icon: Link,
  },
  {
    number: "02",
    title: "Analyze",
    description: "DevProof analyzes engineering evidence.",
    icon: Search,
  },
  {
    number: "03",
    title: "Improve",
    description: "Get actionable engineering and career insights.",
    icon: TrendingUp,
  },
];

export default function HowItWorksSection() {
  return (
    <SectionShell id="how-it-works">
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-80px" }}
        transition={{ duration: 0.7 }}
        className="text-center mb-10"
      >
        <SectionTitle align="center">
          How It
          <span style={{ color: "hsl(var(--primary))" }}> Works.</span>
        </SectionTitle>
      </motion.div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 relative">
        {/* Connector line */}
        <div className="hidden md:block absolute top-[2.5rem] left-[15%] right-[15%] h-[1px] bg-gradient-to-r from-transparent via-white/[0.08] to-transparent z-0" />

        {STEPS.map((step, idx) => {
          const Icon = step.icon;
          return (
            <motion.div
              key={step.number}
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: idx * 0.08 }}
              className="relative z-10 text-center"
            >
              <div className="flex flex-col items-center gap-3">
                <div
                  className="w-11 h-11 rounded-xl flex items-center justify-center border border-white/10 transition-all duration-300 bg-white/[0.02]"
                >
                  <Icon className="w-4.5 h-4.5 text-primary" />
                </div>
                <div>
                  <span className="text-[9px] font-bold tracking-[0.3em] uppercase text-primary">
                    {step.number} • {step.title}
                  </span>
                  <p className="text-xs text-white/70 max-w-xs mx-auto mt-1 leading-relaxed">
                    {step.description}
                  </p>
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>
    </SectionShell>
  );
}
