import { motion } from "motion/react";
import { Link } from "react-router-dom";
import { GlassPanel } from "./Primitives";

const GithubIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg {...props} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M15 22v-4a4.8 4.8 0 0 0-1-3.2c3-.3 6-1.5 6-6.5 0-1.4-.5-2.5-1.5-3.4.1-.3.4-1.6-.1-3.3 0 0-1.2-.4-3.8 1.4a12.8 12.8 0 0 0-7 0C6.2 2.6 5 3 5 3c-.5 1.7-.2 3 .1 3.3C4.1 7.2 3.6 8.3 3.6 9.7c0 5 3 6.2 6 6.5-.4.4-.8 1-.9 2-.9.4-3.2.1-4.6-1.3 0 0-.8-1.5-2.2-1.5 0 0-1.4 0 0 1.3 1.2 1.5 2 3.2 2 3.2 1.4 2 4 1.5 4 1.5"/>
  </svg>
);

export default function FinalCtaSection() {
  return (
    <section className="relative w-full py-14 md:py-20 lg:py-24 section-divider section-veil overflow-hidden">
      <div className="ambient-glow-green w-[900px] h-[500px] top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 animate-glow-pulse absolute pointer-events-none" />

      <div className="relative max-w-4xl mx-auto px-6 lg:px-8 z-10">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.75 }}
        >
          <GlassPanel
            hover={false}
            className="px-6 py-12 md:px-12 md:py-16 text-center relative overflow-hidden shadow-2xl"
          >
            <div
              className="absolute inset-0 pointer-events-none"
              style={{
                background:
                  "radial-gradient(ellipse at 50% 0%, rgba(119,252,117,0.1), transparent 60%)",
              }}
            />

            <div className="relative z-10 flex flex-col items-center">
              <h2
                className="text-display uppercase mb-4 tracking-tight"
                style={{ fontSize: "clamp(2.2rem, 5.5vw, 3.75rem)", lineHeight: 1.05 }}
              >
                Your work already
                <br />
                tells a story.
              </h2>

              <p
                className="text-lg md:text-xl font-light mb-8"
                style={{ color: "var(--text-secondary)" }}
              >
                DevProof turns it into{" "}
                <span className="font-semibold" style={{ color: "hsl(var(--primary))" }}>
                  evidence
                </span>
                .
              </p>

              <div className="flex flex-col sm:flex-row items-center gap-4">
                <div className="relative group">
                  <div
                    className="absolute -inset-1 rounded-full blur opacity-35 group-hover:opacity-60 transition-opacity duration-500"
                    style={{ background: "hsl(var(--primary))" }}
                  />
                  <Link
                    to="/login"
                    className="relative flex items-center justify-center gap-2.5 font-bold text-xs md:text-sm uppercase tracking-widest px-8 py-4 rounded-full transition-all duration-300 hover:-translate-y-0.5 active:translate-y-0 active:scale-[0.97] hover:brightness-110 shrink-0 text-center"
                    style={{
                      backgroundColor: "hsl(var(--primary))",
                      color: "hsl(var(--primary-foreground))",
                    }}
                  >
                    <GithubIcon className="w-5 h-5" />
                    Connect GitHub
                  </Link>
                </div>

                <Link
                  to="/login"
                  className="glass-chip font-bold text-xs md:text-sm uppercase tracking-widest px-8 py-4 text-white hover:bg-white/12 hover:border-white/25 transition-all duration-300 hover:-translate-y-0.5 active:translate-y-0 active:scale-[0.97] shrink-0 text-center"
                >
                  Explore Demo
                </Link>
              </div>
            </div>
          </GlassPanel>
        </motion.div>
      </div>
    </section>
  );
}
