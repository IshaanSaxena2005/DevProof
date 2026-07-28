import { Suspense, lazy } from "react";
import { Github } from "lucide-react";

// Lazy-load the heavy Spline runtime so it doesn't block initial render
const Spline = lazy(() => import("@splinetool/react-spline"));

export default function HeroSection() {
  return (
    <section className="relative min-h-screen flex items-end bg-hero-bg overflow-hidden">
      {/* ── Spline 3D Background ── */}
      <div className="absolute inset-0">
        <Suspense fallback={<div className="absolute inset-0 bg-hero-bg" />}>
          <Spline
            scene="https://prod.spline.design/Slk6b8kz3LRlKiyk/scene.splinecode"
            className="w-full h-full"
          />
        </Suspense>
      </div>

      {/* ── Dark gradient overlay ── */}
      <div className="absolute inset-0 bg-black/60 z-[1] pointer-events-none" />
      <div className="absolute inset-0 bg-gradient-to-t from-hero-bg via-transparent to-transparent z-[1] pointer-events-none" />

      {/* ── Hero Content (bottom-left, clicks pass through to Spline) ── */}
      <div className="relative z-10 pointer-events-none w-full max-w-[90%] sm:max-w-md lg:max-w-3xl px-6 md:px-10 pb-16 pt-32">
        {/* Eyebrow */}
        <p
          className="opacity-0 animate-fade-up font-semibold tracking-[0.2em] mb-4 text-xs md:text-sm uppercase"
          style={{
            color: "hsl(var(--muted-foreground))",
            animationDelay: "0.1s",
          }}
        >
          DEVELOPER INTELLIGENCE • BACKED BY EVIDENCE
        </p>

        {/* Heading */}
        <h1
          className="opacity-0 animate-fade-up text-foreground mb-4 md:mb-6 uppercase font-bold leading-[1.05] tracking-[-0.05em]"
          style={{
            fontSize: "clamp(3rem, 7vw, 5.5rem)",
            animationDelay: "0.2s",
          }}
        >
          <span style={{ color: "hsl(var(--primary))" }}>PROVE</span> WHAT
          <br /> YOU CAN BUILD.
        </h1>

        {/* Subheading */}
        <p
          className="opacity-0 animate-fade-up font-medium mb-3 md:mb-4"
          style={{
            color: "hsl(var(--foreground))",
            fontSize: "clamp(1.125rem, 2.5vw, 1.75rem)",
            animationDelay: "0.4s",
          }}
        >
          Your developer journey is scattered. DevProof turns it into evidence.
        </p>

        {/* Description */}
        <p
          className="opacity-0 animate-fade-up font-light mb-6 md:mb-10 max-w-2xl"
          style={{
            color: "hsl(var(--muted-foreground))",
            fontSize: "clamp(0.875rem, 1.5vw, 1.125rem)",
            animationDelay: "0.55s",
            lineHeight: 1.6,
          }}
        >
          Connect your projects, coding activity, credentials, and experience to
          understand what you have built, what skills you can actually demonstrate,
          and what you should improve next.
        </p>

        {/* CTA Buttons */}
        <div
          className="opacity-0 animate-fade-up flex flex-wrap gap-4 font-bold"
          style={{ animationDelay: "0.7s" }}
        >
          <button
            className="pointer-events-auto flex items-center gap-2 text-sm rounded-full cursor-pointer transition-all active:scale-[0.97] shadow-[0_0_15px_rgba(119,252,117,0.3)] hover:shadow-[0_0_25px_rgba(119,252,117,0.5)]"
            style={{
              backgroundColor: "hsl(var(--primary))",
              color: "hsl(var(--primary-foreground))",
              padding: "0.875rem 2rem",
            }}
            onMouseEnter={(e) =>
              (e.currentTarget.style.filter = "brightness(1.1)")
            }
            onMouseLeave={(e) => (e.currentTarget.style.filter = "")}
          >
            <Github className="w-5 h-5" />
            Connect GitHub
          </button>

          <button
            className="pointer-events-auto bg-white/5 border border-white/10 text-sm rounded-full cursor-pointer transition-all active:scale-[0.97] hover:bg-white/10 backdrop-blur-md"
            style={{
              color: "hsl(var(--foreground))",
              padding: "0.875rem 2rem",
            }}
          >
            Explore Demo
          </button>
        </div>

        {/* Trust line */}
        <p
          className="opacity-0 animate-fade-up font-light mt-6 md:mt-8 text-xs flex items-center gap-3"
          style={{
            color: "hsl(var(--muted-foreground) / 0.8)",
            animationDelay: "0.85s",
          }}
        >
          <span className="w-1.5 h-1.5 rounded-full bg-primary/80 animate-pulse" />
          Real repositories. Measurable signals. Explainable insights.
        </p>
      </div>
    </section>
  );
}
