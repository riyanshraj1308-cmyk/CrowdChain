import CampaignCard from "./CampaignCard";
import { CampaignCardSkeleton } from "../ui/Skeleton";
import { EmptyState } from "../ui/EmptyState";
import { SearchX } from "lucide-react";

export default function CampaignGrid({ campaigns, loading }) {
  if (loading) {
    return (
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <CampaignCardSkeleton key={i} />
        ))}
      </div>
    );
  }

  if (!campaigns.length) {
    return (
      <EmptyState
        icon={SearchX}
        title="No campaigns match your filters"
        description="Try a different category or search term."
      />
    );
  }

  return (
    <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
      {campaigns.map((c, i) => (
        <CampaignCard key={c.id} campaign={c} index={i} />
      ))}
    </div>
  );
}
