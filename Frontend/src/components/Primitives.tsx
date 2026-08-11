import { cn } from "../lib/utils";
import type { ReactNode } from "react";

/** Soft dark veil so content stays readable over the global 3D scene */
export function SectionShell({
  id,
  children,
  className,
  veil = "default",
  decor,
}: {
  id?: string;
  children: ReactNode;
  className?: string;
  veil?: "default" | "strong" | "none";
  decor?: ReactNode;
}) {
  return (
    <section
      id={id}
      className={cn(
        "relative w-full py-14 md:py-20 lg:py-24 section-divider overflow-x-clip",
        veil === "default" && "section-veil",
        veil === "strong" && "section-veil-strong",
        className
      )}
    >
      {decor}
      <div className="relative max-w-7xl mx-auto px-6 lg:px-8 z-10">
        {children}
      </div>
    </section>
  );
}

export function GlassPanel({
  children,
  className,
  hover = true,
  as: Tag = "div",
}: {
  children: ReactNode;
  className?: string;
  hover?: boolean;
  as?: "div" | "article";
}) {
  return (
    <Tag
      className={cn(
        hover ? "glass-panel" : "glass-panel-static",
        className
      )}
    >
      {children}
    </Tag>
  );
}

export function SectionEyebrow({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <p
      className={cn(
        "text-[10px] md:text-xs font-bold tracking-[0.24em] uppercase mb-3",
        className
      )}
      style={{ color: "hsl(var(--primary))" }}
    >
      {children}
    </p>
  );
}

export function SectionTitle({
  children,
  className,
  align = "left",
}: {
  children: ReactNode;
  className?: string;
  align?: "left" | "center";
}) {
  return (
    <h2
      className={cn(
        "text-display uppercase tracking-[-0.04em]",
        align === "center" && "text-center",
        className
      )}
      style={{ fontSize: "clamp(1.85rem, 3.8vw, 2.75rem)", lineHeight: 1.1 }}
    >
      {children}
    </h2>
  );
}

export function SectionLead({
  children,
  className,
  align = "left",
}: {
  children: ReactNode;
  className?: string;
  align?: "left" | "center";
}) {
  return (
    <p
      className={cn(
        "text-body text-base md:text-lg max-w-2xl",
        align === "center" && "mx-auto text-center",
        className
      )}
    >
      {children}
    </p>
  );
}

export function PanelHeader({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "px-5 md:px-6 py-3.5 border-b border-white/[0.08] flex items-center gap-3",
        className
      )}
      style={{ background: "rgba(255,255,255,0.03)" }}
    >
      {children}
    </div>
  );
}

export function WindowDots() {
  return (
    <div className="flex items-center gap-1.5 shrink-0">
      <span className="w-2.5 h-2.5 rounded-full bg-white/15" />
      <span className="w-2.5 h-2.5 rounded-full bg-white/15" />
      <span className="w-2.5 h-2.5 rounded-full bg-white/15" />
    </div>
  );
}
