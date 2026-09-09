import { useState } from "react";
import { ChevronDown } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import Reveal from "../ui/Reveal";

const FAQS = [
  {
    q: "What happens if a milestone vote fails?",
    a: "If contributor voting weight in favor of a milestone doesn't reach the 50% approval threshold within the voting window, the milestone is marked rejected and the campaign is marked failed. Any funds still held in escrow become claimable as refunds, split pro-rata by contribution.",
  },
  {
    q: "Can a creator withdraw funds without a vote?",
    a: "No. The smart contract only releases a milestone's allocated amount after that specific milestone has been approved by contributor vote. There is no admin key or override — not even Groundwork can move escrowed funds directly.",
  },
  {
    q: "How is my voting power calculated?",
    a: "Your voting weight on a campaign's milestones equals the total ETH you've contributed to that campaign. Larger contributors have proportionally more say, since they have proportionally more at stake.",
  },
  {
    q: "What if a campaign doesn't reach its funding goal?",
    a: "If the deadline passes without the goal being met, the campaign is marked failed and every contributor can claim a full refund of their contribution directly from the contract.",
  },
  {
    q: "Which networks are supported?",
    a: "Groundwork runs on any EVM-compatible network. It's currently live on Ethereum mainnet and Sepolia testnet, with more networks planned.",
  },
];

export default function FAQ() {
  const [openIndex, setOpenIndex] = useState(0);

  return (
    <section id="faq" className="border-b border-ink-950/8 bg-paper-50 py-20 sm:py-28">
      <div className="container-page max-w-3xl">
        <Reveal>
          <span className="text-xs font-semibold uppercase tracking-wide text-copper-500">FAQ</span>
          <h2 className="mt-2 text-3xl text-ink-950 sm:text-4xl">Common questions</h2>
        </Reveal>

        <div className="mt-10 divide-y divide-ink-950/10 border-t border-ink-950/10">
          {FAQS.map((item, i) => {
            const isOpen = openIndex === i;
            return (
              <div key={item.q}>
                <button
                  onClick={() => setOpenIndex(isOpen ? -1 : i)}
                  className="flex w-full items-center justify-between gap-4 py-5 text-left"
                  aria-expanded={isOpen}
                  aria-controls={`faq-panel-${i}`}
                >
                  <span className="font-display text-lg text-ink-950">{item.q}</span>
                  <motion.span animate={{ rotate: isOpen ? 180 : 0 }} transition={{ duration: 0.2 }}>
                    <ChevronDown className="h-5 w-5 shrink-0 text-ink-500" aria-hidden="true" />
                  </motion.span>
                </button>
                <AnimatePresence initial={false}>
                  {isOpen && (
                    <motion.div
                      id={`faq-panel-${i}`}
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
                      className="overflow-hidden"
                    >
                      <p className="pb-5 text-[15px] leading-relaxed text-ink-600">{item.a}</p>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
