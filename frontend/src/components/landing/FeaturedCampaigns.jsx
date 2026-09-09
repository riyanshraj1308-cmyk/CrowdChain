import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import CampaignCard from "../campaign/CampaignCard";
import Reveal from "../ui/Reveal";
import Button from "../ui/Button";

export default function FeaturedCampaigns({ campaigns }) {
  return (
    <section className="border-b border-ink-950/8 bg-paper-50 py-20 sm:py-28">
      <div className="container-page">
        <Reveal className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-end">
          <div>
            <span className="text-xs font-semibold uppercase tracking-wide text-copper-500">
              Featured
            </span>
            <h2 className="mt-2 text-3xl text-ink-950 sm:text-4xl">Campaigns making progress</h2>
          </div>
          <Button as={Link} to="/explore" variant="ghost" icon={ArrowRight} iconPosition="right">
            View all campaigns
          </Button>
        </Reveal>

        <div className="mt-10 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {campaigns.map((c, i) => (
            <CampaignCard key={c.id} campaign={c} index={i} />
          ))}
        </div>
      </div>
    </section>
  );
}
