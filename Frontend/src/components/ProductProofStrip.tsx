import { motion } from "motion/react";
import { Github, Code2, GitCommit, Target, Award, Briefcase, FolderGit2 } from "lucide-react";

const SIGNALS = [
  { icon: Github, label: "GitHub" },
  { icon: Code2, label: "Code" },
  { icon: GitCommit, label: "Commits" },
  { icon: Target, label: "Problem Solving" },
  { icon: Award, label: "Credentials" },
  { icon: FolderGit2, label: "Projects" },
  { icon: Briefcase, label: "Experience" },
];

export default function ProductProofStrip() {
  return (
    <section id="how-it-works" className="relative w-full bg-hero-bg py-24 md:py-32 border-t border-white/5 overflow-hidden">
      <div className="max-w-7xl mx-auto px-6 lg:px-8">
        
        {/* Headline */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.7 }}
          className="text-center mb-20"
        >
          <h2 className="text-2xl md:text-4xl font-bold uppercase tracking-tight text-foreground">
            Your development activity<br className="hidden md:block" />
            <span className="text-muted-foreground font-light"> is more than a contribution graph.</span>
          </h2>
        </motion.div>

        {/* Visual Strip */}
        <div className="relative flex flex-col items-center">
          
          {/* Connecting Line */}
          <div className="absolute top-[40px] left-0 right-0 h-px bg-gradient-to-r from-transparent via-white/10 to-transparent hidden md:block" />
          <div className="absolute top-[40px] bottom-0 left-1/2 w-px bg-gradient-to-b from-white/10 to-transparent md:hidden block -translate-x-1/2" />

          {/* Signals Grid */}
          <div className="flex flex-col md:flex-row justify-center items-center gap-6 md:gap-4 lg:gap-8 w-full z-10 mb-16">
            {SIGNALS.map((signal, idx) => {
              const Icon = signal.icon;
              return (
                <motion.div
                  key={signal.label}
                  initial={{ opacity: 0, scale: 0.8 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  viewport={{ once: true, margin: "-50px" }}
                  transition={{ duration: 0.5, delay: idx * 0.1 }}
                  className="flex flex-col items-center gap-3 bg-hero-bg p-2"
                >
                  <div className="w-16 h-16 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-white/10 hover:border-white/20 transition-all cursor-default group relative">
                    <Icon className="w-6 h-6 group-hover:scale-110 transition-transform" />
                    {/* Glowing dot underneath */}
                    <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-2 h-2 rounded-full bg-primary/0 group-hover:bg-primary/50 blur-[2px] transition-all" />
                  </div>
                  <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider text-center max-w-[80px]">
                    {signal.label}
                  </span>
                </motion.div>
              );
            })}
          </div>

          {/* Flowing Down Indicator */}
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            whileInView={{ opacity: 1, height: "40px" }}
            viewport={{ once: true }}
            transition={{ duration: 0.7, delay: 0.5 }}
            className="w-px bg-gradient-to-b from-white/10 via-primary/50 to-primary hidden md:block mb-6 relative"
          >
            {/* Animated dot */}
            <motion.div
              animate={{ y: [0, 40] }}
              transition={{ repeat: Infinity, duration: 1.5, ease: "linear" }}
              className="absolute top-0 left-1/2 -translate-x-1/2 w-1.5 h-4 bg-primary rounded-full blur-[1px]"
            />
          </motion.div>

          {/* Center Hub */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7, delay: 0.7 }}
            className="relative flex flex-col items-center z-10"
          >
            <div className="px-8 py-4 rounded-full bg-black border border-white/10 shadow-[0_0_30px_rgba(119,252,117,0.1)] flex items-center justify-center">
              <span className="text-xl font-bold tracking-widest text-foreground flex items-center gap-2">
                <div className="w-2 h-2 bg-primary rounded-sm shadow-[0_0_8px_rgba(119,252,117,0.8)]" />
                DEVPROOF
              </span>
            </div>
            
            <div className="w-px h-8 bg-gradient-to-b from-white/10 to-transparent my-4" />
            
            <p className="text-sm font-semibold tracking-[0.2em] text-primary uppercase">
              Developer Intelligence
            </p>
          </motion.div>

        </div>
      </div>
    </section>
  );
}
