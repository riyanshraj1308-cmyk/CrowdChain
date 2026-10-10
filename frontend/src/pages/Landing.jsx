import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import { api } from "../lib/api";
import { useTheme } from "../context/ThemeContext";
import { useAuth } from "../context/AuthContext";
import { shortAddress } from "../lib/format";
import GlobeStudy from "../components/ui/GlobeStudy";
import Auralis from "../components/ui/Auralis";
import { FloatingPaths } from "../components/ui/BackgroundPaths";
import FeaturedCampaigns from "../components/landing/FeaturedCampaigns";
import HowItWorks from "../components/landing/HowItWorks";
import LifecycleSection from "../components/landing/LifecycleSection";
import MilestoneVotingExplainer from "../components/landing/MilestoneVotingExplainer";
import PlatformBenefits from "../components/landing/PlatformBenefits";
import SecurityModel from "../components/landing/SecurityModel";
import StatsSection from "../components/landing/StatsSection";
import Testimonials from "../components/landing/Testimonials";
import FAQ from "../components/landing/FAQ";
import "../styles/flux.css";

/**
 * Landing — the CrowdChain home.
 *
 * Hero: copy sits on the left over a gradient that darkens toward the text;
 * the ThreeUI globe study is the hero's BACKGROUND on the right half —
 * full-height, no card box — and stays interactive (drag to spin, click to
 * pin). From the first scroll down, the entire page is a dark zone on the
 * BackgroundPaths line-art layer with Lenis snap section-to-section:
 *
 *   Why CrowdChain → How it works → Lifecycle → Governance → Security
 *   → Stats → Voices → FAQ → Campaigns making progress → footer
 */

const NAV = [
  { label: "Explore", to: "/explore" },
  { label: "Vote on Milestones", to: "/voting" },
  { label: "Start a Campaign", to: "/create" },
  { label: "How It Works", to: "/about" },
];

const META = ["Escrow-secured", "Community-governed", "Milestone-released"];



export default function Landing() {
  const [campaigns, setCampaigns] = useState([]);
  const [stats, setStats] = useState(null);
  const { theme } = useTheme();
  const { isConnected, address, connect, status } = useAuth();

  useEffect(() => {
    api.listCampaigns({ status: "ACTIVE", pageSize: 3 }).then((res) => setCampaigns(res.items));
    api.getPlatformStats().then(setStats);
  }, []);

  return (
    <div className="fx">
      {/* ── FLUX nav ── */}
      <nav className="fx-nav rise d0">
        <Link to="/" className="fx-wordmark">
          <span className="fx-mark" />
          CrowdChain
        </Link>
        <div className="fx-links">
          {NAV.map((n) => (
            <Link key={n.to} to={n.to}>
              {n.label}
            </Link>
          ))}
        </div>
        <div className="flex items-center gap-3">
          {isConnected ? (
            <Link to="/dashboard" className="fx-pill">
              {shortAddress(address)}
            </Link>
          ) : (
            <button
              onClick={connect}
              disabled={status === "connecting" || status === "signing"}
              className="fx-pill disabled:opacity-50"
            >
              {status === "signing" ? "Confirm in wallet…" : "Connect Wallet"}
            </button>
          )}
        </div>
      </nav>

      {/* ── hero: copy left, the globe on its dark ink stage right ── */}
      <section className="fx-hero">
        <div className="fx-copy">
          <div className="fx-kicker rise d5">ON-CHAIN CROWDFUNDING</div>
          <h1 className="fx-h1 rise d6">
            Fund what
            <br />
            deserves to exist<span className="dot">.</span>
          </h1>
          <p className="fx-sub rise d7">
            CrowdChain holds every contribution in on-chain escrow and releases it milestone by
            milestone — only when the community votes that real progress happened.
          </p>
          <div className="fx-ctas rise d8">
            <Link to="/explore" className="fx-btn">
              Explore Campaigns
              <ArrowRight className="h-4 w-4 arr" aria-hidden="true" />
            </Link>
            <Link to="/create" className="fx-textlink">
              Start a Campaign
            </Link>
          </div>
        </div>

        <div className="fx-globe rise d9">
          <GlobeStudy mode={theme} bare keepInteractivity={false} />
        </div>
      </section>

      {/* ── meta row ── */}
      <div className="fx-meta rise d9">
        <span>{META[0]}</span>
        <span className="dot-sep" />
        <span>{META[1]}</span>
        <span className="dot-sep" />
        <span>{META[2]}</span>
      </div>

      {/*
       * Everything after the first scroll sits on the BackgroundPaths layer
       * over black. Lenis snaps full sections into view.
       */}
      <div className="fx-paths-bg">
        <div className="fx-paths-layer" aria-hidden="true">
          <FloatingPaths position={1} />
          <FloatingPaths position={-1} />
        </div>

        <div className="fx-paths-content">
          {/* 1 — how CrowdChain differs from traditional crowdfunding */}
          <PlatformBenefits />

          <HowItWorks />
          <LifecycleSection />
          <MilestoneVotingExplainer />
          <SecurityModel />
          {stats && <StatsSection stats={stats} />}
          <Testimonials />
          <FAQ />

          {/* second-last: the campaigns making progress, right above the footer */}
          {campaigns.length > 0 && (
            <div className="px-5 sm:px-8 lg:px-10" data-section>
              <FeaturedCampaigns campaigns={campaigns} />
            </div>
          )}

          {/* landing footer — same dark theme as the app footer, with the
              same Auralis canvas backdrop the inner pages use */}
          <footer className="fx-footer" data-section>
            <div className="fx-footer-bg" aria-hidden="true">
              <Auralis
                height="100%"
                colors={["#a99bff", "#c9c0ff", "#7c6cff"]}
                speed={0.2}
                grain={0.4}
              />
            </div>
            <div className="fx-footer-grid">
              <div>
                <Link to="/" className="fx-wordmark">
                  <span className="fx-mark" />
                  CrowdChain
                </Link>
                <p className="fx-footer-lede">
                  Funds are held in an on-chain escrow and released milestone by milestone, only
                  after contributors vote to approve real, verified progress.
                </p>
              </div>
              <div>
                <h3 className="fx-footer-head">Platform</h3>
                <ul className="fx-footer-list">
                  <li><Link to="/explore">Explore Campaigns</Link></li>
                  <li><Link to="/create">Start a Campaign</Link></li>
                  <li><Link to="/about">How It Works</Link></li>
                  <li><Link to="/dashboard">Dashboard</Link></li>
                </ul>
              </div>
              <div>
                <h3 className="fx-footer-head">Resources</h3>
                <ul className="fx-footer-list">
                  <li><Link to="/voting">Milestone Voting</Link></li>
                  <li><Link to="/about#reputation">Creator Reputation</Link></li>
                  <li><Link to="/about#faq">FAQ</Link></li>
                </ul>
              </div>
            </div>
            <div className="fx-footer-bar">
              <p>© {new Date().getFullYear()} CrowdChain. Built on Ethereum-compatible chains.</p>
              <div className="flex gap-5">
                <Link to="/about">Terms</Link>
                <Link to="/about">Privacy</Link>
              </div>
            </div>
          </footer>
        </div>
      </div>
    </div>
  );
}
