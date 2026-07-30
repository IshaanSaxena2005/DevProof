import type { LucideIcon } from "lucide-react";
import GlassCard from "./GlassCard";

export default function EmptyState({
  title,
  description,
  icon: Icon,
  actionText,
  onAction,
}: {
  title: string;
  description: string;
  icon: LucideIcon;
  actionText?: string;
  onAction?: () => void;
}) {
  return (
    <GlassCard hover={false} className="flex flex-col items-center justify-center text-center p-8 md:p-12 bg-white/[0.01]">
      <div className="w-12 h-12 rounded-2xl border border-white/10 flex items-center justify-center bg-white/[0.03] text-white/50 mb-4">
        <Icon className="w-6 h-6" />
      </div>
      <h3 className="text-base font-bold text-white uppercase tracking-wider mb-2">
        {title}
      </h3>
      <p className="text-sm max-w-sm mb-6" style={{ color: "var(--text-secondary)" }}>
        {description}
      </p>
      
      {actionText && onAction && (
        <button
          onClick={onAction}
          className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest px-6 py-3 rounded-full transition-all duration-300 hover:-translate-y-0.5 active:translate-y-0 active:scale-[0.97] shadow-[0_0_16px_rgba(119,252,117,0.25)] hover:shadow-[0_0_24px_rgba(119,252,117,0.45)] hover:brightness-110 cursor-pointer"
          style={{
            backgroundColor: "hsl(var(--primary))",
            color: "hsl(var(--primary-foreground))",
          }}
        >
          {actionText}
        </button>
      )}
    </GlassCard>
  );
}
