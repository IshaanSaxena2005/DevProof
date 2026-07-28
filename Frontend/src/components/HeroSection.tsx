const GithubIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg {...props} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M15 22v-4a4.8 4.8 0 0 0-1-3.2c3-.3 6-1.5 6-6.5 0-1.4-.5-2.5-1.5-3.4.1-.3.4-1.6-.1-3.3 0 0-1.2-.4-3.8 1.4a12.8 12.8 0 0 0-7 0C6.2 2.6 5 3 5 3c-.5 1.7-.2 3 .1 3.3C4.1 7.2 3.6 8.3 3.6 9.7c0 5 3 6.2 6 6.5-.4.4-.8 1-.9 2-.9.4-3.2.1-4.6-1.3 0 0-.8-1.5-2.2-1.5 0 0-1.4 0 0 1.3 1.2 1.5 2 3.2 2 3.2 1.4 2 4 1.5 4 1.5"/>
  </svg>
);

export default function HeroSection() {
  return (
    <section className="relative min-h-screen flex items-end">
      {/* Local readability gradient — 3D scene shows through */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            "linear-gradient(to right, rgba(0,0,0,0.55) 0%, rgba(0,0,0,0.2) 45%, transparent 70%), linear-gradient(to top, rgba(0,0,0,0.55) 0%, transparent 55%)",
        }}
      />

      <div className="relative z-10 w-full max-w-7xl mx-auto px-6 lg:px-8 pb-20 md:pb-28 pt-36">
        <div className="max-w-3xl">
          <p
            className="opacity-0 animate-fade-up font-semibold tracking-[0.22em] mb-5 text-[11px] md:text-xs uppercase"
            style={{ color: "var(--text-secondary)", animationDelay: "0.1s" }}
          >
            DEVELOPER INTELLIGENCE • BACKED BY EVIDENCE
          </p>

          <h1
            className="opacity-0 animate-fade-up text-display uppercase mb-5 md:mb-6"
            style={{
              fontSize: "clamp(3rem, 7.5vw, 5.75rem)",
              animationDelay: "0.2s",
            }}
          >
            <span style={{ color: "hsl(var(--primary))" }}>PROVE</span> WHAT
            <br /> YOU CAN BUILD.
          </h1>

          <p
            className="opacity-0 animate-fade-up font-medium mb-4 md:mb-5"
            style={{
              fontSize: "clamp(1.15rem, 2.4vw, 1.55rem)",
              color: "var(--text-primary)",
              animationDelay: "0.4s",
              lineHeight: 1.35,
            }}
          >
            Your developer journey is scattered. DevProof turns it into evidence.
          </p>

          <p
            className="opacity-0 animate-fade-up text-body mb-8 md:mb-10 max-w-2xl"
            style={{
              fontSize: "clamp(0.9rem, 1.4vw, 1.05rem)",
              animationDelay: "0.55s",
            }}
          >
            Connect your projects, coding activity, credentials, and experience to
            understand what you have built, what skills you can actually demonstrate,
            and what you should improve next.
          </p>

          <div
            className="opacity-0 animate-fade-up flex flex-wrap gap-3.5 font-semibold"
            style={{ animationDelay: "0.7s" }}
          >
            <button
              className="flex items-center gap-2 text-sm rounded-full cursor-pointer transition-all active:scale-[0.97] shadow-[0_0_24px_rgba(119,252,117,0.35)] hover:shadow-[0_0_36px_rgba(119,252,117,0.55)] hover:brightness-110"
              style={{
                backgroundColor: "hsl(var(--primary))",
                color: "hsl(var(--primary-foreground))",
                padding: "0.9rem 2rem",
              }}
            >
              <GithubIcon className="w-5 h-5" />
              Connect GitHub
            </button>

            <button
              className="glass-chip text-white text-sm cursor-pointer transition-all active:scale-[0.97] hover:bg-white/15 hover:border-white/25"
              style={{ padding: "0.9rem 2rem" }}
            >
              Explore Demo
            </button>
          </div>

          <p
            className="opacity-0 animate-fade-up font-light mt-8 text-xs flex items-center gap-3"
            style={{ color: "var(--text-tertiary)", animationDelay: "0.85s" }}
          >
            <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse inline-block shadow-[0_0_8px_rgba(119,252,117,0.8)]" />
            Real repositories. Measurable signals. Explainable insights.
          </p>
        </div>
      </div>
    </section>
  );
}
