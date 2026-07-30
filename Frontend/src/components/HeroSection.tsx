import { Link } from "react-router-dom";

const GithubIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg {...props} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M15 22v-4a4.8 4.8 0 0 0-1-3.2c3-.3 6-1.5 6-6.5 0-1.4-.5-2.5-1.5-3.4.1-.3.4-1.6-.1-3.3 0 0-1.2-.4-3.8 1.4a12.8 12.8 0 0 0-7 0C6.2 2.6 5 3 5 3c-.5 1.7-.2 3 .1 3.3C4.1 7.2 3.6 8.3 3.6 9.7c0 5 3 6.2 6 6.5-.4.4-.8 1-.9 2-.9.4-3.2.1-4.6-1.3 0 0-.8-1.5-2.2-1.5 0 0-1.4 0 0 1.3 1.2 1.5 2 3.2 2 3.2 1.4 2 4 1.5 4 1.5"/>
  </svg>
);

export default function HeroSection() {
  return (
    <section className="relative min-h-[90vh] lg:min-h-screen flex items-center">
      {/* Premium dark vignette & side overlays for optimal contrast */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            "linear-gradient(to right, rgba(5,5,5,0.72) 0%, rgba(5,5,5,0.3) 50%, transparent 80%), linear-gradient(to top, rgba(5,5,5,0.65) 0%, transparent 60%)",
        }}
      />

      <div className="relative z-10 w-full max-w-7xl mx-auto px-6 lg:px-8 py-24 md:py-32 pt-36 lg:pt-40">
        <div className="max-w-3xl">
          <p
            className="opacity-0 animate-fade-up font-bold tracking-[0.24em] mb-5 text-[10px] md:text-xs uppercase"
            style={{ color: "var(--text-tertiary)", animationDelay: "0.08s" }}
          >
            DEVELOPER INTELLIGENCE • BACKED BY EVIDENCE
          </p>

          <h1
            className="opacity-0 animate-fade-up text-display uppercase mb-6"
            style={{
              fontSize: "clamp(2.75rem, 8vw, 6rem)",
              lineHeight: 0.98,
              letterSpacing: "-0.05em",
              animationDelay: "0.18s",
            }}
          >
            <span style={{ color: "hsl(var(--primary))", textShadow: "0 0 40px rgba(119,252,117,0.15)" }}>PROVE</span> WHAT
            <br /> YOU CAN BUILD.
          </h1>

          <p
            className="opacity-0 animate-fade-up font-medium mb-5 max-w-2xl"
            style={{
              fontSize: "clamp(1.15rem, 2.5vw, 1.6rem)",
              color: "var(--text-primary)",
              animationDelay: "0.35s",
              lineHeight: 1.3,
            }}
          >
            Your developer journey is scattered. DevProof turns it into evidence.
          </p>

          <p
            className="opacity-0 animate-fade-up text-body mb-9 md:mb-11 max-w-xl"
            style={{
              fontSize: "clamp(0.875rem, 1.4vw, 1.025rem)",
              color: "var(--text-secondary)",
              animationDelay: "0.5s",
              lineHeight: 1.6,
            }}
          >
            Connect your projects, coding activity, credentials, and experience to
            understand what you have built, what skills you can actually demonstrate,
            and what you should improve next.
          </p>

          <div
            className="opacity-0 animate-fade-up flex flex-wrap gap-4 font-semibold"
            style={{ animationDelay: "0.65s" }}
          >
            <Link
              to="/login"
              className="flex items-center gap-2.5 text-xs md:text-sm rounded-full cursor-pointer transition-all duration-300 hover:-translate-y-0.5 active:translate-y-0 active:scale-[0.97] shadow-[0_0_24px_rgba(119,252,117,0.25)] hover:shadow-[0_0_36px_rgba(119,252,117,0.45)] hover:brightness-110 shrink-0"
              style={{
                backgroundColor: "hsl(var(--primary))",
                color: "hsl(var(--primary-foreground))",
                padding: "0.95rem 2.25rem",
              }}
            >
              <GithubIcon className="w-5 h-5 transition-transform duration-300 group-hover:scale-110" />
              Connect GitHub
            </Link>

            <Link
              to="/login"
              className="glass-chip text-white text-xs md:text-sm cursor-pointer transition-all duration-300 hover:-translate-y-0.5 active:translate-y-0 active:scale-[0.97] hover:bg-white/[0.12] hover:border-white/30 shrink-0 text-center"
              style={{ padding: "0.95rem 2.25rem" }}
            >
              Explore Demo
            </Link>
          </div>

          <p
            className="opacity-0 animate-fade-up font-light mt-10 text-[11px] md:text-xs flex items-center gap-3"
            style={{ color: "var(--text-tertiary)", animationDelay: "0.8s" }}
          >
            <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse inline-block shadow-[0_0_8px_rgba(119,252,117,0.8)]" />
            Real repositories. Measurable signals. Explainable insights.
          </p>
        </div>
      </div>
    </section>
  );
}
