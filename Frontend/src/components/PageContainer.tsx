import { ReactNode } from "react";
import { motion } from "motion/react";

/**
 * Content shell for every dashboard page.
 *
 * The page title is owned by the shared dashboard header — one title per
 * screen — so this renders only the page's subtitle, plus optional trailing
 * chrome aligned to the same row (status chips, filters). Rendering a second
 * copy of the title here is exactly the duplication this shape replaced.
 */
export default function PageContainer({
  description,
  trailing,
  children,
}: {
  /** Subtitle shown under the header's page title. */
  description: string;
  /** Optional right-aligned content sharing the subtitle row. */
  trailing?: ReactNode;
  children: ReactNode;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      transition={{ type: "spring", stiffness: 280, damping: 22 }}
      className="w-full flex flex-col gap-6"
    >
      <div className="flex items-start justify-between gap-4">
        <p className="text-xs" style={{ color: "var(--text-secondary)" }}>
          {description}
        </p>
        {trailing}
      </div>

      <div className="w-full">
        {children}
      </div>
    </motion.div>
  );
}
