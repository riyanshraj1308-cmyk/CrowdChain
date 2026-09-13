import { useEffect, useRef } from "react";
import { Routes, Route, useLocation } from "react-router-dom";
import { AnimatePresence } from "framer-motion";
import Lenis from "lenis";
import Navbar from "./components/layout/Navbar";
import Footer from "./components/layout/Footer";
import PageTransition from "./components/layout/PageTransition";
import CursorPet from "./components/layout/CursorPet";
import SmoothScroll from "./components/ui/SmoothScroll";
import PageBackdrop from "./components/ui/PageBackdrop";
import Landing from "./pages/Landing";
import Deepfield from "./pages/Deepfield";
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
  const lenisRef = useRef(null);

  // Smooth-scroll bridge for the globe iframe: the study's canvas calls
  // preventDefault on wheel (it must, to kill its own zoom handler), which
  // would otherwise fall back to UNsmoothed native scroll-chaining. The
  // iframe forwards its wheel deltas here; we feed them into the same Lenis
  // instance SmoothScroll owns, so scrolling over the globe keeps the page's
  // inertia. Wheel/scroll events also wake Lenis, which restarts its RAF loop
  // (it sleeps when idle).
  useEffect(() => {
    function onMessage(e) {
      if (e.data?.type !== "globe-wheel") return;
      if (typeof e.data?.dy !== "number" || !Number.isFinite(e.data.dy)) return;
      const lenis = lenisRef.current;
      if (!lenis) return;
      // Chase the target with the same lerp easing Lenis uses for real wheel
      // input, so scrolling over the globe feels identical to the rest of
      // the page.
      lenis.scrollTo(lenis.targetScroll + e.data.dy, { lerp: 0.1 });
    }
    window.addEventListener("message", onMessage);
    return () => window.removeEventListener("message", onMessage);
  }, []);

  // Chrome-free one-screen showcase — no navbar, banner, footer or scroll.
  if (location.pathname === "/deepfield") {
    return (
      <Routes location={location} key={location.pathname}>
        <Route path="/deepfield" element={<Deepfield />} />
        <Route path="*" element={<PageTransition><NotFound /></PageTransition>} />
      </Routes>
    );
  }

  // The landing page carries its own FLUX nav — the app navbar/banner would
  // stack a second header on top of it.
  const onLanding = location.pathname === "/";

  return (
    <div className="page-flux flex min-h-screen flex-col">
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50 focus:rounded-md focus:bg-ink-950 focus:px-4 focus:py-2 focus:text-paper-50"
      >
        Skip to content
      </a>
      {!onLanding && <Navbar />}
      {!onLanding && <PageBackdrop />}
      <SmoothScroll
        id="main-content"
        className="flex-1"
        lenisRef={lenisRef}
      >
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
      </SmoothScroll>
      <Footer />
      <CursorPet />
    </div>
  );
}
