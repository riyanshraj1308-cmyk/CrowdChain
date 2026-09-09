import { Scale, ShieldAlert, TimerReset } from "lucide-react";
import Reveal from "../ui/Reveal";

const POINTS = [
  {
    icon: Scale,
    title: "Weighted, not one-address-one-vote",
    description:
      "Voting power is proportional to how much a contributor put in — so the people with the most at stake have the most say.",
  },
  {
    icon: TimerReset,
    title: "A fixed voting window",
    description:
      "Every milestone submission opens a time-boxed voting period. No indefinite limbo, no moving goalposts.",
  },
  {
    icon: ShieldAlert,
    title: "Rejection has real consequences",
    description:
      "If a milestone fails to reach 50% approval, the campaign is marked failed and remaining funds become refundable.",
  },
];

export default function MilestoneVotingExplainer() {
  return (
    <section id="voting" className="border-b border-ink-950/8 bg-ink-950 py-20 text-paper-50 sm:py-28">
      <div className="container-page grid gap-12 lg:grid-cols-2 lg:gap-16">
        <Reveal>
          <span className="text-xs font-semibold uppercase tracking-wide text-copper-400">
            Community governance
          </span>
          <h2 className="mt-2 text-3xl text-paper-50 sm:text-4xl">
            Contributors decide when work is actually done.
          </h2>
          <p className="mt-5 max-w-md text-base leading-relaxed text-paper-200/70">
            Traditional crowdfunding hands over the full amount up front and hopes for the best.
            Groundwork keeps every contributor in the loop — and in control — for every dollar that
            moves after the initial pledge.
          </p>
        </Reveal>

        <div className="flex flex-col gap-8">
          {POINTS.map((point, i) => (
            <Reveal key={point.title} delay={i * 0.08} className="flex gap-4">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-md border border-paper-50/15 bg-paper-50/5">
                <point.icon className="h-5 w-5 text-copper-400" aria-hidden="true" />
              </div>
              <div>
                <h3 className="font-display text-lg text-paper-50">{point.title}</h3>
                <p className="mt-1.5 text-sm leading-relaxed text-paper-200/65">{point.description}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
