import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowRight, Sun, Moon } from "lucide-react";
import { api } from "../lib/api";
import { useTheme } from "../context/ThemeContext";
import { useAuth } from "../context/AuthContext";
import { shortAddress } from "../lib/format";
import GlobeStudy from "../components/ui/GlobeStudy";
import { FloatingPaths } from "../components/ui/BackgroundPaths";
import FeaturedCampaigns from "../components/landing/FeaturedCampaigns";
import HowItWorks from "../components/landing/HowItWorks";
import MilestoneVotingExplainer from "../components/landing/MilestoneVotingExplainer";
import PlatformBenefits from "../components/landing/PlatformBenefits";
import StatsSection from "../components/landing/StatsSection";
import Testimonials from "../components/landing/Testimonials";
import FAQ from "../components/landing/FAQ";
import FinalCTA from "../components/landing/FinalCTA";
import "../styles/flux.css";

/**
 * Landing — the CrowdChain home.
 *
 * Hero: copy on the left, the ThreeUI globe study as a big interactive stage
 * toward the right (drag to spin, scroll passes through to the page's Lenis
 * smoothing, click to pin). After the first scroll the whole rest of the page
 * sits on the BackgroundPaths line-art layer:
 *
 *   Why CrowdChain  →  Current campaigns  →  How it works → …
 */

const NAV = [
  { label: "Explore", to: "/explore" },
  { label: "Vote on Milestones", to: "/voting" },
  { label: "Start a Campaign", to: "/create" },
  { label: "How It Works", to: "/about" },
];

const META = ["Escrow-secured", "Community-governed", "Milestone-released"];

function FluxThemeToggle() {
  const { theme, toggleTheme } = useTheme();
  return (
    <button
      onClick={toggleTheme}
      aria-label={theme === "dark" ? "Switch to light theme" : "Switch to dark theme"}
      title={theme === "dark" ? "Switch to light theme" : "Switch to dark theme"}
      className="flex h-11 w-11 items-center justify-center rounded-full border transition-colors fx-toggle"
    >
      {theme === "dark" ? (
        <Sun className="h-[18px] w-[18px]" aria-hidden="true" />
      ) : (
        <Moon className="h-[18px] w-[18px]" aria-hidden="true" />
      )}
    </button>
  );
}

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
          <FluxThemeToggle />
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

      {/* ── hero: copy left, globe stage right ── */}
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
          {/* `bare` renders the study on transparency; keepInteractivity gives
              drag/click-to-pin back and forwards wheel input to the page's
              Lenis instance so scrolling over the stage stays smooth. */}
          <GlobeStudy mode={theme} bare keepInteractivity />
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
       * Everything after the first scroll sits on the BackgroundPaths layer:
       * flowing line-art behind the sections, fading in under the hero.
       */}
      <div className="fx-paths-bg">
        <div className="fx-paths-layer" aria-hidden="true">
          <FloatingPaths position={1} />
          <FloatingPaths position={-1} />
        </div>

        <div className="fx-paths-content">
          {/* 1 — how CrowdChain differs from traditional crowdfunding */}
          <PlatformBenefits />

          {/* 2 — current campaigns */}
          {campaigns.length > 0 && (
            <div className="px-5 sm:px-8 lg:px-10">
              <FeaturedCampaigns campaigns={campaigns} />
            </div>
          )}

          <HowItWorks />
          <MilestoneVotingExplainer />
          {stats && <StatsSection stats={stats} />}
          <Testimonials />
          <FAQ />
          <FinalCTA />
        </div>
      </div>
    </div>
  );
}
