import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowRight, Rocket, ShieldCheck, Vote } from "lucide-react";
import Button from "../ui/Button";

export default function Hero() {
  return (
    <section className="relative overflow-hidden border-b border-ink-950/8 bg-paper-50">
      <div className="container-page grid gap-12 py-16 sm:py-20 lg:grid-cols-[1.1fr_0.9fr] lg:gap-8 lg:py-28">
        <div className="flex flex-col justify-center">
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <span className="inline-flex items-center gap-2 rounded-full border border-ink-950/12 bg-paper-100 px-3.5 py-1.5 text-xs font-medium text-ink-700">
              <span className="h-1.5 w-1.5 rounded-full bg-moss-500" />
              Escrowed on-chain · Released by milestone
            </span>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.55, delay: 0.08 }}
            className="mt-6 text-balance text-4xl text-ink-950 sm:text-5xl lg:text-6xl"
          >
            Fund real progress,
            <br />
            not just promises.
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.55, delay: 0.16 }}
            className="mt-6 max-w-lg text-lg leading-relaxed text-ink-600"
          >
            Groundwork is a decentralized crowdfunding platform where contributions sit in a smart
            contract escrow — never in a creator's wallet. Funds unlock in stages, and only after the
            community votes that a milestone was actually delivered.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.55, delay: 0.24 }}
            className="mt-9 flex flex-col gap-3 sm:flex-row"
          >
            <Button as={Link} to="/explore" size="lg" variant="accent" icon={ArrowRight} iconPosition="right">
              Explore Campaigns
            </Button>
            <Button as={Link} to="/create" size="lg" variant="secondary" icon={Rocket}>
              Start a Campaign
            </Button>
          </motion.div>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="mt-10 flex flex-wrap items-center gap-x-8 gap-y-3 text-sm text-ink-500"
          >
            <span className="flex items-center gap-2">
              <ShieldCheck className="h-4 w-4 text-moss-500" aria-hidden="true" /> No custodial wallets
            </span>
            <span className="flex items-center gap-2">
              <Vote className="h-4 w-4 text-copper-500" aria-hidden="true" /> Contributor-weighted voting
            </span>
          </motion.div>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 24, scale: 0.97 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.6, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
          className="relative flex items-center justify-center"
        >
          <HeroEscrowCard />
        </motion.div>
      </div>
    </section>
  );
}

function HeroEscrowCard() {
  return (
    <div className="relative w-full max-w-md rounded-xl border border-ink-950/10 bg-ink-950 p-7 text-paper-50 shadow-lifted">
      <div className="flex items-center justify-between border-b border-paper-50/10 pb-4">
        <span className="text-sm font-medium text-paper-200/70">Campaign Escrow</span>
        <span className="rounded-full bg-moss-500/20 px-2.5 py-1 text-xs font-medium text-moss-400">
          Active
        </span>
      </div>
      <p className="mt-5 font-mono text-3xl font-semibold">31.5 ETH</p>
      <p className="text-sm text-paper-200/60">locked in escrow · 70% funded</p>

      <div className="mt-5 h-2 w-full overflow-hidden rounded-full bg-paper-50/10">
        <motion.div
          className="h-full rounded-full bg-copper-500"
          initial={{ width: 0 }}
          animate={{ width: "70%" }}
          transition={{ duration: 1, delay: 0.6, ease: [0.16, 1, 0.3, 1] }}
        />
      </div>

      <div className="mt-6 flex flex-col gap-3">
        {[
          { label: "Site survey & permits", state: "Released · 12 ETH", done: true },
          { label: "Drilling & equipment", state: "Voting · 92% approve", done: false, active: true },
          { label: "Installation & handover", state: "Locked · 13 ETH", done: false },
        ].map((m) => (
          <div key={m.label} className="flex items-center gap-3 rounded-md border border-paper-50/8 bg-paper-50/5 px-3.5 py-3">
            <span
              className={`h-2.5 w-2.5 shrink-0 rounded-full ${
                m.done ? "bg-moss-400" : m.active ? "bg-amber-400" : "bg-paper-50/25"
              }`}
            />
            <div className="flex-1">
              <p className="text-sm font-medium text-paper-50">{m.label}</p>
              <p className="text-xs text-paper-200/55">{m.state}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
