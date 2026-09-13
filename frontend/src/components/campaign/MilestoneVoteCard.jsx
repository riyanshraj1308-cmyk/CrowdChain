import { useState } from "react";
import { motion } from "framer-motion";
import { ThumbsUp, ThumbsDown, Clock, ExternalLink } from "lucide-react";
import Button from "../ui/Button";
import Badge from "../ui/Badge";
import { formatEth } from "../../lib/format";
import { useAuth } from "../../context/AuthContext";
import { useToast } from "../../context/ToastContext";

/**
 * MilestoneVoteCard — the approve/reject UI for a submitted milestone.
 *
 * Two skins:
 *  - standalone (default): a regular card on the page's paper wash — theme
 *    tokens, readable in both themes (on Campaign Details).
 *  - embedded: lives on the NeonCard's always-dark face (Voting tab), so all
 *    colors are literal light-on-dark values rather than theme tokens.
 */
export default function MilestoneVoteCard({
  campaign,
  milestone,
  isContributor,
  onVoted,
  embedded = false,
}) {
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

  // Literal light-on-dark colors for the NeonCard face.
  const e = embedded;
  const heading = e ? "text-white" : "text-ink-950";
  const muted = e ? "text-white/60" : "text-ink-600";
  const body = e ? "text-white/75" : "text-ink-700";
  const faint = e ? "text-white/50" : "text-ink-500";
  const fainter = e ? "text-white/40" : "text-ink-400";
  const link = e ? "text-violet-300 hover:text-violet-300" : "text-copper-600";
  const track = e ? "bg-white/15" : "bg-ink-950/10";
  const approveLabel = e ? "text-moss-400" : "text-moss-600";
  const rejectLabel = e ? "text-rust-400" : "text-rust-500";

  return (
    <div
      className={
        e
          ? "w-full text-left"
          : "rounded-lg border border-ink-950/10 bg-paper-50 p-5 text-left sm:p-6"
      }
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <Badge variant="amber" icon={Clock}>
            Voting in progress
          </Badge>
          <h3 className={`mt-2 font-display text-xl ${heading}`}>
            Milestone {milestone.contractMilestoneId + 1}: {milestone.title}
          </h3>
        </div>
        {milestone.votingDeadline && (
          <p className={`text-sm ${muted}`}>
            Voting closes{" "}
            <strong className={e ? "text-white/90" : "text-ink-900"}>
              {new Date(milestone.votingDeadline).toLocaleDateString()}
            </strong>
          </p>
        )}
      </div>

      <p className={`mt-3 text-sm leading-relaxed ${body}`}>{milestone.description}</p>

      {milestone.proofUrl && (
        <a
          href={milestone.proofUrl}
          target="_blank"
          rel="noreferrer"
          className={`mt-3 inline-flex items-center gap-1.5 text-sm font-medium hover:underline ${link}`}
        >
          View submitted proof <ExternalLink className="h-3.5 w-3.5" aria-hidden="true" />
        </a>
      )}

      <div className="mt-5 space-y-2">
        <div className={`flex h-3 w-full overflow-hidden rounded-full ${track}`}>
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
          <span className={approveLabel}>
            <strong>{forPct}%</strong> approve ({votesFor.toLocaleString()} ETH weight)
          </span>
          <span className={rejectLabel}>
            <strong>{100 - forPct}%</strong> reject ({votesAgainst.toLocaleString()} ETH weight)
          </span>
        </div>
        <p className={`text-xs ${faint}`}>
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
            variant={e ? "accent" : "primary"}
            className={`flex-1 ${e ? "" : "!bg-moss-500 !border-moss-500 hover:!bg-moss-600"}`}
            icon={ThumbsUp}
            loading={voting === "for"}
            disabled={Boolean(voting)}
            onClick={() => handleVote(true)}
          >
            Vote to Approve
          </Button>
          <Button
            variant="danger"
            className={`flex-1 ${e ? "!border-rust-400/70 !text-rust-400 hover:!bg-rust-400/10" : ""}`}
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
        <p className={`mt-3 text-xs ${faint}`}>
          Only wallets with a confirmed contribution to this campaign can vote.
        </p>
      )}
      <p className={`mt-3 text-xs ${fainter}`}>
        Approval status shown here reflects {meetsThreshold ? "a passing" : "a failing"} threshold at
        the current vote tally — final outcome is finalized on-chain once voting closes.
      </p>
    </div>
  );
}
