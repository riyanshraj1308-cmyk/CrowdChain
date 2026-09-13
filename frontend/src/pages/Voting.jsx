import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Vote, ArrowRight } from "lucide-react";
import { api } from "../lib/api";
import { useAuth } from "../context/AuthContext";
import MilestoneVoteCard from "../components/campaign/MilestoneVoteCard";
import NeonCard from "../components/ui/NeonCard";
import PageHero from "../components/ui/PageHero";
import { EmptyState } from "../components/ui/EmptyState";
import Reveal from "../components/ui/Reveal";
import GlassCTABanner from "../components/ui/GlassCTABanner";
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
    <div className="tab-content">
      <PageHero kicker="Community governance" icon={Vote} title="Milestone Voting">
        These campaigns have submitted a milestone for review. Contributors vote with weight
        proportional to how much they've contributed — every vote here is a real, on-chain decision
        about whether funds move forward.
      </PageHero>

      <div className="container-page mt-10 flex flex-col gap-10 py-6 sm:py-8">
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
            <Reveal key={campaign.id}>
              {/* The Uiverse neon pulse card — always-dark skin with the roaming
                  glow dot, replacing the old amber panel. */}
              <NeonCard>
                <div className="flex w-full flex-col gap-5 p-5 text-left sm:p-6">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <Link to={`/campaigns/${campaign.id}`} className="flex items-center gap-3 hover:opacity-80">
                      <Avatar address={campaign.creator.walletAddress} name={campaign.creator.displayName} size={36} />
                      <div>
                        <p className="font-display text-lg text-white">{campaign.title}</p>
                        <p className="text-xs text-white/60">
                          by {campaign.creator.displayName || shortAddress(campaign.creator.walletAddress)}
                        </p>
                      </div>
                    </Link>
                    <Button
                      as={Link}
                      to={`/campaigns/${campaign.id}`}
                      variant="secondary"
                      size="sm"
                      icon={ArrowRight}
                      iconPosition="right"
                      className="!border-white/25 !text-white hover:!bg-white/10"
                    >
                      View campaign
                    </Button>
                  </div>

                  <div className="text-left">
                    <MilestoneVoteCard
                      campaign={campaign}
                      milestone={submitted}
                      isContributor={isContributor}
                      embedded
                    />
                  </div>
                </div>
              </NeonCard>
            </Reveal>
          );
        })}
      </div>

      <Reveal className="mt-16">
        <GlassCTABanner />
      </Reveal>
    </div>
  );
}
