import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Vote, ArrowRight } from "lucide-react";
import { api } from "../lib/api";
import { useAuth } from "../context/AuthContext";
import MilestoneVoteCard from "../components/campaign/MilestoneVoteCard";
import { EmptyState } from "../components/ui/EmptyState";
import Reveal from "../components/ui/Reveal";
import Button from "../components/ui/Button";
import Avatar from "../components/ui/Avatar";
import { shortAddress } from "../lib/format";

export default function Voting() {
  const { address } = useAuth();
  const [campaigns, setCampaigns] = useState([]);
  const [contributionsByCampaign, setContributionsByCampaign] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .listCampaigns({ status: "ACTIVE", pageSize: 50 })
      .then(async (res) => {
        const withOpenVotes = res.items.filter((c) => c.milestones.some((m) => m.status === "SUBMITTED"));
        setCampaigns(withOpenVotes);

        const entries = await Promise.all(
          withOpenVotes.map(async (c) => [c.id, await api.listContributors(c.id)])
        );
        setContributionsByCampaign(Object.fromEntries(entries));
      })
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="container-page py-10 sm:py-14">
      <Reveal className="max-w-2xl">
        <div className="flex items-center gap-2">
          <Vote className="h-5 w-5 text-copper-500" aria-hidden="true" />
          <span className="text-xs font-semibold uppercase tracking-wide text-copper-500">
            Community governance
          </span>
        </div>
        <h1 className="mt-2 text-3xl text-ink-950 sm:text-4xl">Milestone Voting</h1>
        <p className="mt-2 text-ink-600">
          These campaigns have submitted a milestone for review. Contributors vote with weight
          proportional to how much they've contributed — every vote here is a real, on-chain decision
          about whether funds move forward.
        </p>
      </Reveal>

      <div className="mt-10 flex flex-col gap-10">
        {loading && <p className="text-sm text-ink-500">Loading open votes…</p>}

        {!loading && !campaigns.length && (
          <EmptyState
            icon={Vote}
            title="No milestones are open for voting right now"
            description="Check back soon, or explore active campaigns to become a contributor and eligible voter."
            action={
              <Button as={Link} to="/explore" icon={ArrowRight} iconPosition="right">
                Explore Campaigns
              </Button>
            }
          />
        )}

        {campaigns.map((campaign) => {
          const submitted = campaign.milestones.find((m) => m.status === "SUBMITTED");
          const contributors = contributionsByCampaign[campaign.id] || [];
          const isContributor = contributors.some(
            (c) => c.user?.walletAddress?.toLowerCase() === address?.toLowerCase()
          );

          return (
            <Reveal key={campaign.id} className="rounded-lg border border-ink-950/10 p-5 sm:p-6">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <Link to={`/campaigns/${campaign.id}`} className="flex items-center gap-3 hover:opacity-80">
                  <Avatar address={campaign.creator.walletAddress} name={campaign.creator.displayName} size={36} />
                  <div>
                    <p className="font-display text-lg text-ink-950">{campaign.title}</p>
                    <p className="text-xs text-ink-500">
                      by {campaign.creator.displayName || shortAddress(campaign.creator.walletAddress)}
                    </p>
                  </div>
                </Link>
                <Button as={Link} to={`/campaigns/${campaign.id}`} variant="ghost" size="sm" icon={ArrowRight} iconPosition="right">
                  View campaign
                </Button>
              </div>

              <div className="mt-5">
                <MilestoneVoteCard campaign={campaign} milestone={submitted} isContributor={isContributor} />
              </div>
            </Reveal>
          );
        })}
      </div>
    </div>
  );
}
