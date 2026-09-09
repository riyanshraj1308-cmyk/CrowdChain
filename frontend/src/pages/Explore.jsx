import { useEffect, useMemo, useState } from "react";
import { api } from "../lib/api";
import CampaignFilters from "../components/campaign/CampaignFilters";
import CampaignGrid from "../components/campaign/CampaignGrid";
import Reveal from "../components/ui/Reveal";
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
    <div className="container-page py-12 sm:py-16">
      <Reveal>
        <h1 className="text-3xl text-ink-950 sm:text-4xl">Explore Campaigns</h1>
        <p className="mt-2 max-w-xl text-ink-600">
          Every campaign below is funded through on-chain escrow with milestone-gated releases.
          Browse, dig into the milestone plan, and back the work you believe in.
        </p>
      </Reveal>

      <div className="mt-8">
        <CampaignFilters filters={filters} onChange={setFilters} />
      </div>

      <div className="mt-8">
        <CampaignGrid campaigns={filtered} loading={loading} />
      </div>
    </div>
  );
}
