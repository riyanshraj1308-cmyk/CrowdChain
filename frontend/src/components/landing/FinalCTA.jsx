import { Link } from "react-router-dom";
import { ArrowRight, Rocket } from "lucide-react";
import Reveal from "../ui/Reveal";
import Button from "../ui/Button";

export default function FinalCTA() {
  return (
    <section className="bg-paper-50 py-20 sm:py-28">
      <div className="container-page">
        <Reveal className="flex flex-col items-center rounded-xl border border-ink-950/10 bg-ink-950 px-6 py-16 text-center sm:px-16">
          <h2 className="max-w-xl text-balance text-3xl text-paper-50 sm:text-4xl">
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
        </Reveal>
      </div>
    </section>
  );
}
