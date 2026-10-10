import { useEffect, useRef } from "react";
import { Routes, Route, useLocation } from "react-router-dom";
import { AnimatePresence } from "framer-motion";
import Lenis from "lenis";
import Navbar from "./components/layout/Navbar";
import Footer from "./components/layout/Footer";
import PageTransition from "./components/layout/PageTransition";
import CursorPet from "./components/layout/CursorPet";
import SnapScroll from "./components/ui/SnapScroll";
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

  // Static hosts (opening dist/index.html directly, or any server without
  // SPA rewrite rules) serve the app at "/index.html". Treat that path as
  // the root route so the site boots on the landing instead of a 404.
  const isStaticIndex = location.pathname.endsWith("/index.html");
  const routeLocation = isStaticIndex ? { ...location, pathname: "/" } : location;

  // Smooth-scroll bridge for the globe iframe: the study's canvas calls
  // preventDefault on wheel (killing its own zoom handler), so raw deltas
  // are forwarded here and fed into the same Lenis instance SnapScroll
  // owns — the page keeps its smooth inertia when scrolling over the globe.
  useEffect(() => {
    function onMessage(e) {
      if (e.data?.type !== "globe-wheel") return;
      if (typeof e.data?.dy !== "number" || !Number.isFinite(e.data.dy)) return;
      const lenis = lenisRef.current;
      if (!lenis) return;
      // Chase the target with the same easing Lenis uses for real wheel
      // input (lerp 0.1 — matching SnapScroll's base options), so scrolling
      // over the globe feels identical to the rest of the page.
      lenis.scrollTo(lenis.targetScroll + e.data.dy, { lerp: 0.1 });
    }
    window.addEventListener("message", onMessage);
    return () => window.removeEventListener("message", onMessage);
  }, []);

  // Reset scroll on navigation — otherwise the snap engine anchors a newly
  // mounted page to wherever the previous page's scroll offset was.
  useEffect(() => {
    lenisRef.current?.scrollTo(0, { immediate: true, force: true });
    window.scrollTo(0, 0);
  }, [routeLocation.pathname]);

  // Chrome-free one-screen showcase — no navbar, banner, footer or scroll.
  if (routeLocation.pathname === "/deepfield") {
    return (
      <Routes location={routeLocation}>
        <Route path="/deepfield" element={<Deepfield />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
    );
  }

  const onLanding = routeLocation.pathname === "/";

  return (
    <div className="page-flux flex min-h-screen flex-col">
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50 focus:rounded-md focus:bg-ink-950 focus:px-4 focus:py-2 focus:text-paper-50"
      >
        Skip to content
      </a>
      {!onLanding && <Navbar />}
      <PageBackdrop />
      <SnapScroll
        id="main-content"
        className="flex-1"
        lenisRef={lenisRef}
      >
        <AnimatePresence mode="wait">
          <Routes location={routeLocation} key={routeLocation.pathname}>
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
      </SnapScroll>
      {/* The landing paints its own dark-zone footer (see Landing.jsx); the
          global footer serves every other page. */}
      {!onLanding && <Footer />}
      <CursorPet />
    </div>
  );
}
