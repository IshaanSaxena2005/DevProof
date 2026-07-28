import { motion } from "motion/react";
import { Code2, GitCommit, Target, Award, Briefcase, FolderGit2, ArrowDown } from "lucide-react";
import { GlassPanel, SectionShell, SectionTitle } from "./Primitives";

const GithubIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg {...props} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M15 22v-4a4.8 4.8 0 0 0-1-3.2c3-.3 6-1.5 6-6.5 0-1.4-.5-2.5-1.5-3.4.1-.3.4-1.6-.1-3.3 0 0-1.2-.4-3.8 1.4a12.8 12.8 0 0 0-7 0C6.2 2.6 5 3 5 3c-.5 1.7-.2 3 .1 3.3C4.1 7.2 3.6 8.3 3.6 9.7c0 5 3 6.2 6 6.5-.4.4-.8 1-.9 2-.9.4-3.2.1-4.6-1.3 0 0-.8-1.5-2.2-1.5 0 0-1.4 0 0 1.3 1.2 1.5 2 3.2 2 3.2 1.4 2 4 1.5 4 1.5"/>
  </svg>
);

const SIGNALS = [
  { icon: GithubIcon, label: "GitHub" },
  { icon: Code2, label: "Code" },
  { icon: GitCommit, label: "Commits" },
  { icon: Target, label: "Problem Solving" },
  { icon: Award, label: "Credentials" },
  { icon: FolderGit2, label: "Projects" },
  { icon: Briefcase, label: "Experience" },
];

export default function ProductProofStrip() {
  return (
    <SectionShell
      id="how-it-works"
      decor={
        <div className="ambient-glow-green w-[700px] h-[400px] top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 animate-glow-pulse" />
      }
    >
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-80px" }}
        transition={{ duration: 0.7 }}
        className="text-center mb-14 md:mb-16"
      >
        <SectionTitle align="center">
          Your development activity
          <br />
          <span className="font-light" style={{ color: "var(--text-secondary)" }}>
            is more than a contribution graph.
          </span>
        </SectionTitle>
      </motion.div>

      <GlassPanel hover={false} className="relative p-6 md:p-10 overflow-hidden">
        <div className="absolute inset-0 pointer-events-none opacity-40"
          style={{
            background:
              "radial-gradient(ellipse at 50% 0%, rgba(119,252,117,0.08), transparent 55%)",
          }}
        />

        {/* Signal chips */}
        <div className="relative flex flex-wrap justify-center gap-3 md:gap-4 mb-10">
          {SIGNALS.map((signal, idx) => {
            const Icon = signal.icon;
            return (
              <motion.div
                key={signal.label}
                initial={{ opacity: 0, y: 12 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-40px" }}
                transition={{ duration: 0.45, delay: idx * 0.06 }}
                className="glass-inset flex items-center gap-2.5 px-4 py-3 group cursor-default hover:border-white/20 transition-all duration-300"
              >
                <div className="w-8 h-8 rounded-lg bg-white/[0.04] border border-white/10 flex items-center justify-center text-white/55 group-hover:text-primary group-hover:border-primary/30 transition-colors">
                  <Icon className="w-4 h-4" />
                </div>
                <span className="text-xs font-medium text-white/65 group-hover:text-white tracking-wide whitespace-nowrap transition-colors">
                  {signal.label}
                </span>
              </motion.div>
            );
          })}
        </div>

        {/* Flow into hub */}
        <div className="relative flex flex-col items-center gap-4">
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="flex flex-col items-center text-white/30"
          >
            <div className="w-px h-10 bg-gradient-to-b from-transparent via-primary/50 to-primary" />
            <ArrowDown className="w-4 h-4 text-primary/70 -mt-1" />
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="flex flex-col items-center gap-3"
          >
            <div
              className="px-8 py-3.5 rounded-full border border-white/15 flex items-center gap-2.5 shadow-[0_0_40px_rgba(119,252,117,0.15)]"
              style={{ background: "rgba(0,0,0,0.35)", backdropFilter: "blur(16px)" }}
            >
              <div className="w-2 h-2 bg-primary rounded-sm shadow-[0_0_10px_rgba(119,252,117,1)]" />
              <span className="text-sm font-bold tracking-[0.2em] text-white">DEVPROOF</span>
            </div>
            <p className="text-xs font-semibold tracking-[0.22em] uppercase" style={{ color: "hsl(var(--primary))" }}>
              Developer Intelligence
            </p>
          </motion.div>
        </div>
      </GlassPanel>
    </SectionShell>
  );
}
