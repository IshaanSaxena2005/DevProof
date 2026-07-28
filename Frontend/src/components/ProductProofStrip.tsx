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
        initial={{ opacity: 0, y: 16 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-80px" }}
        transition={{ duration: 0.7 }}
        className="text-center mb-16"
      >
        <SectionTitle align="center">
          Your development activity
          <br />
          <span className="font-light" style={{ color: "var(--text-secondary)" }}>
            is more than a contribution graph.
          </span>
        </SectionTitle>
      </motion.div>

      <GlassPanel hover={false} className="relative p-8 md:p-12 overflow-hidden shadow-2xl">
        <div className="absolute inset-0 pointer-events-none opacity-45"
          style={{
            background:
              "radial-gradient(ellipse at 50% 0%, rgba(119,252,117,0.08), transparent 60%)",
          }}
        />

        {/* Signal chips */}
        <div className="relative flex flex-wrap justify-center gap-3.5 md:gap-4.5 mb-12">
          {SIGNALS.map((signal, idx) => {
            const Icon = signal.icon;
            return (
              <motion.div
                key={signal.label}
                initial={{ opacity: 0, y: 12 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-40px" }}
                transition={{ duration: 0.5, delay: idx * 0.05 }}
                whileHover={{ y: -3, scale: 1.02 }}
                className="glass-inset flex items-center gap-3 px-4.5 py-3 group cursor-default hover:border-white/20 hover:bg-white/[0.06] hover:shadow-[0_8px_24px_-10px_rgba(0,0,0,0.5)] transition-all duration-300"
              >
                <div className="w-8 h-8 rounded-lg bg-white/[0.04] border border-white/10 flex items-center justify-center text-white/50 group-hover:text-primary group-hover:border-primary/40 group-hover:bg-primary/5 transition-all duration-300">
                  <Icon className="w-4.5 h-4.5" />
                </div>
                <span className="text-xs font-semibold text-white/65 group-hover:text-white tracking-wide whitespace-nowrap transition-colors">
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
            <div className="w-px h-12 bg-gradient-to-b from-transparent via-primary/50 to-primary" />
            <ArrowDown className="w-4 h-4 text-primary/80 -mt-1 animate-bounce" style={{ animationDuration: "2s" }} />
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="flex flex-col items-center gap-3"
          >
            <div
              className="px-9 py-4 rounded-full border border-white/[0.12] flex items-center gap-3 shadow-[0_0_40px_rgba(119,252,117,0.12)] hover:border-white/20 transition-all duration-300"
              style={{ background: "rgba(8,9,11,0.55)", backdropFilter: "blur(20px)" }}
            >
              <div className="w-2.5 h-2.5 bg-primary rounded-sm shadow-[0_0_12px_rgba(119,252,117,1)]" />
              <span className="text-sm font-bold tracking-[0.22em] text-white">DEVPROOF</span>
            </div>
            <p className="text-xs font-bold tracking-[0.24em] uppercase" style={{ color: "hsl(var(--primary))" }}>
              Developer Intelligence
            </p>
          </motion.div>
        </div>
      </GlassPanel>
    </SectionShell>
  );
}
