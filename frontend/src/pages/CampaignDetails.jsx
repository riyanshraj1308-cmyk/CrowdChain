import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { ArrowLeft, ExternalLink, Shield } from "lucide-react";
import { api } from "../lib/api";
import { shortAddress, formatDate } from "../lib/format";
import Badge, { statusVariant } from "../components/ui/Badge";
import Avatar from "../components/ui/Avatar";
import Tabs from "../components/ui/Tabs";
import Skeleton from "../components/ui/Skeleton";
import ContributeWidget from "../components/campaign/ContributeWidget";
import MilestoneTimeline from "../components/campaign/MilestoneTimeline";
import MilestoneVoteCard from "../components/campaign/MilestoneVoteCard";
import ContributorsList from "../components/campaign/ContributorsList";
import Reveal from "../components/ui/Reveal";
import { useAuth } from "../context/AuthContext";

export default function CampaignDetails() {
  const { id } = useParams();
  const { address } = useAuth();
  const [campaign, setCampaign] = useState(null);
  const [contributors, setContributors] = useState([]);
  const [tab, setTab] = useState("story");
  const [activeMilestoneId, setActiveMilestoneId] = useState(null);

  useEffect(() => {
    api.getCampaign(id).then((c) => {
      setCampaign(c);
      setActiveMilestoneId(c.milestones?.[0]?.contractMilestoneId ?? null);
    });
    api.listContributors(id).then(setContributors);
  }, [id]);

  if (!campaign) return <DetailsSkeleton />;

  const submittedMilestone = campaign.milestones.find((m) => m.status === "SUBMITTED");
  const isContributor = contributors.some(
    (c) => c.user?.walletAddress?.toLowerCase() === address?.toLowerCase()
  );

  return (
    <div className="container-page py-10 sm:py-14">
      <Link to="/explore" className="mb-6 inline-flex items-center gap-1.5 text-sm font-medium text-ink-600 hover:text-ink-950">
        <ArrowLeft className="h-4 w-4" aria-hidden="true" /> Back to Explore
      </Link>

      <div className="grid gap-10 lg:grid-cols-[1fr_380px] lg:gap-12">
        <div className="min-w-0">
          <Reveal>
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant={statusVariant(campaign.status)}>{campaign.status}</Badge>
              <Badge variant="neutral">{campaign.category}</Badge>
            </div>
            <h1 className="mt-4 text-balance text-3xl text-ink-950 sm:text-4xl">{campaign.title}</h1>

            <Link
              to={`/profile?address=${campaign.creator.walletAddress}`}
              className="mt-5 inline-flex items-center gap-3 rounded-md border border-ink-950/10 p-2 pr-4 hover:bg-ink-950/3"
            >
              <Avatar address={campaign.creator.walletAddress} name={campaign.creator.displayName} size={40} />
              <div>
                <p className="text-sm font-semibold text-ink-950">
                  {campaign.creator.displayName || shortAddress(campaign.creator.walletAddress)}
                </p>
                <p className="text-xs text-ink-500">
                  Reputation score {campaign.creator.reputation?.score ?? "—"} · Creator
                </p>
              </div>
            </Link>
          </Reveal>

          <Reveal delay={0.05} className="mt-8 overflow-hidden rounded-lg border border-ink-950/10">
            <img src={campaign.imageUrl} alt="" className="h-64 w-full object-cover sm:h-80" />
          </Reveal>

          <div className="mt-8">
            <Tabs
              tabs={[
                { value: "story", label: "Story" },
                { value: "milestones", label: "Milestones", count: campaign.milestones.length },
                { value: "contributors", label: "Contributors", count: contributors.length },
              ]}
              active={tab}
              onChange={setTab}
            />

            <div className="mt-6">
              {tab === "story" && (
                <Reveal className="prose-none">
                  <p className="whitespace-pre-line text-[15px] leading-relaxed text-ink-700">
                    {campaign.description}
                  </p>
                  <div className="mt-8 flex items-start gap-3 rounded-md border border-ink-950/10 bg-paper-100 p-4">
                    <Shield className="mt-0.5 h-5 w-5 shrink-0 text-copper-500" aria-hidden="true" />
                    <p className="text-sm text-ink-600">
                      This campaign's contract is deployed at{" "}
                      <span className="font-mono text-ink-800">
                        {shortAddress(campaign.contractAddress || "0x0000000000000000000000000000000000dead")}
                      </span>
                      . Deadline: {formatDate(campaign.deadline)}.{" "}
                      <a href="#" className="inline-flex items-center gap-1 font-medium text-copper-600 hover:underline">
                        View on explorer <ExternalLink className="h-3 w-3" aria-hidden="true" />
                      </a>
                    </p>
                  </div>
                </Reveal>
              )}

              {tab === "milestones" && (
                <div className="flex flex-col gap-8">
                  {submittedMilestone && (
                    <MilestoneVoteCard
                      campaign={campaign}
                      milestone={submittedMilestone}
                      isContributor={isContributor}
                    />
                  )}
                  <Reveal>
                    <MilestoneTimeline
                      milestones={campaign.milestones}
                      activeId={activeMilestoneId}
                      onSelect={setActiveMilestoneId}
                    />
                  </Reveal>
                </div>
              )}

              {tab === "contributors" && (
                <Reveal>
                  <ContributorsList contributions={contributors} />
                </Reveal>
              )}
            </div>
          </div>
        </div>

        <div className="lg:sticky lg:top-24 lg:self-start">
          <ContributeWidget campaign={campaign} onContributed={() => api.getCampaign(id).then(setCampaign)} />
        </div>
      </div>
    </div>
  );
}

function DetailsSkeleton() {
  return (
    <div className="container-page py-14">
      <div className="grid gap-10 lg:grid-cols-[1fr_380px]">
        <div>
          <Skeleton className="h-6 w-40" />
          <Skeleton className="mt-4 h-10 w-3/4" />
          <Skeleton className="mt-6 h-14 w-64" />
          <Skeleton className="mt-8 h-80 w-full" />
        </div>
        <Skeleton className="h-96 w-full" />
      </div>
    </div>
  );
}
