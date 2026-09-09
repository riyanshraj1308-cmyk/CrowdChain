import { motion } from "framer-motion";

export default function ProgressBar({ percent = 0, className = "", trackClassName = "", barClassName = "" }) {
  const clamped = Math.min(100, Math.max(0, percent));
  return (
    <div
      className={`h-2 w-full overflow-hidden rounded-full bg-ink-950/8 ${trackClassName} ${className}`}
      role="progressbar"
      aria-valuenow={clamped}
      aria-valuemin={0}
      aria-valuemax={100}
    >
      <motion.div
        className={`h-full rounded-full bg-copper-500 ${barClassName}`}
        initial={{ width: 0 }}
        animate={{ width: `${clamped}%` }}
        transition={{ type: "spring", stiffness: 90, damping: 20 }}
      />
    </div>
  );
}
