import { Wallet, Rocket, Vote, Banknote } from "lucide-react";
import Reveal, { RevealGroup, revealItemVariants } from "../ui/Reveal";
import { motion } from "framer-motion";

const STEPS = [
  {
    icon: Wallet,
    title: "Connect your wallet",
    description: "Sign in with any EVM wallet — no accounts, passwords, or custodial funds involved.",
  },
  {
    icon: Rocket,
    title: "Fund or launch a campaign",
    description: "Contribute ETH to a campaign's escrow, or launch your own with clear, funded milestones.",
  },
  {
    icon: Vote,
    title: "Vote on milestone delivery",
    description: "When a creator submits proof of progress, contributors vote — weighted by contribution size.",
  },
  {
    icon: Banknote,
    title: "Funds release automatically",
    description: "Only the approved milestone's allocation moves to the creator. The rest stays locked.",
  },
];

export default function HowItWorks() {
  return (
    <section id="how-it-works" className="border-b border-ink-950/8 bg-paper-100 py-20 sm:py-28">
      <div className="container-page">
        <Reveal className="max-w-xl">
          <span className="text-xs font-semibold uppercase tracking-wide text-copper-500">
            How it works
          </span>
          <h2 className="mt-2 text-3xl text-ink-950 sm:text-4xl">
            Four steps between a promise and delivered work.
          </h2>
        </Reveal>

        <RevealGroup className="mt-14 grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-4">
          {STEPS.map((step, i) => (
            <motion.div key={step.title} variants={revealItemVariants} className="relative">
              <div className="flex h-12 w-12 items-center justify-center rounded-md border border-ink-950/12 bg-paper-50">
                <step.icon className="h-5 w-5 text-copper-500" aria-hidden="true" />
              </div>
              <span className="mt-5 block font-mono text-xs text-ink-400">STEP {i + 1}</span>
              <h3 className="mt-1 font-display text-lg text-ink-950">{step.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-ink-600">{step.description}</p>
            </motion.div>
          ))}
        </RevealGroup>
      </div>
    </section>
  );
}
