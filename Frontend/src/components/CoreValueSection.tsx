import { motion } from "motion/react";
import { CheckCircle2 } from "lucide-react";
import { GlassPanel, SectionShell, SectionTitle } from "./Primitives";

const CARDS = [
  {
    number: "01",
    title: "What have I done?",
    items: [
      "Projects",
      "Coding activity",
      "Courses",
      "Credentials",
      "Hackathons",
      "Experience",
    ],
  },
  {
    number: "02",
    title: "What can I prove?",
    items: [
      "Repository evidence",
      "Engineering practices",
      "Problem-solving evidence",
      "Practical skill usage",
      "Verified credentials",
    ],
  },
  {
    number: "03",
    title: "What should I do next?",
    items: [
      "Skill gaps",
      "Project improvements",
      "Engineering weaknesses",
      "Career readiness",
      "Personalized next actions",
    ],
  },
];

export default function CoreValueSection() {
  return (
    <SectionShell
      id="product"
      decor={
        <div className="ambient-glow-white w-[800px] h-[500px] top-0 left-1/2 -translate-x-1/2" />
      }
    >
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-80px" }}
        transition={{ duration: 0.7 }}
        className="mb-12 md:mb-16"
      >
        <SectionTitle>
          From Activity
          <br />
          <span style={{ color: "hsl(var(--primary))" }}>To Evidence.</span>
        </SectionTitle>
      </motion.div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-5 lg:gap-6">
        {CARDS.map((card, idx) => (
          <motion.div
            key={card.number}
            initial={{ opacity: 0, y: 28 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-60px" }}
            transition={{ duration: 0.55, delay: idx * 0.12 }}
          >
            <GlassPanel className="h-full p-7 md:p-8 flex flex-col group hover:-translate-y-1">
              <div className="flex items-center justify-between mb-6">
                <span
                  className="text-[11px] font-bold tracking-[0.28em]"
                  style={{ color: "hsl(var(--primary))" }}
                >
                  {card.number}
                </span>
                <span className="w-8 h-[1px] bg-gradient-to-r from-primary/50 to-transparent" />
              </div>

              <h3 className="text-xl md:text-[1.35rem] font-semibold text-white tracking-tight mb-8 leading-snug">
                {card.title}
              </h3>

              <ul className="flex flex-col gap-3 mt-auto">
                {card.items.map((item) => (
                  <li
                    key={item}
                    className="flex items-start gap-3 text-sm"
                    style={{ color: "var(--text-secondary)" }}
                  >
                    <CheckCircle2
                      className="w-4 h-4 shrink-0 mt-0.5 opacity-80"
                      style={{ color: "hsl(var(--primary))" }}
                    />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </GlassPanel>
          </motion.div>
        ))}
      </div>
    </SectionShell>
  );
}
