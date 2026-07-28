import { ReactNode } from "react";
import { motion } from "motion/react";

export default function PageContainer({
  title,
  description,
  children,
}: {
  title: string;
  description: string;
  children: ReactNode;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -12 }}
      transition={{ duration: 0.35, ease: "easeOut" }}
      className="w-full flex flex-col gap-6"
    >
      <div>
        <h1 className="text-2xl md:text-3xl font-bold text-white uppercase tracking-tight">
          {title}
        </h1>
        <p className="text-sm mt-1" style={{ color: "var(--text-secondary)" }}>
          {description}
        </p>
      </div>
      
      <div className="w-full">
        {children}
      </div>
    </motion.div>
  );
}
