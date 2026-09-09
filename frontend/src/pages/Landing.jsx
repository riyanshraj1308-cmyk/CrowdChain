import { useEffect, useState } from "react";
import { api } from "../lib/api";
import Hero from "../components/landing/Hero";
import FeaturedCampaigns from "../components/landing/FeaturedCampaigns";
import HowItWorks from "../components/landing/HowItWorks";
import MilestoneVotingExplainer from "../components/landing/MilestoneVotingExplainer";
import PlatformBenefits from "../components/landing/PlatformBenefits";
import StatsSection from "../components/landing/StatsSection";
import Testimonials from "../components/landing/Testimonials";
import FAQ from "../components/landing/FAQ";
import FinalCTA from "../components/landing/FinalCTA";

export default function Landing() {
  const [campaigns, setCampaigns] = useState([]);
  const [stats, setStats] = useState(null);

  useEffect(() => {
    api.listCampaigns({ status: "ACTIVE", pageSize: 3 }).then((res) => setCampaigns(res.items));
    api.getPlatformStats().then(setStats);
  }, []);

  return (
    <div>
      <Hero />
      {campaigns.length > 0 && <FeaturedCampaigns campaigns={campaigns} />}
      <HowItWorks />
      <MilestoneVotingExplainer />
      <PlatformBenefits />
      {stats && <StatsSection stats={stats} />}
      <Testimonials />
      <FAQ />
      <FinalCTA />
    </div>
  );
}
