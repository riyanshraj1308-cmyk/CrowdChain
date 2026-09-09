import { motion } from "framer-motion";
import { Check, Vote, Clock, X } from "lucide-react";
import { formatEth } from "../../lib/format";

const STEP_CONFIG = {
  RELEASED: { icon: Check, ring: "border-moss-500 bg-moss-500 text-paper-50", label: "Released" },
  APPROVED: { icon: Check, ring: "border-moss-500 bg-moss-500 text-paper-50", label: "Approved" },
  SUBMITTED: { icon: Vote, ring: "border-amber-500 bg-amber-50 text-amber-500", label: "Voting open" },
  REJECTED: { icon: X, ring: "border-rust-500 bg-rust-50 text-rust-500", label: "Rejected" },
  PENDING: { icon: Clock, ring: "border-ink-300 bg-paper-50 text-ink-400", label: "Upcoming" },
};

export default function MilestoneTimeline({ milestones, activeId, onSelect }) {
  return (
    <ol className="flex flex-col gap-0">
      {milestones.map((m, i) => {
        const config = STEP_CONFIG[m.status] || STEP_CONFIG.PENDING;
        const Icon = config.icon;
        const isLast = i === milestones.length - 1;
        const isActive = activeId === m.contractMilestoneId;

        return (
          <li key={m.contractMilestoneId} className="relative flex gap-4 pb-8 last:pb-0">
            {!isLast && (
              <span
                className="absolute left-[15px] top-8 h-[calc(100%-1.5rem)] w-px bg-ink-950/12"
                aria-hidden="true"
              />
            )}
            <motion.button
              onClick={() => onSelect?.(m.contractMilestoneId)}
              whileTap={{ scale: 0.94 }}
              className={`z-10 flex h-8 w-8 shrink-0 items-center justify-center rounded-full border-2 ${config.ring}`}
              aria-label={`Milestone ${i + 1}: ${config.label}`}
            >
              <Icon className="h-4 w-4" aria-hidden="true" />
            </motion.button>

            <button
              onClick={() => onSelect?.(m.contractMilestoneId)}
              className={`flex-1 rounded-md border px-4 py-3 text-left transition-colors ${
                isActive ? "border-copper-400 bg-copper-50/50" : "border-transparent hover:bg-ink-950/3"
              }`}
            >
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="font-medium text-ink-950">
                  Milestone {i + 1}: {m.title}
                </span>
                <span className="font-mono text-sm text-ink-600">{formatEth(m.amount)} ETH</span>
              </div>
              <p className="mt-1 text-sm text-ink-600">{m.description}</p>
              <span className="mt-1.5 inline-block text-xs font-medium text-ink-500">
                {config.label}
              </span>
            </button>
          </li>
        );
      })}
    </ol>
  );
}
