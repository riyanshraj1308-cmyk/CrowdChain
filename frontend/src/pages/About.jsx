import { Link } from "react-router-dom";
import { ArrowRight, ShieldCheck, Vote, Banknote, Lock, RefreshCcw, FileCode2 } from "lucide-react";
import Reveal, { RevealGroup, revealItemVariants } from "../components/ui/Reveal";
import Button from "../components/ui/Button";
import { motion } from "framer-motion";
import FAQ from "../components/landing/FAQ";

const PRINCIPLES = [
  {
    icon: Lock,
    title: "Escrow, not a wallet transfer",
    description:
      "Every contribution goes into the campaign's smart contract, addressable and auditable by anyone. The creator's wallet only ever receives an approved milestone's exact allocation.",
  },
  {
    icon: Vote,
    title: "Contribution-weighted voting",
    description:
      "When a creator marks a milestone complete, contributors have a fixed window to vote. Your voting weight equals your total contribution to that campaign.",
  },
  {
    icon: Banknote,
    title: "Partial, staged release",
    description:
      "Approval releases only that milestone's allocated amount — never the full remaining balance. The rest stays locked for the next stage.",
  },
  {
    icon: RefreshCcw,
    title: "Refunds when things don't work out",
    description:
      "If a campaign misses its funding goal, or a milestone is rejected, unreleased funds become refundable pro-rata to every contributor.",
  },
];

export default function About() {
  return (
    <div>
      <section className="border-b border-ink-950/8 bg-paper-100 py-16 sm:py-24">
        <div className="container-page max-w-2xl">
          <Reveal>
            <span className="text-xs font-semibold uppercase tracking-wide text-copper-500">
              How it works
            </span>
            <h1 className="mt-2 text-3xl text-ink-950 sm:text-4xl">
              A funding model built around proof, not promises.
            </h1>
            <p className="mt-4 text-base leading-relaxed text-ink-600">
              Groundwork replaces "trust me" crowdfunding with a smart contract that holds funds in
              escrow and only releases them when the people who funded a campaign agree the work
              actually happened.
            </p>
          </Reveal>
        </div>
      </section>

      <section id="reputation" className="border-b border-ink-950/8 bg-paper-50 py-20 sm:py-28">
        <div className="container-page">
          <RevealGroup className="grid grid-cols-1 gap-10 sm:grid-cols-2">
            {PRINCIPLES.map((p) => (
              <motion.div key={p.title} variants={revealItemVariants} className="flex gap-4">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-md bg-copper-50">
                  <p.icon className="h-5 w-5 text-copper-600" aria-hidden="true" />
                </div>
                <div>
                  <h3 className="font-display text-lg text-ink-950">{p.title}</h3>
                  <p className="mt-1.5 text-sm leading-relaxed text-ink-600">{p.description}</p>
                </div>
              </motion.div>
            ))}
          </RevealGroup>
        </div>
      </section>

      <section id="contract" className="border-b border-ink-950/8 bg-ink-950 py-20 text-paper-50 sm:py-28">
        <div className="container-page grid gap-10 lg:grid-cols-2 lg:items-center">
          <Reveal>
            <div className="flex items-center gap-2">
              <FileCode2 className="h-5 w-5 text-copper-400" aria-hidden="true" />
              <span className="text-xs font-semibold uppercase tracking-wide text-copper-400">
                The contract
              </span>
            </div>
            <h2 className="mt-2 text-3xl text-paper-50 sm:text-4xl">
              No admin key can move escrowed funds.
            </h2>
            <p className="mt-4 max-w-md text-base leading-relaxed text-paper-200/70">
              Groundwork's escrow contract is open and auditable. There is no owner function that can
              withdraw contributor funds — the only paths out of escrow are an approved milestone
              release to the creator, or a refund claim by a contributor.
            </p>
            <Button
              as={Link}
              to="/explore"
              variant="secondary"
              className="mt-6 !border-paper-50/30 !text-paper-50 hover:!bg-paper-50/10"
              icon={ArrowRight}
              iconPosition="right"
            >
              See it in action
            </Button>
          </Reveal>
          <Reveal delay={0.1} className="rounded-lg border border-paper-50/10 bg-paper-50/5 p-6 font-mono text-sm text-paper-200/80">
            <p className="text-copper-400">// simplified excerpt</p>
            <p className="mt-2">function releaseMilestone(</p>
            <p className="pl-4">campaignId, milestoneId</p>
            <p>) external nonReentrant {"{"}</p>
            <p className="pl-4">require(milestone.approved);</p>
            <p className="pl-4">// transfers ONLY this</p>
            <p className="pl-4">// milestone's allocation</p>
            <p>{"}"}</p>
          </Reveal>
        </div>
      </section>

      <section className="border-b border-ink-950/8 bg-paper-50 py-20 sm:py-28">
        <div className="container-page">
          <Reveal className="flex items-center gap-2">
            <ShieldCheck className="h-5 w-5 text-copper-500" aria-hidden="true" />
            <h2 className="font-display text-2xl text-ink-950">Security at a glance</h2>
          </Reveal>
          <RevealGroup className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-3">
            {[
              "Checks-effects-interactions ordering with reentrancy guards on every value transfer.",
              "Every backend write that touches funds independently verifies the on-chain transaction before recording it.",
              "No private keys or seed phrases ever touch our servers — you always sign with your own wallet.",
            ].map((text) => (
              <motion.div
                key={text}
                variants={revealItemVariants}
                className="rounded-lg border border-ink-950/10 p-5 text-sm leading-relaxed text-ink-600"
              >
                {text}
              </motion.div>
            ))}
          </RevealGroup>
        </div>
      </section>

      <FAQ />
    </div>
  );
}
