import { motion } from "framer-motion";

export default function Tabs({ tabs, active, onChange, className = "" }) {
  return (
    <div
      role="tablist"
      aria-label="Sections"
      className={`flex gap-1 overflow-x-auto no-scrollbar border-b border-ink-950/10 ${className}`}
    >
      {tabs.map((tab) => {
        const isActive = tab.value === active;
        return (
          <button
            key={tab.value}
            role="tab"
            aria-selected={isActive}
            onClick={() => onChange(tab.value)}
            className={`relative shrink-0 whitespace-nowrap px-4 py-3 text-sm font-medium transition-colors ${
              isActive ? "text-ink-950" : "text-ink-500 hover:text-ink-800"
            }`}
          >
            {tab.label}
            {tab.count !== undefined && (
              <span className="ml-1.5 text-xs text-ink-400">{tab.count}</span>
            )}
            {isActive && (
              <motion.div
                layoutId="tab-underline"
                className="absolute inset-x-3 -bottom-px h-0.5 rounded-full bg-copper-500"
                transition={{ type: "spring", stiffness: 400, damping: 32 }}
              />
            )}
          </button>
        );
      })}
    </div>
  );
}
