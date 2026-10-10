import { Link } from "react-router-dom";
import { ArrowRight, Hammer, Vote, Unlock, RefreshCcw } from "lucide-react";
import Reveal from "../ui/Reveal";

const STEPS = [
  {
    icon: Hammer,
    title: "A campaign commits to public milestones",
    description:
      "Before a single contribution arrives, the creator defines each milestone — what will be delivered, and what it costs. The plan is frozen into the campaign's escrow contract, so it can't be quietly rewritten later.",
  },
  {
    icon: Vote,
    title: "Contributors vote on each proof",
    description:
      "When a milestone is submitted, every contributor votes with weight proportional to their stake. Approvals and rejections are counted on-chain, in the open, by the people who actually funded the work.",
  },
  {
    icon: Unlock,
    title: "Funds release only on approval",
    description:
      "A passing vote unlocks that milestone's share of the escrow to the creator — nothing more. The next tranche stays locked until the next milestone earns it.",
  },
  {
    icon: RefreshCcw,
    title: "A failed milestone means refunds",
    description:
      "If contributors reject the proof, the contract returns that milestone's funds to contributors automatically. Backers aren't stuck waiting on a founder's goodwill or a support ticket.",
  },
];

/**
 * LifecycleSection — a dark-zone landing section walking one contribution's
 * journey from commit to release/refund. Contrasts directly with the
 * "fund it and hope" model of traditional platforms.
 */
export default function LifecycleSection() {
  return (
    <section data-section className="border-b border-ink-950/8 bg-paper-50 py-20 sm:py-28">
      <div className="container-page">
        <div className="flex flex-col items-start justify-between gap-6 sm:flex-row sm:items-end">
          <Reveal className="max-w-xl">
            <span className="text-xs font-semibold uppercase tracking-wide text-copper-500">
              The Lifecycle
            </span>
            <h2 className="mt-2 text-3xl text-ink-950 sm:text-4xl">
              Follow one contribution, end to end.
            </h2>
          </Reveal>
          <Reveal delay={0.08}>
            <Link
              to="/create"
              className="inline-flex items-center gap-2 text-sm font-semibold text-copper-600 hover:text-copper-500"
            >
              Launch your own campaign
              <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </Link>
          </Reveal>
        </div>

        <div className="mt-14 grid grid-cols-1 gap-10 sm:grid-cols-2 lg:gap-8">
          {STEPS.map((s, i) => (
            <Reveal key={s.title} delay={i * 0.06}>
              <div className="relative flex gap-5">
                <div className="flex flex-col items-center">
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-md bg-copper-50">
                    <s.icon className="h-5 w-5 text-copper-600" aria-hidden="true" />
                  </div>
                  {i < STEPS.length - 1 && (
                    <span
                      aria-hidden="true"
                      className="mt-3 w-px flex-1 bg-gradient-to-b from-copper-500/40 to-transparent"
                    />
                  )}
                </div>
                <div className="pb-2">
                  <p className="font-mono text-xs uppercase tracking-[0.14em] text-ink-400">
                    Step {i + 1}
                  </p>
                  <h3 className="mt-1 font-display text-lg text-ink-950">{s.title}</h3>
                  <p className="mt-1.5 text-sm leading-relaxed text-ink-600">{s.description}</p>
                </div>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
