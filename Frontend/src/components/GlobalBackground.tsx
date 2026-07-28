import { Suspense, lazy } from "react";

const Spline = lazy(() => import("@splinetool/react-spline"));

/**
 * Fixed cinematic 3D scene behind the entire page.
 * Sections float above with glass surfaces + soft veils.
 */
export default function GlobalBackground() {
  return (
    <div
      className="fixed inset-0 z-0 pointer-events-none overflow-hidden spline-bg"
      aria-hidden="true"
    >
      <Suspense fallback={<div className="absolute inset-0 bg-[#050505]" />}>
        <Spline
          scene="https://prod.spline.design/Slk6b8kz3LRlKiyk/scene.splinecode"
          className="w-full h-full"
        />
      </Suspense>

      {/* Global readability overlays — keep scene visible, never flat black */}
      <div className="absolute inset-0 bg-black/25" />
      <div
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse 70% 55% at 72% 38%, transparent 0%, rgba(0,0,0,0.4) 100%)",
        }}
      />
      <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-transparent to-black/45" />
    </div>
  );
}
