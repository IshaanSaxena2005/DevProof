import { Suspense, lazy, useCallback, useEffect, useRef } from "react";
import type { Application } from "@splinetool/runtime";

const Spline = lazy(() => import("@splinetool/react-spline"));

/**
 * Fixed interactive Spline/WebGL scene behind the entire page.
 * Uses Spline global mouse events so lighting/parallax stay live
 * while content scrolls above.
 */
export default function GlobalBackground() {
  const appRef = useRef<Application | null>(null);

  const handleLoad = useCallback((app: Application) => {
    appRef.current = app;

    // Drive mouse lighting/parallax from the window, not only the canvas.
    // Required when UI content sits above the fixed scene.
    app.setGlobalEvents(true);

    // Cap pixel ratio for smoother GPU performance without killing fidelity.
    const canvas = app.canvas;
    if (canvas) {
      const gl =
        canvas.getContext("webgl2", { powerPreference: "high-performance" }) ||
        canvas.getContext("webgl", { powerPreference: "high-performance" });
      void gl;

      const dpr = Math.min(window.devicePixelRatio || 1, 1.5);
      canvas.style.width = "100%";
      canvas.style.height = "100%";
      // Hint to the runtime via CSS size; Spline manages buffer resize.
      if (typeof (app as Application & { _renderer?: { setPixelRatio?: (n: number) => void } })._renderer?.setPixelRatio === "function") {
        (app as Application & { _renderer: { setPixelRatio: (n: number) => void } })._renderer.setPixelRatio(dpr);
      }
    }

    // Keep scroll on the page — don't let the canvas eat wheel events.
    canvas?.addEventListener(
      "wheel",
      (e) => {
        e.stopPropagation();
      },
      { passive: true }
    );
  }, []);

  useEffect(() => {
    const onVisibility = () => {
      const app = appRef.current;
      if (!app) return;
      if (document.hidden) {
        app.stop();
      } else if (app.isStopped) {
        app.play();
      }
    };

    document.addEventListener("visibilitychange", onVisibility);
    return () => {
      document.removeEventListener("visibilitychange", onVisibility);
      appRef.current?.dispose();
      appRef.current = null;
    };
  }, []);

  return (
    <div
      className="fixed inset-0 z-0 overflow-hidden spline-bg"
      aria-hidden="true"
    >
      {/* Interactive WebGL scene — not a video */}
      <div className="absolute inset-0">
        <Suspense fallback={<div className="absolute inset-0 bg-[#080808]" />}>
          <Spline
            scene="https://prod.spline.design/Slk6b8kz3LRlKiyk/scene.splinecode"
            className="w-full h-full"
            onLoad={handleLoad}
            renderOnDemand={false}
          />
        </Suspense>
      </div>

      {/* Soft readability overlays only — pointer-events none so Spline stays interactive.
          Matches original template layering (no backdrop-blur / no fake CSS light). */}
      <div className="absolute inset-0 bg-black/40 pointer-events-none" />
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            "linear-gradient(to right, rgba(0,0,0,0.45) 0%, transparent 55%)",
        }}
      />
      <div className="absolute inset-0 bg-gradient-to-b from-black/35 via-transparent to-black/50 pointer-events-none" />
    </div>
  );
}
