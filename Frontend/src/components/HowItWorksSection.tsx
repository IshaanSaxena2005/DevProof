import { motion } from "motion/react";
import { Link, Search, Cpu, TrendingUp } from "lucide-react";
import { GlassPanel, SectionShell, SectionTitle } from "./Primitives";

const STEPS = [
  {
    number: "01",
    title: "Connect",
    description: "Connect GitHub or provide a public repository URL.",
    icon: Link,
  },
  {
    number: "02",
    title: "Analyze",
    description: "DevProof evaluates measurable engineering signals across your work.",
    icon: Search,
  },
  {
    number: "03",
    title: "Correlate",
    description: "Projects, skills, learning, and activity become structured evidence.",
    icon: Cpu,
  },
  {
    number: "04",
    title: "Improve",
    description: "Receive explainable insights and actionable next steps.",
    icon: TrendingUp,
  },
];

export default function HowItWorksSection() {
  return (
    <SectionShell>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-80px" }}
        transition={{ duration: 0.7 }}
        className="text-center mb-12 md:mb-14"
      >
        <SectionTitle align="center">
          From Repository
          <br className="hidden md:block" />
          <span style={{ color: "hsl(var(--primary))" }}> To Intelligence.</span>
        </SectionTitle>
      </motion.div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-5 relative">
        {/* Desktop connector */}
        <div className="hidden lg:block absolute top-[3.25rem] left-[12%] right-[12%] h-px bg-gradient-to-r from-transparent via-white/15 to-transparent z-0" />

        {STEPS.map((step, idx) => {
          const Icon = step.icon;
          return (
            <motion.div
              key={step.number}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-60px" }}
              transition={{ duration: 0.55, delay: idx * 0.1 }}
              className="relative z-10"
            >
              <GlassPanel className="h-full p-6 flex flex-col gap-5 group hover:-translate-y-1">
                <div className="flex items-center justify-between">
                  <div
                    className="w-12 h-12 rounded-xl flex items-center justify-center border border-white/10 transition-all duration-300 group-hover:border-primary/40 group-hover:shadow-[0_0_20px_rgba(119,252,117,0.2)]"
                    style={{ background: "rgba(255,255,255,0.04)" }}
                  >
                    <Icon className="w-5 h-5" style={{ color: "hsl(var(--primary))" }} />
                  </div>
                  <span
                    className="text-[11px] font-bold tracking-[0.28em]"
                    style={{ color: "hsl(var(--primary))" }}
                  >
                    {step.number}
                  </span>
                </div>

                <h3 className="text-lg font-bold text-white tracking-tight">{step.title}</h3>

                <p className="text-sm leading-relaxed" style={{ color: "var(--text-secondary)" }}>
                  {step.description}
                </p>
              </GlassPanel>
            </motion.div>
          );
        })}
      </div>
    </SectionShell>
  );
}
