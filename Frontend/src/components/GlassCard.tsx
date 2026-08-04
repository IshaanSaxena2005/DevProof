import { cn } from "../lib/utils";
import type { ReactNode } from "react";
import { motion } from "motion/react";

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
  const CardWrapper = onClick || hover ? motion.div : "div";

  return (
    // @ts-ignore
    <CardWrapper
      onClick={onClick}
      {...(hover || onClick
        ? {
            whileHover: { y: -3, transition: { type: "spring", stiffness: 280, damping: 22 } },
            whileTap: onClick ? { scale: 0.98, transition: { type: "spring", stiffness: 280, damping: 22 } } : {},
          }
        : {})}
      className={cn(
        hover ? "glass-panel cursor-pointer" : "glass-panel-static",
        "relative overflow-hidden",
        className
      )}
    >
      {/* Premium highlight background reflections */}
      <div
        className="absolute inset-0 pointer-events-none opacity-[0.03] bg-gradient-to-tr from-transparent via-white to-transparent"
        aria-hidden="true"
      />
      {children}
    </CardWrapper>
  );
}
