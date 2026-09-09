import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Wifi, WifiOff, RefreshCw, X } from "lucide-react";
import { api } from "../../lib/api";

// Runs once per page load, so pages that make no data requests (About, 404)
// still reflect whether the backend is reachable.
let probedOnce = false;

function hostOf(baseUrl) {
  try {
    return new URL(baseUrl).host;
  } catch {
    return baseUrl;
  }
}

export default function DataModeBanner() {
  const [mode, setMode] = useState(api.dataMode);
  const [retrying, setRetrying] = useState(false);
  const [liveDismissed, setLiveDismissed] = useState(false);

  useEffect(() => {
    return api.onModeChange((next) => {
      setMode(next);
      // A fresh transition back to live is new information worth surfacing,
      // even if a previous "connected" banner was dismissed.
      if (next === "live") setLiveDismissed(false);
    });
  }, []);

  useEffect(() => {
    if (probedOnce) return;
    probedOnce = true;
    api.probe();
  }, []);

  const retry = async () => {
    setRetrying(true);
    try {
      await api.probe();
    } finally {
      setRetrying(false);
    }
  };

  const showDemo = mode === "demo";
  const showLive = mode === "live" && !liveDismissed;
  if (!showDemo && !showLive) return null;

  return (
    <div className="relative z-30">
      <AnimatePresence initial={false}>
        {showDemo && (
          <motion.div
            key="demo"
            role="status"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
            className="overflow-hidden border-b border-amber-400/30 bg-amber-50"
          >
            <div className="container-page flex flex-wrap items-center gap-x-3 gap-y-2 py-2.5 text-sm">
              <WifiOff className="h-4 w-4 shrink-0 text-amber-500" aria-hidden="true" />
              <p className="flex-1 text-ink-700">
                <strong className="font-semibold text-ink-950">Demo mode</strong>
                <span className="text-ink-600">
                  {" "}— the backend at {hostOf(api.baseUrl)} is unreachable, so reads are
                  falling back to sample data.
                </span>
              </p>
              <button
                onClick={retry}
                disabled={retrying}
                className="inline-flex items-center gap-1.5 rounded-sm border border-amber-400/50 bg-paper-50 px-2.5 py-1 text-xs font-semibold text-amber-500 transition-colors hover:bg-amber-400/15 disabled:opacity-60"
              >
                <RefreshCw
                  className={`h-3 w-3 ${retrying ? "animate-spin" : ""}`}
                  aria-hidden="true"
                />
                {retrying ? "Checking…" : "Retry connection"}
              </button>
            </div>
          </motion.div>
        )}
        {showLive && (
          <motion.div
            key="live"
            role="status"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
            className="overflow-hidden border-b border-moss-400/30 bg-moss-50"
          >
            <div className="container-page flex items-center gap-x-3 py-1.5 text-sm">
              <Wifi className="h-4 w-4 shrink-0 text-moss-600" aria-hidden="true" />
              <p className="flex-1 text-ink-700">
                <strong className="font-semibold text-ink-950">Connected</strong>
                <span className="text-ink-600">
                  {" "}— live data from the backend at {hostOf(api.baseUrl)}.
                </span>
              </p>
              <button
                onClick={() => setLiveDismissed(true)}
                aria-label="Dismiss"
                className="shrink-0 rounded p-1 text-ink-500 hover:bg-moss-400/15 hover:text-ink-900"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
