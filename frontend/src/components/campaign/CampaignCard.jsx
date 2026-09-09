import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Users, Clock } from "lucide-react";
import Badge, { statusVariant } from "../ui/Badge";
import ProgressBar from "../ui/ProgressBar";
import { formatEth, percentFunded, daysRemaining } from "../../lib/format";

export default function CampaignCard({ campaign, index = 0 }) {
  const percent = percentFunded(campaign.totalRaised, campaign.goal);
  const days = daysRemaining(campaign.deadline);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-40px" }}
      transition={{ duration: 0.45, delay: Math.min(index * 0.06, 0.3), ease: [0.16, 1, 0.3, 1] }}
      whileHover={{ y: -4 }}
      className="group flex flex-col overflow-hidden rounded-lg border border-ink-950/10 bg-paper-50 shadow-card transition-shadow duration-200 hover:shadow-lifted"
    >
      <Link to={`/campaigns/${campaign.id}`} className="flex flex-1 flex-col focus:outline-none">
        <div className="relative h-44 w-full overflow-hidden bg-ink-100">
          <img
            src={campaign.imageUrl}
            alt=""
            loading="lazy"
            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.03]"
          />
          <div className="absolute left-3 top-3">
            <Badge variant={statusVariant(campaign.status)}>{formatStatus(campaign.status)}</Badge>
          </div>
        </div>

        <div className="flex flex-1 flex-col gap-3 p-5">
          <span className="text-xs font-medium uppercase tracking-wide text-copper-500">
            {campaign.category}
          </span>
          <h3 className="font-display text-lg leading-snug text-ink-950 group-hover:text-copper-600">
            {campaign.title}
          </h3>
          <p className="line-clamp-2 text-sm text-ink-600">{campaign.description}</p>

          <div className="mt-auto flex flex-col gap-2 pt-2">
            <ProgressBar percent={percent} />
            <div className="flex items-center justify-between text-sm">
              <span className="font-mono font-medium text-ink-950">
                {formatEth(campaign.totalRaised)} ETH
                <span className="ml-1 font-sans font-normal text-ink-500">raised · {percent}%</span>
              </span>
            </div>
            <div className="flex items-center justify-between text-xs text-ink-500">
              <span className="flex items-center gap-1">
                <Users className="h-3.5 w-3.5" aria-hidden="true" />
                {campaign.contributorCount} contributors
              </span>
              <span className="flex items-center gap-1">
                <Clock className="h-3.5 w-3.5" aria-hidden="true" />
                {days > 0 ? `${days}d left` : "Ended"}
              </span>
            </div>
          </div>
        </div>
      </Link>
    </motion.div>
  );
}

function formatStatus(status) {
  const map = {
    ACTIVE: "Active",
    SUCCESSFUL: "Funded",
    FAILED: "Failed",
    CANCELLED: "Cancelled",
    COMPLETED: "Completed",
  };
  return map[status] || status;
}
