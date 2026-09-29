import { motion } from "motion/react";

export interface CompletenessComponent {
  label: string;
  /** null = no source data at all ("Not available"), not a measured 0. */
  percent: number | null;
}

/**
 * Large ring in the same visual family as Developer360's ScoreRing: thin track,
 * rounded caps, green glow, spring-ish ease on mount.
 */
export default function CompletenessRing({ percent }: { percent: number | null }) {
  const size = 176;
  const stroke = 11;
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const hasValue = percent !== null;
  const offset = hasValue ? c - (percent / 100) * c : c;
  const col = hasValue ? "#77fc75" : "rgba(255,255,255,0.15)";

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth={stroke} />
      <motion.circle
        cx={size / 2}
        cy={size / 2}
        r={r}
        fill="none"
        stroke={col}
        strokeWidth={stroke}
        strokeLinecap="round"
        strokeDasharray={c}
        initial={{ strokeDashoffset: c }}
        animate={{ strokeDashoffset: offset }}
        transition={{ duration: 1.2, delay: 0.3, ease: [0.25, 0.46, 0.45, 0.94] }}
        transform={`rotate(-90 ${size / 2} ${size / 2})`}
        style={hasValue ? { filter: "drop-shadow(0 0 8px rgba(119,252,117,0.5))" } : undefined}
      />
      <text
        x="50%"
        y="45%"
        dominantBaseline="middle"
        textAnchor="middle"
        fontSize="34"
        fontWeight="800"
        fill="white"
        fontFamily="Sora, sans-serif"
      >
        {hasValue ? percent : "—"}
      </text>
      {hasValue && (
        <text x="50%" y="62%" dominantBaseline="middle" textAnchor="middle" fontSize="12" fill="rgba(255,255,255,0.35)" fontFamily="Sora, sans-serif">
          %
        </text>
      )}
    </svg>
  );
}

/**
 * Per-component breakdown. A component with a real contributing source shows
 * its percent; null renders "Not available" — an absence of data, not a zero.
 */
export function CompletenessBreakdown({ items }: { items: CompletenessComponent[] }) {
  return (
    <div className="space-y-3">
      {items.map((item, i) => {
        const has = item.percent !== null;
        return (
          <motion.div
            key={item.label}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 + i * 0.05, duration: 0.4 }}
          >
            <div className="flex items-center justify-between mb-1.5">
              <span className={`text-[12px] font-medium ${has ? "text-white/75" : "text-white/35"}`}>
                {item.label}
              </span>
              {has ? (
                <span className="text-[12px] font-bold text-white tabular-nums">{item.percent}%</span>
              ) : (
                <span className="text-[10px] font-bold uppercase tracking-widest text-white/25">
                  Not available
                </span>
              )}
            </div>
            <div className="h-1.5 rounded-full bg-white/[0.05] overflow-hidden">
              {has && (
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${item.percent}%` }}
                  transition={{ duration: 0.9, delay: 0.2 + i * 0.06, ease: [0.25, 0.46, 0.45, 0.94] }}
                  className="h-full rounded-full bg-primary/80"
                  style={{ boxShadow: "0 0 6px rgba(22,255,0,0.3)" }}
                />
              )}
            </div>
          </motion.div>
        );
      })}
    </div>
  );
}
