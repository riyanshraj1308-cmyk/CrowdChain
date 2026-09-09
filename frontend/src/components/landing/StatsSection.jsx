import { useEffect, useRef, useState } from "react";
import { useInView, motion, animate } from "framer-motion";
import { formatEth } from "../../lib/format";

function Counter({ to, prefix = "", suffix = "", decimals = 0 }) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-40px" });
  const [display, setDisplay] = useState("0");

  useEffect(() => {
    if (!inView) return;
    const controls = animate(0, to, {
      duration: 1.4,
      ease: [0.16, 1, 0.3, 1],
      onUpdate: (v) => setDisplay(v.toLocaleString(undefined, { maximumFractionDigits: decimals })),
    });
    return () => controls.stop();
  }, [inView, to, decimals]);

  return (
    <span ref={ref} className="font-display text-4xl text-paper-50 sm:text-5xl">
      {prefix}
      {display}
      {suffix}
    </span>
  );
}

export default function StatsSection({ stats }) {
  const items = [
    { label: "Total funded", value: Number(formatEth(stats.totalFunded)), suffix: " ETH" },
    { label: "Campaigns launched", value: stats.campaignsLaunched },
    { label: "Successfully completed", value: stats.campaignsSuccessful },
    { label: "Contributors", value: stats.totalContributors, suffix: "+" },
  ];

  return (
    <section className="border-b border-ink-950/8 bg-ink-900 py-16 sm:py-20">
      <div className="container-page grid grid-cols-2 gap-8 lg:grid-cols-4">
        {items.map((item, i) => (
          <motion.div
            key={item.label}
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.4, delay: i * 0.05 }}
          >
            <Counter to={item.value} suffix={item.suffix || ""} />
            <p className="mt-2 text-sm text-paper-200/60">{item.label}</p>
          </motion.div>
        ))}
      </div>
    </section>
  );
}
