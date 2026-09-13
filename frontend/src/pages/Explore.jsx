import { useEffect, useMemo, useState } from "react";
import { api } from "../lib/api";
import CampaignFilters from "../components/campaign/CampaignFilters";
import CampaignGrid from "../components/campaign/CampaignGrid";
import PageHero from "../components/ui/PageHero";
import Reveal from "../components/ui/Reveal";
import GlassCTABanner from "../components/ui/GlassCTABanner";
import { percentFunded, daysRemaining } from "../lib/format";

export default function Explore() {
  const [campaigns, setCampaigns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({ query: "", category: "All", sort: "trending" });

  useEffect(() => {
    setLoading(true);
    api
      .listCampaigns({ pageSize: 50 })
      .then((res) => setCampaigns(res.items))
      .finally(() => setLoading(false));
  }, []);

  const filtered = useMemo(() => {
    let items = campaigns.filter((c) => c.status === "ACTIVE" || c.status === "COMPLETED" || c.status === "SUCCESSFUL");

    if (filters.category !== "All") {
      items = items.filter((c) => c.category === filters.category);
    }
    if (filters.query.trim()) {
      const q = filters.query.toLowerCase();
      items = items.filter(
        (c) => c.title.toLowerCase().includes(q) || c.description.toLowerCase().includes(q)
      );
    }

    const sorted = [...items];
    switch (filters.sort) {
      case "newest":
        sorted.reverse();
        break;
      case "ending-soon":
        sorted.sort((a, b) => daysRemaining(a.deadline) - daysRemaining(b.deadline));
        break;
      case "most-funded":
        sorted.sort((a, b) => percentFunded(b.totalRaised, b.goal) - percentFunded(a.totalRaised, a.goal));
        break;
      default:
        sorted.sort((a, b) => b.contributorCount - a.contributorCount);
    }
    return sorted;
  }, [campaigns, filters]);

  return (
    <div className="tab-content">
      <PageHero
        kicker="Live now"
        title="Explore Campaigns"
        cta="How funding works"
        ctaTo="/about"
      >
        Every campaign is funded through on-chain escrow with milestone-gated releases. Browse, dig
        into the milestone plan, and back the work you believe in.
      </PageHero>

      <div className="container-page mt-8 py-8">
        <CampaignFilters filters={filters} onChange={setFilters} />
      </div>

      <div className="mt-8">
        <CampaignGrid campaigns={filtered} loading={loading} />
      </div>

      <Reveal className="mt-16">
        <GlassCTABanner />
      </Reveal>
    </div>
  );
}
