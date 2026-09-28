import { Suspense, lazy, useCallback, useEffect, useRef, useState } from "react";
import type { Application } from "@splinetool/runtime";

const Spline = lazy(() => import("@splinetool/react-spline"));

/**
 * Whether this visitor should get the WebGL scene at all.
 *
 * The scene is purely decorative but costs ~1.4MB gzipped across the Spline
 * runtime's chunks (physics alone is 734kB) plus continuous GPU work. That is a
 * bad trade for anyone in the cases below, so they get the CSS backdrop instead
 * — which is a different visual, not a broken one.
 *
 * Read once at mount rather than subscribed to: a visitor rotating their phone
 * or opening devtools should not trigger a multi-megabyte download mid-session.
 */
function shouldLoadScene(): boolean {
  if (typeof window === "undefined" || typeof window.matchMedia !== "function") return false;

  // A large moving scene is exactly what this setting exists to suppress.
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return false;

  // Phones pay the most for this and benefit the least: the scene sits behind
  // content that fills the viewport, and the battery/thermal cost is real.
  if (window.matchMedia("(max-width: 767px)").matches) return false;

  // Honour an explicit data-saving preference and genuinely slow connections.
  const connection = (
    navigator as Navigator & {
      connection?: { saveData?: boolean; effectiveType?: string };
    }
  ).connection;
  if (connection?.saveData) return false;
  if (typeof connection?.effectiveType === "string" && connection.effectiveType.includes("2g")) return false;

  return true;
}

/**
 * Fixed interactive Spline/WebGL scene behind the entire page.
 *
 * The import is lazy *and* the mount is deferred to idle. Lazy alone was not
 * enough: the chunk left the main bundle but was still requested the moment
 * this component mounted, so it competed with the content of the very page it
 * sits behind. Nothing here is needed for first paint, so the scene waits until
 * the browser is idle and the CSS backdrop below covers the gap.
 */
export default function GlobalBackground() {
  const appRef = useRef<Application | null>(null);
  const [sceneEnabled, setSceneEnabled] = useState(false);

  useEffect(() => {
    if (!shouldLoadScene()) return;

    let cancelled = false;
    const start = () => {
      if (!cancelled) setSceneEnabled(true);
    };

    // The timeout is a ceiling, not a target: a page that never goes idle still
    // gets its background, just late enough to not matter.
    const idle = (
      window as Window & {
        requestIdleCallback?: (cb: () => void, opts?: { timeout: number }) => number;
        cancelIdleCallback?: (handle: number) => void;
      }
    ).requestIdleCallback;

    if (typeof idle === "function") {
      const handle = idle(start, { timeout: 2500 });
      return () => {
        cancelled = true;
        (window as Window & { cancelIdleCallback?: (h: number) => void }).cancelIdleCallback?.(handle);
      };
    }

    // Safari has no requestIdleCallback; a plain delay past first paint is close enough.
    const timer = window.setTimeout(start, 1200);
    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, []);

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
      {/* Static backdrop. Always painted, and the only backdrop for visitors who
          never get the scene — so it has to read as intentional on its own. */}
      <div
        className="absolute inset-0"
        style={{
          background:
            // Alphas are set for what survives the three overlays below, not for
            // how they look in isolation — roughly half of each lands on screen.
            "radial-gradient(60% 50% at 18% 22%, rgba(119,252,117,0.18) 0%, transparent 60%)," +
            "radial-gradient(50% 45% at 82% 30%, rgba(96,165,250,0.14) 0%, transparent 62%)," +
            "radial-gradient(70% 60% at 50% 100%, rgba(119,252,117,0.10) 0%, transparent 70%)," +
            "#080808",
        }}
      />

      {/* Interactive WebGL scene — not a video */}
      {sceneEnabled && (
        <div className="absolute inset-0">
          <Suspense fallback={null}>
            <Spline
              scene="https://prod.spline.design/Slk6b8kz3LRlKiyk/scene.splinecode"
              className="w-full h-full"
              onLoad={handleLoad}
              renderOnDemand={false}
            />
          </Suspense>
        </div>
      )}

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
