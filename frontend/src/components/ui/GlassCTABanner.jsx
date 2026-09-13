import { Link } from "react-router-dom";
import { ArrowRight, Rocket } from "lucide-react";
import Button from "./Button";
import RectangleButtonsScene from "./RectangleButtonsScene";

/**
 * GlassCTABanner — the ThreeUI glassmorphism CTA stage on a dark card.
 *
 * The card is deliberately theme-INDEPENDENT (always the deep ink showpiece):
 * the glass effect's iframe stage is near-black, so the backdrop must stay
 * dark even when the app flips to dark mode — otherwise the stage reads as a
 * black hole on a light card. Colors are pinned hex values, not theme tokens.
 */
export default function GlassCTABanner() {
  return (
    <div className="panel-ink flex flex-col items-center rounded-xl border border-ink-950/10 px-6 py-14 text-center shadow-lifted sm:px-16">
      <RectangleButtonsScene
        variant="glassmorphism-cta"
        mode="dark"
        hue={0}
        saturation={1.0}
        brightness={1.0}
        className="h-28 max-w-sm"
      />
      <h2 className="mt-6 max-w-xl text-balance text-2xl text-paper-50 sm:text-3xl">
        Ready to fund what deserves to exist?
      </h2>
      <p className="mt-4 max-w-md text-base text-paper-200/70">
        Connect a wallet, browse active campaigns, or launch your own — with milestones your
        contributors can actually hold you to.
      </p>
      <div className="mt-8 flex flex-col gap-3 sm:flex-row">
        <Button as={Link} to="/explore" size="lg" variant="accent" icon={ArrowRight} iconPosition="right">
          Explore Campaigns
        </Button>
        <Button
          as={Link}
          to="/create"
          size="lg"
          variant="secondary"
          icon={Rocket}
          className="!border-paper-50/30 !text-paper-50 hover:!bg-paper-50/10"
        >
          Start a Campaign
        </Button>
      </div>
    </div>
  );
}
