import { ShieldCheck, Landmark, FileSearch, Lock } from "lucide-react";
import Reveal, { RevealGroup, revealItemVariants } from "../ui/Reveal";
import { motion } from "framer-motion";

const PILLARS = [
  {
    icon: Lock,
    title: "Escrow you can read",
    description:
      "The contract's address is on every campaign page. Read the exact code that would move your money before you contribute a wei — no terms-of-service fine print, just bytecode.",
  },
  {
    icon: Landmark,
    title: "No treasury, no temptation",
    description:
      "CrowdChain the platform never holds contributor funds. Money moves contributor → escrow → creator, and the escrow only releases on a public vote. There is nothing to freeze, seize, or misplace.",
  },
  {
    icon: FileSearch,
    title: "Every decision, on the record",
    description:
      "Milestone approvals, vote weights, and release transactions are permanent public entries. In a year you can still audit exactly why milestone three got funded.",
  },
  {
    icon: ShieldCheck,
    title: "Refunds that don't need permission",
    description:
      "If a milestone vote fails, the contract routes contributions back automatically. Nobody has to approve your refund, and nobody can talk you out of it.",
  },
];

const GUARANTEE = [
  "Contributions are held in the campaign's own escrow contract — never in a company account.",
  "Milestones are released only after contributors vote with weight proportional to their stake.",
  "A failed milestone refunds automatically; the platform cannot intervene.",
];

/**
 * SecurityModel — a dark-zone landing section: where the money actually sits
 * and who can move it. Adds real depth between the explainer sections and the
 * social proof, and gives the snap scroller two more full screens to land on.
 */
export default function SecurityModel() {
  return (
    <section data-section className="border-b border-ink-950/8 bg-paper-50 py-20 sm:py-28">
      <div className="container-page">
        <Reveal className="max-w-xl">
          <span className="text-xs font-semibold uppercase tracking-wide text-copper-500">
            Security Model
          </span>
          <h2 className="mt-2 text-3xl text-ink-950 sm:text-4xl">
            Where the money actually sits.
          </h2>
          <p className="mt-4 text-sm leading-relaxed text-ink-600 sm:text-base">
            Most crowdfunding platforms ask you to trust a company. CrowdChain asks you to trust
            code that anyone can read. Four guarantees that no traditional platform can make.
          </p>
        </Reveal>

        <RevealGroup className="mt-14 grid grid-cols-1 gap-x-8 gap-y-10 sm:grid-cols-2">
          {PILLARS.map((p) => (
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

        <Reveal className="mt-16">
          <div className="rounded-lg border border-ink-950/10 bg-paper-100/60 p-6 sm:p-8">
            <h3 className="font-display text-lg text-ink-950">The contributor's guarantee</h3>
            <ul className="mt-4 flex flex-col gap-3">
              {GUARANTEE.map((line) => (
                <li key={line} className="flex items-start gap-3 text-sm leading-relaxed text-ink-700">
                  <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-copper-500" aria-hidden="true" />
                  {line}
                </li>
              ))}
            </ul>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
