import { useMemo, useState } from "react";
import { motion } from "motion/react";

export interface ActivityPoint {
  label: string;
  value: number;
}

/**
 * Area chart drawn directly in SVG — the dashboard ships no chart library and
 * hand-rolls its charts (Growth's line, Developer360's rings), so this follows
 * the same approach instead of adding a dependency.
 *
 * The viewBox stretches to its container; tooltips are positioned in
 * percentages so the drawn geometry and DOM overlay never disagree.
 */
export default function ProblemActivityChart({ data }: { data: ActivityPoint[] }) {
  const [hovered, setHovered] = useState<number | null>(null);

  const W = 720;
  const H = 220;
  const PAD_X = 2;
  const PAD_TOP = 14;
  const PAD_BOTTOM = 26;

  const { points, linePath, areaPath } = useMemo(() => {
    const max = Math.max(...data.map((d) => d.value), 1);
    const usableW = W - PAD_X * 2;
    const usableH = H - PAD_TOP - PAD_BOTTOM;
    const step = data.length > 1 ? usableW / (data.length - 1) : 0;

    const pts = data.map((d, i) => ({
      x: PAD_X + i * step,
      y: PAD_TOP + usableH - (d.value / max) * usableH,
      ...d,
    }));

    const line = pts
      .map((p, i) => {
        if (i === 0) return `M ${p.x} ${p.y}`;
        const prev = pts[i - 1];
        // Short horizontal control points keep the curve readable, like
        // analytics products do, without overshooting past the data.
        const cx = (prev.x + p.x) / 2;
        return `C ${cx} ${prev.y}, ${cx} ${p.y}, ${p.x} ${p.y}`;
      })
      .join(" ");

    const area = `${line} L ${pts[pts.length - 1].x} ${H - PAD_BOTTOM} L ${pts[0].x} ${H - PAD_BOTTOM} Z`;

    return { points: pts, linePath: line, areaPath: area };
  }, [data]);

  // Sparse x labels: ~6 stops regardless of period length.
  const labelEvery = Math.max(1, Math.ceil(data.length / 6));

  const hoveredPoint = hovered !== null ? points[hovered] : null;

  return (
    <div className="relative w-full">
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-[220px]" preserveAspectRatio="none" role="img" aria-label="Problems solved over the selected period">
        <defs>
          <linearGradient id="ps-area-fill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="rgba(22,255,0,0.16)" />
            <stop offset="100%" stopColor="rgba(22,255,0,0)" />
          </linearGradient>
        </defs>

        {/* Horizontal gridlines */}
        {[0.25, 0.5, 0.75].map((f) => (
          <line
            key={f}
            x1={PAD_X}
            x2={W - PAD_X}
            y1={PAD_TOP + (H - PAD_TOP - PAD_BOTTOM) * f}
            y2={PAD_TOP + (H - PAD_TOP - PAD_BOTTOM) * f}
            stroke="rgba(255,255,255,0.05)"
            strokeWidth="1"
          />
        ))}

        {/* Area fill */}
        <motion.path
          d={areaPath}
          fill="url(#ps-area-fill)"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1.2, delay: 0.3 }}
        />

        {/* Line */}
        <motion.path
          d={linePath}
          fill="none"
          stroke="#77fc75"
          strokeWidth="2"
          strokeLinecap="round"
          vectorEffect="non-scaling-stroke"
          initial={{ pathLength: 0 }}
          animate={{ pathLength: 1 }}
          transition={{ duration: 1.4, delay: 0.2, ease: [0.25, 0.46, 0.45, 0.94] }}
        />

        {/* Hover marker + guide line */}
        {hoveredPoint && (
          <g pointerEvents="none">
            <line
              x1={hoveredPoint.x}
              x2={hoveredPoint.x}
              y1={PAD_TOP - 4}
              y2={H - PAD_BOTTOM}
              stroke="rgba(255,255,255,0.15)"
              strokeWidth="1"
              strokeDasharray="3 3"
              vectorEffect="non-scaling-stroke"
            />
            <circle cx={hoveredPoint.x} cy={hoveredPoint.y} r="4" fill="#0a0b0d" stroke="#77fc75" strokeWidth="2" vectorEffect="non-scaling-stroke" />
          </g>
        )}

        {/* Capture strip across the full plot for pointer events */}
        <rect
          x="0"
          y="0"
          width={W}
          height={H - PAD_BOTTOM}
          fill="transparent"
          onMouseLeave={() => setHovered(null)}
          onMouseMove={(e) => {
            const rect = e.currentTarget.getBoundingClientRect();
            // preserveAspectRatio="none" stretches both axes non-uniformly, so
            // map client X through the rect width, not the SVG scaling.
            const frac = (e.clientX - rect.left) / rect.width;
            setHovered(Math.min(points.length - 1, Math.max(0, Math.round(frac * (points.length - 1)))));
          }}
        />
      </svg>

      {/* Tooltip in DOM space, so text stays crisp at any chart size */}
      {hoveredPoint && (
        <div
          className="pointer-events-none absolute z-10 -translate-x-1/2 rounded-xl border border-white/10 bg-black/85 backdrop-blur-md px-3 py-2 text-center"
          style={{
            left: `${(hoveredPoint.x / W) * 100}%`,
            top: `${(hoveredPoint.y / H) * 100 - 14}%`,
          }}
        >
          <p className="text-[10px] font-semibold uppercase tracking-widest text-white/40 whitespace-nowrap">{hoveredPoint.label}</p>
          <p className="text-sm font-bold text-primary leading-tight mt-0.5">
            {hoveredPoint.value} {hoveredPoint.value === 1 ? "problem" : "problems"}
          </p>
        </div>
      )}

      {/* X labels */}
      <div className="flex justify-between mt-2 px-0.5">
        {data.map((d, i) =>
          i % labelEvery === 0 || i === data.length - 1 ? (
            <span key={`${d.label}-${i}`} className="text-[10px] text-white/30">
              {d.label}
            </span>
          ) : null
        )}
      </div>
    </div>
  );
}
