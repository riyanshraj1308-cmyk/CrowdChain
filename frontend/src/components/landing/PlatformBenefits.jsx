import { Lock, Eye, TrendingUp, Globe2 } from "lucide-react";
import Reveal, { RevealGroup, revealItemVariants } from "../ui/Reveal";
import { motion } from "framer-motion";

const BENEFITS = [
  {
    icon: Lock,
    title: "Non-custodial by design",
    description: "Funds never pass through a company account. The smart contract is the only custodian.",
  },
  {
    icon: Eye,
    title: "Fully auditable on-chain",
    description: "Every contribution, vote, and release is a public transaction anyone can verify.",
  },
  {
    icon: TrendingUp,
    title: "Reputation that compounds",
    description: "Creators build a portable, on-chain track record across every campaign they run.",
  },
  {
    icon: Globe2,
    title: "Borderless contribution",
    description: "Back a campaign from anywhere with a wallet — no currency conversion, no gatekeeping.",
  },
];

export default function PlatformBenefits() {
  return (
    <section className="border-b border-ink-950/8 bg-paper-50 py-20 sm:py-28">
      <div className="container-page">
        <Reveal className="max-w-xl">
          <span className="text-xs font-semibold uppercase tracking-wide text-copper-500">
            Why Groundwork
          </span>
          <h2 className="mt-2 text-3xl text-ink-950 sm:text-4xl">
            Built for accountability, not just fundraising.
          </h2>
        </Reveal>

        <RevealGroup className="mt-14 grid grid-cols-1 gap-x-8 gap-y-10 sm:grid-cols-2">
          {BENEFITS.map((b) => (
            <motion.div key={b.title} variants={revealItemVariants} className="flex gap-4">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-md bg-copper-50">
                <b.icon className="h-5 w-5 text-copper-600" aria-hidden="true" />
              </div>
              <div>
                <h3 className="font-display text-lg text-ink-950">{b.title}</h3>
                <p className="mt-1.5 text-sm leading-relaxed text-ink-600">{b.description}</p>
              </div>
            </motion.div>
          ))}
        </RevealGroup>
      </div>
    </section>
  );
}
