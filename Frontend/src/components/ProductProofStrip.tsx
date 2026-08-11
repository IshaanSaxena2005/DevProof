import { motion } from "motion/react";
import { Code2, GitCommit, Target, Award, Briefcase, FolderGit2 } from "lucide-react";

const GithubIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg {...props} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M15 22v-4a4.8 4.8 0 0 0-1-3.2c3-.3 6-1.5 6-6.5 0-1.4-.5-2.5-1.5-3.4.1-.3.4-1.6-.1-3.3 0 0-1.2-.4-3.8 1.4a12.8 12.8 0 0 0-7 0C6.2 2.6 5 3 5 3c-.5 1.7-.2 3 .1 3.3C4.1 7.2 3.6 8.3 3.6 9.7c0 5 3 6.2 6 6.5-.4.4-.8 1-.9 2-.9.4-3.2.1-4.6-1.3 0 0-.8-1.5-2.2-1.5 0 0-1.4 0 0 1.3 1.2 1.5 2 3.2 2 3.2 1.4 2 4 1.5 4 1.5"/>
  </svg>
);

const SIGNALS = [
  { icon: GithubIcon, label: "GitHub Repositories" },
  { icon: Code2, label: "Code Integrity" },
  { icon: GitCommit, label: "Commits & Velocity" },
  { icon: Target, label: "Problem Solving" },
  { icon: Award, label: "Credentials & Badges" },
  { icon: FolderGit2, label: "Projects & Impact" },
  { icon: Briefcase, label: "Practical Experience" },
];

export default function ProductProofStrip() {
  return (
    <div className="relative w-full py-6 border-b border-white/[0.06] bg-black/40 backdrop-blur-md z-20">
      <div className="max-w-7xl mx-auto px-6 lg:px-8">
        <div className="flex flex-wrap items-center justify-center lg:justify-between gap-y-4 gap-x-6 md:gap-x-8">
          <p className="text-[10px] font-bold tracking-[0.2em] uppercase text-white/50 text-center lg:text-left shrink-0">
            EVIDENCE INTEGRATION:
          </p>
          <div className="flex flex-wrap justify-center items-center gap-x-6 gap-y-3.5">
            {SIGNALS.map((signal, idx) => {
              const Icon = signal.icon;
              return (
                <motion.div
                  key={signal.label}
                  initial={{ opacity: 0, y: 8 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.4, delay: idx * 0.04 }}
                  className="flex items-center gap-2 group cursor-default"
                >
                  <Icon className="w-4.5 h-4.5 text-primary/70 group-hover:text-primary transition-colors" />
                  <span className="text-xs font-semibold text-white/70 group-hover:text-white transition-colors">
                    {signal.label}
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
