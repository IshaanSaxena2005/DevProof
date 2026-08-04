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
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      transition={{ type: "spring", stiffness: 280, damping: 22 }}
      className="w-full flex flex-col gap-6"
    >
      <div>
        <h1 className="text-xl md:text-2xl font-bold text-white uppercase tracking-wider">
          {title}
        </h1>
        <p className="text-xs mt-1" style={{ color: "var(--text-secondary)" }}>
          {description}
        </p>
      </div>
      
      <div className="w-full">
        {children}
      </div>
    </motion.div>
  );
}
