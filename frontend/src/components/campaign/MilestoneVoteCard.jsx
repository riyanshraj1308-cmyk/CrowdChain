import { useState } from "react";
import { motion } from "framer-motion";
import { ThumbsUp, ThumbsDown, Clock, ExternalLink } from "lucide-react";
import Button from "../ui/Button";
import Badge from "../ui/Badge";
import { formatEth } from "../../lib/format";
import { useAuth } from "../../context/AuthContext";
import { useToast } from "../../context/ToastContext";

export default function MilestoneVoteCard({ campaign, milestone, isContributor, onVoted }) {
  const { isConnected, connect } = useAuth();
  const toast = useToast();
  const [voting, setVoting] = useState(null); // 'for' | 'against' | null
  const [voted, setVoted] = useState(null);

  const votesFor = Number(formatEth(milestone.votesFor, { maxDecimals: 6 }));
  const votesAgainst = Number(formatEth(milestone.votesAgainst, { maxDecimals: 6 }));
  const totalVotes = votesFor + votesAgainst;
  const forPct = totalVotes ? Math.round((votesFor / totalVotes) * 100) : 0;
  const meetsThreshold = forPct >= 50;

  async function handleVote(support) {
    if (!isConnected) {
      connect();
      return;
    }
    if (!isContributor) {
      toast.error("Only confirmed contributors to this campaign can vote on its milestones.");
      return;
    }
    setVoting(support ? "for" : "against");
    try {
      // In production this first sends `voteOnMilestone()` to the contract via
      // the connected wallet, then reports the resulting tx hash to the
      // backend for verification. Simulated here for the demo build.
      await new Promise((resolve) => setTimeout(resolve, 1200));
      setVoted(support ? "for" : "against");
      toast.success(`Vote recorded: ${support ? "approve" : "reject"} milestone ${milestone.contractMilestoneId + 1}.`);
      onVoted?.();
    } catch (err) {
      toast.error(err.message || "Vote failed");
    } finally {
      setVoting(null);
    }
  }

  return (
    <div className="rounded-lg border border-amber-400/40 bg-amber-50/40 p-5 sm:p-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <Badge variant="amber" icon={Clock}>
            Voting in progress
          </Badge>
          <h3 className="mt-2 font-display text-xl text-ink-950">
            Milestone {milestone.contractMilestoneId + 1}: {milestone.title}
          </h3>
        </div>
        {milestone.votingDeadline && (
          <p className="text-sm text-ink-600">
            Voting closes <strong className="text-ink-900">{new Date(milestone.votingDeadline).toLocaleDateString()}</strong>
          </p>
        )}
      </div>

      <p className="mt-3 text-sm leading-relaxed text-ink-700">{milestone.description}</p>

      {milestone.proofUrl && (
        <a
          href={milestone.proofUrl}
          target="_blank"
          rel="noreferrer"
          className="mt-3 inline-flex items-center gap-1.5 text-sm font-medium text-copper-600 hover:underline"
        >
          View submitted proof <ExternalLink className="h-3.5 w-3.5" aria-hidden="true" />
        </a>
      )}

      <div className="mt-5 space-y-2">
        <div className="flex h-3 w-full overflow-hidden rounded-full bg-ink-950/10">
          <motion.div
            className="h-full bg-moss-500"
            initial={{ width: 0 }}
            animate={{ width: `${forPct}%` }}
            transition={{ type: "spring", stiffness: 90, damping: 20 }}
          />
          <motion.div
            className="h-full bg-rust-400"
            initial={{ width: 0 }}
            animate={{ width: `${100 - forPct}%` }}
            transition={{ type: "spring", stiffness: 90, damping: 20 }}
          />
        </div>
        <div className="flex items-center justify-between text-sm">
          <span className="text-moss-600">
            <strong>{forPct}%</strong> approve ({votesFor.toLocaleString()} ETH weight)
          </span>
          <span className="text-rust-500">
            <strong>{100 - forPct}%</strong> reject ({votesAgainst.toLocaleString()} ETH weight)
          </span>
        </div>
        <p className="text-xs text-ink-500">
          Requires ≥50% of cast voting weight to approve. Weight is proportional to each contributor's
          ETH contribution.
        </p>
      </div>

      {voted ? (
        <div
          className={`mt-5 rounded-md border px-4 py-3 text-sm font-medium ${
            voted === "for"
              ? "border-moss-100 bg-moss-50 text-moss-600"
              : "border-rust-400/30 bg-rust-50 text-rust-600"
          }`}
        >
          You voted to {voted === "for" ? "approve" : "reject"} this milestone.
        </div>
      ) : (
        <div className="mt-5 flex flex-col gap-3 sm:flex-row">
          <Button
            variant="primary"
            className="flex-1 !bg-moss-500 !border-moss-500 hover:!bg-moss-600"
            icon={ThumbsUp}
            loading={voting === "for"}
            disabled={Boolean(voting)}
            onClick={() => handleVote(true)}
          >
            Vote to Approve
          </Button>
          <Button
            variant="danger"
            className="flex-1"
            icon={ThumbsDown}
            loading={voting === "against"}
            disabled={Boolean(voting)}
            onClick={() => handleVote(false)}
          >
            Vote to Reject
          </Button>
        </div>
      )}
      {!isContributor && isConnected && !voted && (
        <p className="mt-3 text-xs text-ink-500">
          Only wallets with a confirmed contribution to this campaign can vote.
        </p>
      )}
      <p className="mt-3 text-xs text-ink-400">
        Approval status shown here reflects {meetsThreshold ? "a passing" : "a failing"} threshold at
        the current vote tally — final outcome is finalized on-chain once voting closes.
      </p>
    </div>
  );
}
