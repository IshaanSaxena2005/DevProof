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
        initial={{ opacity: 0, y: 16 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-80px" }}
        transition={{ duration: 0.7 }}
        className="mb-14 md:mb-20"
      >
        <SectionTitle>
          From Activity
          <br />
          <span style={{ color: "hsl(var(--primary))" }}>To Evidence.</span>
        </SectionTitle>
      </motion.div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8">
        {CARDS.map((card, idx) => (
          <motion.div
            key={card.number}
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-60px" }}
            transition={{ duration: 0.6, delay: idx * 0.1 }}
          >
            <GlassPanel className="h-full p-8 flex flex-col group transition-all duration-500 hover:-translate-y-1.5 hover:shadow-2xl">
              <div className="flex items-center justify-between mb-8">
                <span
                  className="text-[10px] font-bold tracking-[0.3em] uppercase"
                  style={{ color: "hsl(var(--primary))" }}
                >
                  {card.number}
                </span>
                <span className="w-10 h-[1px] bg-gradient-to-r from-primary/40 to-transparent group-hover:w-16 transition-all duration-500" />
              </div>

              <h3 className="text-xl md:text-[1.4rem] font-semibold text-white tracking-tight mb-8 leading-snug">
                {card.title}
              </h3>

              <ul className="flex flex-col gap-4 mt-auto">
                {card.items.map((item) => (
                  <li
                    key={item}
                    className="flex items-start gap-3.5 text-[13px] transition-colors duration-300 group-hover:text-white/90"
                    style={{ color: "var(--text-secondary)" }}
                  >
                    <CheckCircle2
                      className="w-4 h-4 shrink-0 mt-0.5 opacity-70 group-hover:opacity-100 transition-opacity duration-300"
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
