import Avatar from "../ui/Avatar";
import { formatEth, shortAddress, timeAgo } from "../../lib/format";
import { EmptyState } from "../ui/EmptyState";
import { Users } from "lucide-react";

export default function ContributorsList({ contributions = [] }) {
  if (!contributions.length) {
    return (
      <EmptyState
        icon={Users}
        title="No contributors yet"
        description="Be the first to back this campaign."
      />
    );
  }

  return (
    <ul className="flex flex-col divide-y divide-ink-950/8">
      {contributions.map((c) => (
        <li key={c.id || c.txHash} className="flex items-center gap-3 py-3.5">
          <Avatar address={c.user?.walletAddress} size={36} />
          <div className="flex-1">
            <p className="font-mono text-sm text-ink-900">
              {shortAddress(c.user?.walletAddress || "0x0000000000000000000000000000000000")}
            </p>
            <p className="text-xs text-ink-500">{timeAgo(c.createdAt)}</p>
          </div>
          <span className="font-mono text-sm font-medium text-ink-950">{formatEth(c.amount)} ETH</span>
        </li>
      ))}
    </ul>
  );
}
