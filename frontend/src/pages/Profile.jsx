import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { Award, Rocket, Users, CheckCircle2, AlertTriangle, Wallet } from "lucide-react";
import { api } from "../lib/api";
import { useAuth } from "../context/AuthContext";
import Avatar from "../components/ui/Avatar";
import { StatCard, EmptyState } from "../components/ui/EmptyState";
import CampaignGrid from "../components/campaign/CampaignGrid";
import Reveal from "../components/ui/Reveal";
import Button from "../components/ui/Button";
import { shortAddress } from "../lib/format";

export default function Profile() {
  const [searchParams] = useSearchParams();
  const { address: myAddress, user: myUser, isConnected, connect } = useAuth();
  const viewedAddress = searchParams.get("address") || myAddress;

  const [reputation, setReputation] = useState(null);
  const [campaigns, setCampaigns] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!viewedAddress) return;
    setLoading(true);
    Promise.all([
      api.getReputation(viewedAddress),
      api.listCampaigns({ creator: viewedAddress, pageSize: 50 }),
    ])
      .then(([rep, campaignRes]) => {
        setReputation(rep);
        setCampaigns(campaignRes.items);
      })
      .finally(() => setLoading(false));
  }, [viewedAddress]);

  if (!viewedAddress) {
    return (
      <div className="container-page py-20">
        <EmptyState
          icon={Wallet}
          title="Connect your wallet to view your profile"
          action={<Button icon={Wallet} onClick={connect}>Connect Wallet</Button>}
        />
      </div>
    );
  }

  const isOwnProfile = viewedAddress?.toLowerCase() === myAddress?.toLowerCase();
  const displayName = isOwnProfile ? myUser?.displayName : null;

  return (
    <div className="container-page py-10 sm:py-14">
      <Reveal className="flex flex-col items-start gap-6 sm:flex-row sm:items-center">
        <Avatar address={viewedAddress} name={displayName} size={72} />
        <div>
          <h1 className="font-display text-3xl text-ink-950">
            {displayName || shortAddress(viewedAddress)}
          </h1>
          <p className="mt-1 font-mono text-sm text-ink-500">{viewedAddress}</p>
          {isOwnProfile && !isConnected && (
            <Button className="mt-3" size="sm" icon={Wallet} onClick={connect}>
              Connect to edit profile
            </Button>
          )}
        </div>
      </Reveal>

      {reputation && (
        <div className="mt-10">
          <div className="flex items-center gap-2">
            <Award className="h-5 w-5 text-copper-500" aria-hidden="true" />
            <h2 className="font-display text-xl text-ink-950">Reputation</h2>
          </div>
          <div className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-4">
            <StatCard icon={Award} label="Reputation score" value={reputation.score ?? 0} />
            <StatCard
              icon={Rocket}
              label="Successful campaigns"
              value={`${reputation.successfulCampaigns ?? 0}/${reputation.totalCampaigns ?? 0}`}
            />
            <StatCard
              icon={CheckCircle2}
              label="Milestone completion"
              value={`${reputation.milestoneCompletionPct ?? 0}%`}
            />
            <StatCard icon={Users} label="Total contributors" value={reputation.totalContributors ?? 0} />
          </div>
          {reputation.rejectedMilestones > 0 && (
            <div className="mt-4 flex items-center gap-2 rounded-md border border-rust-400/30 bg-rust-50 px-4 py-3 text-sm text-rust-600">
              <AlertTriangle className="h-4 w-4 shrink-0" aria-hidden="true" />
              {reputation.rejectedMilestones} milestone{reputation.rejectedMilestones > 1 ? "s" : ""} rejected
              by contributor vote.
            </div>
          )}
        </div>
      )}

      <div className="mt-12">
        <h2 className="font-display text-xl text-ink-950">
          {isOwnProfile ? "Your campaigns" : "Campaigns launched"}
        </h2>
        <div className="mt-5">
          {campaigns.length ? (
            <CampaignGrid campaigns={campaigns} loading={loading} />
          ) : (
            <EmptyState icon={Rocket} title="No campaigns launched yet" />
          )}
        </div>
      </div>
    </div>
  );
}
