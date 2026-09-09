import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Rocket, Coins, Vote, History, ArrowRight, Wallet } from "lucide-react";
import { api } from "../lib/api";
import { useAuth } from "../context/AuthContext";
import Tabs from "../components/ui/Tabs";
import Button from "../components/ui/Button";
import Badge, { statusVariant } from "../components/ui/Badge";
import { StatCard, EmptyState } from "../components/ui/EmptyState";
import CampaignGrid from "../components/campaign/CampaignGrid";
import ProgressBar from "../components/ui/ProgressBar";
import Reveal from "../components/ui/Reveal";
import { formatEth, formatDate, percentFunded, shortAddress } from "../lib/format";

export default function Dashboard() {
  const { isConnected, address, connect } = useAuth();
  const [tab, setTab] = useState("creator");
  const [myCampaigns, setMyCampaigns] = useState([]);
  const [myContributions, setMyContributions] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!address) return;
    setLoading(true);
    Promise.all([
      api.listCampaigns({ creator: address, pageSize: 50 }),
      api.listUserContributions(address),
      api.listTransactions(),
    ])
      .then(([campaignRes, contributions, txs]) => {
        setMyCampaigns(campaignRes.items);
        setMyContributions(contributions);
        setTransactions(txs);
      })
      .finally(() => setLoading(false));
  }, [address]);

  const totalRaisedAcrossCreated = useMemo(
    () => myCampaigns.reduce((sum, c) => sum + Number(formatEth(c.totalRaised, { maxDecimals: 8 })), 0),
    [myCampaigns]
  );
  const totalContributed = useMemo(
    () => myContributions.reduce((sum, c) => sum + Number(formatEth(c.amount, { maxDecimals: 8 })), 0),
    [myContributions]
  );
  const pendingVotes = myContributions.filter((c) =>
    c.campaign?.milestones?.some((m) => m.status === "SUBMITTED")
  );

  if (!isConnected) {
    return (
      <div className="container-page py-20">
        <EmptyState
          icon={Wallet}
          title="Connect your wallet to view your dashboard"
          description="Your campaigns, contributions, and pending votes will show up here."
          action={<Button icon={Wallet} onClick={connect}>Connect Wallet</Button>}
        />
      </div>
    );
  }

  return (
    <div className="container-page py-10 sm:py-14">
      <Reveal>
        <h1 className="text-3xl text-ink-950 sm:text-4xl">Dashboard</h1>
        <p className="mt-2 text-ink-600">Signed in as {shortAddress(address)}</p>
      </Reveal>

      <div className="mt-8 grid grid-cols-2 gap-4 sm:grid-cols-4">
        <StatCard icon={Rocket} label="Campaigns launched" value={myCampaigns.length} />
        <StatCard icon={Coins} label="Total raised" value={`${totalRaisedAcrossCreated.toFixed(2)} ETH`} />
        <StatCard icon={Coins} label="Total contributed" value={`${totalContributed.toFixed(2)} ETH`} />
        <StatCard icon={Vote} label="Votes awaiting you" value={pendingVotes.length} />
      </div>

      <div className="mt-10">
        <Tabs
          tabs={[
            { value: "creator", label: "My Campaigns", count: myCampaigns.length },
            { value: "contributor", label: "My Contributions", count: myContributions.length },
            { value: "votes", label: "Needs Your Vote", count: pendingVotes.length },
            { value: "history", label: "Transaction History" },
          ]}
          active={tab}
          onChange={setTab}
        />

        <div className="mt-8">
          {tab === "creator" &&
            (myCampaigns.length ? (
              <CampaignGrid campaigns={myCampaigns} loading={loading} />
            ) : (
              <EmptyState
                icon={Rocket}
                title="You haven't launched a campaign yet"
                description="Define clear milestones and start raising funds in escrow."
                action={
                  <Button as={Link} to="/create" icon={Rocket}>
                    Start a Campaign
                  </Button>
                }
              />
            ))}

          {tab === "contributor" &&
            (myContributions.length ? (
              <ul className="flex flex-col gap-4">
                {myContributions.map((c) => (
                  <ContributionRow key={c.id} contribution={c} />
                ))}
              </ul>
            ) : (
              <EmptyState
                icon={Coins}
                title="No contributions yet"
                description="Explore active campaigns and back the work you believe in."
                action={
                  <Button as={Link} to="/explore" icon={ArrowRight} iconPosition="right">
                    Explore Campaigns
                  </Button>
                }
              />
            ))}

          {tab === "votes" &&
            (pendingVotes.length ? (
              <ul className="flex flex-col gap-4">
                {pendingVotes.map((c) => (
                  <li key={c.id} className="flex items-center justify-between gap-4 rounded-lg border border-amber-400/40 bg-amber-50/40 p-5">
                    <div>
                      <Badge variant="amber">Voting open</Badge>
                      <p className="mt-2 font-display text-lg text-ink-950">{c.campaign.title}</p>
                      <p className="text-sm text-ink-600">A milestone needs your approval vote.</p>
                    </div>
                    <Button as={Link} to={`/campaigns/${c.campaign.id}`} variant="accent" icon={Vote}>
                      Review & Vote
                    </Button>
                  </li>
                ))}
              </ul>
            ) : (
              <EmptyState icon={Vote} title="Nothing needs your vote right now" description="You're all caught up." />
            ))}

          {tab === "history" &&
            (transactions.length ? (
              <ul className="flex flex-col divide-y divide-ink-950/8 rounded-lg border border-ink-950/10">
                {transactions.map((tx) => (
                  <TransactionRow key={tx.id} tx={tx} />
                ))}
              </ul>
            ) : (
              <EmptyState icon={History} title="No transactions yet" />
            ))}
        </div>
      </div>
    </div>
  );
}

function ContributionRow({ contribution }) {
  const c = contribution.campaign;
  const percent = percentFunded(c.totalRaised, c.goal);
  return (
    <li className="flex flex-col gap-4 rounded-lg border border-ink-950/10 p-5 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex-1">
        <div className="flex items-center gap-2">
          <Badge variant={statusVariant(c.status)}>{c.status}</Badge>
        </div>
        <Link to={`/campaigns/${c.id}`} className="mt-2 block font-display text-lg text-ink-950 hover:text-copper-600">
          {c.title}
        </Link>
        <p className="mt-1 text-sm text-ink-500">Contributed {formatEth(contribution.amount)} ETH · {formatDate(contribution.createdAt)}</p>
        <div className="mt-3 max-w-xs">
          <ProgressBar percent={percent} />
        </div>
      </div>
      <Button as={Link} to={`/campaigns/${c.id}`} variant="secondary" size="sm">
        View Campaign
      </Button>
    </li>
  );
}

function TransactionRow({ tx }) {
  const TYPE_LABELS = {
    CONTRIBUTION: "Contribution",
    VOTE_CAST: "Vote cast",
    FUNDS_RELEASED: "Funds released",
    MILESTONE_SUBMITTED: "Milestone submitted",
  };
  return (
    <li className="flex items-center justify-between gap-4 p-4">
      <div>
        <p className="text-sm font-medium text-ink-950">{TYPE_LABELS[tx.type] || tx.type}</p>
        <p className="text-xs text-ink-500">{tx.campaignTitle}</p>
      </div>
      <div className="text-right">
        {tx.amount && <p className="font-mono text-sm text-ink-950">{formatEth(tx.amount)} ETH</p>}
        <p className="font-mono text-xs text-ink-400">{shortAddress(tx.txHash)}</p>
      </div>
    </li>
  );
}
