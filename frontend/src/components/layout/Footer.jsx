import { Link } from "react-router-dom";
import { Sprout, Github, Twitter, MessageCircle } from "lucide-react";

const COLUMNS = [
  {
    title: "Platform",
    links: [
      { label: "Explore Campaigns", to: "/explore" },
      { label: "Start a Campaign", to: "/create" },
      { label: "How It Works", to: "/about" },
      { label: "Dashboard", to: "/dashboard" },
    ],
  },
  {
    title: "Resources",
    links: [
      { label: "Milestone Voting", to: "/about#voting" },
      { label: "Creator Reputation", to: "/about#reputation" },
      { label: "Smart Contract", to: "/about#contract" },
      { label: "FAQ", to: "/about#faq" },
    ],
  },
];

export default function Footer() {
  return (
    <footer className="border-t border-ink-950/10 bg-ink-950 text-paper-200">
      <div className="container-page grid gap-12 py-16 sm:grid-cols-2 lg:grid-cols-4">
        <div className="lg:col-span-2">
          <Link to="/" className="flex items-center gap-2 font-display text-xl text-paper-50">
            <span className="flex h-8 w-8 items-center justify-center rounded-md bg-copper-500 text-paper-50">
              <Sprout className="h-4 w-4" aria-hidden="true" />
            </span>
            Groundwork
          </Link>
          <p className="mt-4 max-w-sm text-sm leading-relaxed text-paper-200/70">
            Funds are held in an on-chain escrow and released milestone by milestone, only after
            contributors vote to approve real, verified progress.
          </p>
          <div className="mt-6 flex gap-3">
            {[Twitter, Github, MessageCircle].map((Icon, i) => (
              <a
                key={i}
                href="#"
                aria-label="Social link"
                className="flex h-9 w-9 items-center justify-center rounded-full border border-paper-50/15 text-paper-200/80 hover:border-copper-400 hover:text-copper-300"
              >
                <Icon className="h-4 w-4" aria-hidden="true" />
              </a>
            ))}
          </div>
        </div>

        {COLUMNS.map((col) => (
          <div key={col.title}>
            <h3 className="text-sm font-semibold uppercase tracking-wide text-paper-50/90">
              {col.title}
            </h3>
            <ul className="mt-4 flex flex-col gap-3">
              {col.links.map((link) => (
                <li key={link.label}>
                  <Link to={link.to} className="text-sm text-paper-200/70 hover:text-paper-50">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      <div className="border-t border-paper-50/10">
        <div className="container-page flex flex-col items-center justify-between gap-3 py-6 text-xs text-paper-200/50 sm:flex-row">
          <p>© {new Date().getFullYear()} Groundwork. Built on Ethereum-compatible chains.</p>
          <div className="flex gap-5">
            <Link to="/about" className="hover:text-paper-200">
              Terms
            </Link>
            <Link to="/about" className="hover:text-paper-200">
              Privacy
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
