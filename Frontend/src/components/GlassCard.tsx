import { cn } from "../lib/utils";
import type { ReactNode } from "react";

export default function GlassCard({
  children,
  className,
  hover = true,
  onClick,
}: {
  children: ReactNode;
  className?: string;
  hover?: boolean;
  onClick?: () => void;
}) {
  return (
    <div
      onClick={onClick}
      className={cn(
        hover ? "glass-panel cursor-pointer" : "glass-panel-static",
        onClick && "active:scale-[0.98]",
        "relative overflow-hidden transition-all duration-300",
        className
      )}
    >
      {/* Premium highlight background reflections */}
      <div
        className="absolute inset-0 pointer-events-none opacity-[0.03] bg-gradient-to-tr from-transparent via-white to-transparent"
        aria-hidden="true"
      />
      {children}
    </div>
  );
}
