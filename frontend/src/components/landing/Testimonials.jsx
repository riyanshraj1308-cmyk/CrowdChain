import { Quote } from "lucide-react";
import Reveal, { RevealGroup, revealItemVariants } from "../ui/Reveal";
import Avatar from "../ui/Avatar";
import { motion } from "framer-motion";

const TESTIMONIALS = [
  {
    quote:
      "We've run two campaigns on Groundwork now. Knowing contributors verify each stage keeps our own team honest about scope and timelines.",
    name: "Amara Okafor",
    role: "Founder, Kitui Water Initiative",
  },
  {
    quote:
      "I stopped backing traditional crowdfunding after getting burned twice. Milestone escrow is the first model that's actually made me comfortable funding strangers again.",
    name: "Priya Nathwani",
    role: "Contributor, 14 campaigns backed",
  },
  {
    quote:
      "The voting weight system is the detail that sold me. It's not a popularity contest — it's the people with money on the line making the call.",
    name: "Marcus Chen",
    role: "Creator, Open Robotics Kit",
  },
];

export default function Testimonials() {
  return (
    <section className="border-b border-ink-950/8 bg-paper-100 py-20 sm:py-28">
      <div className="container-page">
        <Reveal className="max-w-xl">
          <span className="text-xs font-semibold uppercase tracking-wide text-copper-500">
            From the community
          </span>
          <h2 className="mt-2 text-3xl text-ink-950 sm:text-4xl">
            Trusted by creators and contributors alike.
          </h2>
        </Reveal>

        <RevealGroup className="mt-12 grid grid-cols-1 gap-6 lg:grid-cols-3">
          {TESTIMONIALS.map((t) => (
            <motion.figure
              key={t.name}
              variants={revealItemVariants}
              className="flex flex-col rounded-lg border border-ink-950/10 bg-paper-50 p-6"
            >
              <Quote className="h-6 w-6 text-copper-300" aria-hidden="true" />
              <blockquote className="mt-4 flex-1 text-[15px] leading-relaxed text-ink-700">
                “{t.quote}”
              </blockquote>
              <figcaption className="mt-6 flex items-center gap-3">
                <Avatar name={t.name} size={38} />
                <div>
                  <p className="text-sm font-semibold text-ink-950">{t.name}</p>
                  <p className="text-xs text-ink-500">{t.role}</p>
                </div>
              </figcaption>
            </motion.figure>
          ))}
        </RevealGroup>
      </div>
    </section>
  );
}
