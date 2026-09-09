import { useState } from "react";
import { Wallet, ShieldCheck } from "lucide-react";
import Button from "../ui/Button";
import { Input } from "../ui/Field";
import { formatEth, formatUsd, percentFunded, daysRemaining } from "../../lib/format";
import { useAuth } from "../../context/AuthContext";
import { useToast } from "../../context/ToastContext";

const QUICK_AMOUNTS = ["0.1", "0.5", "1", "5"];

export default function ContributeWidget({ campaign, onContributed }) {
  const { isConnected, connect, status } = useAuth();
  const toast = useToast();
  const [amount, setAmount] = useState("0.5");
  const [submitting, setSubmitting] = useState(false);

  const percent = percentFunded(campaign.totalRaised, campaign.goal);
  const days = daysRemaining(campaign.deadline);
  const isActive = campaign.status === "ACTIVE" && days > 0;

  async function handleContribute() {
    if (!isConnected) {
      connect();
      return;
    }
    if (!amount || Number(amount) <= 0) {
      toast.error("Enter a contribution amount greater than 0.");
      return;
    }
    setSubmitting(true);
    try {
      // Production flow: send `contribute(campaignId)` via the connected
      // wallet with `value: amount`, then report the tx hash to
      // POST /campaigns/:id/contribute for verification. Simulated here.
      await new Promise((resolve) => setTimeout(resolve, 1400));
      toast.success(`Contribution of ${amount} ETH confirmed. Thank you for backing this campaign.`);
      onContributed?.(amount);
    } catch (err) {
      toast.error(err.message || "Contribution failed");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="rounded-lg border border-ink-950/10 bg-paper-50 p-6 shadow-card">
      <div className="flex items-baseline justify-between">
        <span className="font-mono text-2xl font-semibold text-ink-950">
          {formatEth(campaign.totalRaised)} ETH
        </span>
        <span className="text-sm text-ink-500">of {formatEth(campaign.goal)} ETH</span>
      </div>
      <p className="mt-1 text-sm text-ink-500">≈ {formatUsd(formatEth(campaign.totalRaised))} raised</p>

      <div className="mt-4 h-2 w-full overflow-hidden rounded-full bg-ink-950/8">
        <div className="h-full rounded-full bg-copper-500 transition-all duration-500" style={{ width: `${percent}%` }} />
      </div>

      <div className="mt-4 grid grid-cols-3 divide-x divide-ink-950/10 border-y border-ink-950/10 py-4 text-center">
        <div>
          <p className="font-display text-xl text-ink-950">{percent}%</p>
          <p className="text-xs text-ink-500">funded</p>
        </div>
        <div>
          <p className="font-display text-xl text-ink-950">{campaign.contributorCount}</p>
          <p className="text-xs text-ink-500">contributors</p>
        </div>
        <div>
          <p className="font-display text-xl text-ink-950">{days}</p>
          <p className="text-xs text-ink-500">days left</p>
        </div>
      </div>

      {isActive ? (
        <div className="mt-5 flex flex-col gap-3">
          <Input
            label="Contribution amount (ETH)"
            type="number"
            min="0"
            step="0.01"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
          />
          <div className="flex gap-2">
            {QUICK_AMOUNTS.map((val) => (
              <button
                key={val}
                onClick={() => setAmount(val)}
                className={`flex-1 rounded-md border py-2 text-sm font-medium transition-colors ${
                  amount === val
                    ? "border-copper-500 bg-copper-50 text-copper-600"
                    : "border-ink-950/15 text-ink-700 hover:border-ink-950/30"
                }`}
              >
                {val} Ξ
              </button>
            ))}
          </div>
          <Button
            size="lg"
            variant="accent"
            icon={Wallet}
            loading={submitting || status === "connecting" || status === "signing"}
            onClick={handleContribute}
          >
            {isConnected ? "Contribute Now" : "Connect Wallet to Contribute"}
          </Button>
          <p className="flex items-start gap-1.5 text-xs text-ink-500">
            <ShieldCheck className="mt-0.5 h-3.5 w-3.5 shrink-0 text-moss-500" aria-hidden="true" />
            Funds go directly into the campaign's on-chain escrow. Nothing reaches the creator until a
            milestone is submitted and approved by contributor vote.
          </p>
        </div>
      ) : (
        <div className="mt-5 rounded-md bg-ink-950/5 px-4 py-3 text-sm text-ink-600">
          {campaign.status === "COMPLETED"
            ? "This campaign has been fully funded and completed."
            : "This campaign is no longer accepting contributions."}
        </div>
      )}
    </div>
  );
}
