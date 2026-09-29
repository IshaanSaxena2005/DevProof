import { motion } from "motion/react";
import { DIFFICULTY_COLORS } from "./shared";

interface DonutSegment {
  label: string;
  count: number;
  color: string;
}

/**
 * Hand-rolled SVG donut in the same family as Developer360's ScoreRing: thin
 * track, rounded caps, green-tinted drop-shadow, ~1s easing on mount.
 */
export default function DifficultyDonut({ segments }: { segments: DonutSegment[] }) {
  const size = 168;
  const stroke = 12;
  // Keep the SVG square regardless of the longest label.
  const labelWidth = 64;
  const cx = size / 2;
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const total = segments.reduce((sum, s) => sum + s.count, 0);

  let consumed = 0;
  const arcs = segments.map((s) => {
    const frac = total > 0 ? s.count / total : 0;
    const arc = {
      ...s,
      fraction: frac,
      dasharray: `${Math.max(frac * c - 2, 0)} ${c}`,
      offset: -consumed * c,
    };
    consumed += frac;
    return arc;
  });

  return (
    <svg
      viewBox={`0 0 ${size + labelWidth} ${size}`}
      className="w-full max-w-[232px]"
      role="img"
      aria-label="Distribution of solved problems by difficulty"
    >
      {/* Track */}
      <circle cx={cx} cy={size / 2} r={r} fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth={stroke} />

      {/* Segments share one rounded start so gaps stay hairline-thin */}
      {arcs.map((a, i) => (
        <motion.circle
          key={a.label}
          cx={cx}
          cy={size / 2}
          r={r}
          fill="none"
          stroke={a.color}
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={a.dasharray}
          initial={{ strokeDashoffset: c }}
          animate={{ strokeDashoffset: a.offset }}
          transition={{ duration: 1, delay: 0.25 + i * 0.12, ease: [0.25, 0.46, 0.45, 0.94] }}
          transform={`rotate(-90 ${cx} ${size / 2})`}
          style={{ filter: `drop-shadow(0 0 6px ${a.color}44)` }}
        />
      ))}

      {/* Center total */}
      <text x={cx} y={size / 2 - 4} textAnchor="middle" dominantBaseline="middle" fontSize="26" fontWeight="800" fill="white" fontFamily="Sora, sans-serif">
        {total.toLocaleString()}
      </text>
      <text x={cx} y={size / 2 + 15} textAnchor="middle" dominantBaseline="middle" fontSize="8" fontWeight="700" letterSpacing="2" fill="rgba(255,255,255,0.35)" fontFamily="Sora, sans-serif">
        SOLVED
      </text>
    </svg>
  );
}

/** Percent of total for a difficulty bucket (fallback 0 when empty). */
export function difficultyPercent(count: number, total: number) {
  return total > 0 ? Math.round((count / total) * 100) : 0;
}

export { DIFFICULTY_COLORS };
