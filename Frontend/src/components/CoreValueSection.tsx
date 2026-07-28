import { motion } from "motion/react";
import { CheckCircle2 } from "lucide-react";

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
    <section id="product" className="relative w-full bg-hero-bg py-24 md:py-32">
      <div className="max-w-7xl mx-auto px-6 lg:px-8">
        {/* Heading */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.7 }}
          className="mb-16 md:mb-24"
        >
          <h2 className="text-3xl md:text-5xl font-bold uppercase tracking-tight text-foreground">
            From Activity<br />
            <span style={{ color: "hsl(var(--primary))" }}>To Evidence.</span>
          </h2>
        </motion.div>

        {/* Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8">
          {CARDS.map((card, idx) => (
            <motion.div
              key={card.number}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-100px" }}
              transition={{ duration: 0.6, delay: idx * 0.15 }}
              className="relative group h-full"
            >
              <div className="absolute inset-0 bg-gradient-to-b from-white/5 to-transparent rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 blur-xl" />
              
              <div className="relative h-full flex flex-col p-8 rounded-2xl bg-black/40 backdrop-blur-sm border border-white/10 hover:border-white/20 transition-all duration-300">
                {/* Number */}
                <span className="text-sm font-bold text-primary mb-6 block tracking-widest">
                  {card.number}
                </span>

                {/* Title */}
                <h3 className="text-xl md:text-2xl font-semibold text-foreground uppercase tracking-wide mb-8">
                  {card.title}
                </h3>

                {/* Items */}
                <ul className="flex flex-col gap-4 mt-auto">
                  {card.items.map((item) => (
                    <li key={item} className="flex items-start gap-3 text-sm text-muted-foreground">
                      <CheckCircle2 className="w-5 h-5 text-primary/70 shrink-0" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
