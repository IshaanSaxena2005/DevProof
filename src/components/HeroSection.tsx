import { Suspense, lazy } from "react";

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
      <div className="absolute inset-0 bg-black/30 z-[1] pointer-events-none" />

      {/* ── Hero Content (bottom-left, clicks pass through to Spline) ── */}
      <div className="relative z-10 pointer-events-none w-full max-w-[90%] sm:max-w-md lg:max-w-2xl px-6 md:px-10 pb-10 pt-32">

        {/* Heading */}
        <h1
          className="opacity-0 animate-fade-up text-foreground mb-2 md:mb-4 uppercase font-bold leading-[1.05] tracking-[-0.05em]"
          style={{
            fontSize: "clamp(3rem, 8vw, 6rem)",
            animationDelay: "0.2s",
          }}
        >
          SENTINEL{" "}
          <span style={{ color: "hsl(var(--primary))" }}>AI</span>
        </h1>

        {/* Subheading */}
        <p
          className="opacity-0 animate-fade-up font-light mb-3 md:mb-6"
          style={{
            color: "hsl(var(--foreground) / 0.8)",
            fontSize: "clamp(1.125rem, 2.5vw, 1.875rem)",
            animationDelay: "0.4s",
          }}
        >
          We implement security correctly.
        </p>

        {/* Description */}
        <p
          className="opacity-0 animate-fade-up font-light mb-4 md:mb-8"
          style={{
            color: "hsl(var(--muted-foreground))",
            fontSize: "clamp(0.875rem, 1.5vw, 1.25rem)",
            animationDelay: "0.55s",
          }}
        >
          Enterprise security systems built in days. AI-powered surveillance
          deployed with zero-trust architecture. Smart access control set up for
          your entire facility. All of it done right, not just fast.
        </p>

        {/* CTA Buttons */}
        <div
          className="opacity-0 animate-fade-up flex flex-wrap gap-3 font-bold"
          style={{ animationDelay: "0.7s" }}
        >
          <button
            className="pointer-events-auto text-sm rounded-sm cursor-pointer transition-all active:scale-[0.97] hover:brightness-110"
            style={{
              backgroundColor: "hsl(var(--primary))",
              color: "hsl(var(--primary-foreground))",
              padding: "0.75rem 1.5rem",
            }}
            onMouseEnter={(e) =>
              (e.currentTarget.style.filter = "brightness(1.1)")
            }
            onMouseLeave={(e) => (e.currentTarget.style.filter = "")}
          >
            Book a Call
          </button>

          <button
            className="pointer-events-auto bg-white text-sm rounded-sm cursor-pointer transition-all active:scale-[0.97]"
            style={{
              color: "hsl(var(--background))",
              padding: "0.75rem 1.5rem",
            }}
            onMouseEnter={(e) =>
              (e.currentTarget.style.filter = "brightness(0.9)")
            }
            onMouseLeave={(e) => (e.currentTarget.style.filter = "")}
          >
            Our Work
          </button>
        </div>

        {/* Trust line */}
        <p
          className="opacity-0 animate-fade-up font-light mt-4 md:mt-6 text-xs"
          style={{
            color: "hsl(var(--muted-foreground) / 0.6)",
            animationDelay: "0.85s",
          }}
        >
          Trusted security partner. Columbus, OH. 12 systems deployed.
        </p>
      </div>
    </section>
  );
}
