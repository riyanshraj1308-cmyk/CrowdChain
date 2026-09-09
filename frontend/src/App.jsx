import { Routes, Route, useLocation } from "react-router-dom";
import { AnimatePresence } from "framer-motion";
import Navbar from "./components/layout/Navbar";
import DataModeBanner from "./components/layout/DataModeBanner";
import Footer from "./components/layout/Footer";
import PageTransition from "./components/layout/PageTransition";
import Landing from "./pages/Landing";
import Explore from "./pages/Explore";
import CampaignDetails from "./pages/CampaignDetails";
import CreateCampaign from "./pages/CreateCampaign";
import Dashboard from "./pages/Dashboard";
import Profile from "./pages/Profile";
import Voting from "./pages/Voting";
import About from "./pages/About";
import NotFound from "./pages/NotFound";

export default function App() {
  const location = useLocation();

  return (
    <div className="flex min-h-screen flex-col bg-paper-50">
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50 focus:rounded-md focus:bg-ink-950 focus:px-4 focus:py-2 focus:text-paper-50"
      >
        Skip to content
      </a>
      <Navbar />
      <DataModeBanner />
      <main id="main-content" className="flex-1">
        <AnimatePresence mode="wait">
          <Routes location={location} key={location.pathname}>
            <Route path="/" element={<PageTransition><Landing /></PageTransition>} />
            <Route path="/explore" element={<PageTransition><Explore /></PageTransition>} />
            <Route path="/campaigns/:id" element={<PageTransition><CampaignDetails /></PageTransition>} />
            <Route path="/create" element={<PageTransition><CreateCampaign /></PageTransition>} />
            <Route path="/dashboard" element={<PageTransition><Dashboard /></PageTransition>} />
            <Route path="/profile" element={<PageTransition><Profile /></PageTransition>} />
            <Route path="/voting" element={<PageTransition><Voting /></PageTransition>} />
            <Route path="/about" element={<PageTransition><About /></PageTransition>} />
            <Route path="*" element={<PageTransition><NotFound /></PageTransition>} />
          </Routes>
        </AnimatePresence>
      </main>
      <Footer />
    </div>
  );
}
