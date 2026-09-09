import { createContext, useCallback, useContext, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { CheckCircle2, XCircle, Info, X } from "lucide-react";

const ToastContext = createContext(null);

let idCounter = 0;

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const dismiss = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const push = useCallback(
    (message, { type = "info", duration = 5000 } = {}) => {
      const id = ++idCounter;
      setToasts((prev) => [...prev, { id, message, type }]);
      if (duration) setTimeout(() => dismiss(id), duration);
      return id;
    },
    [dismiss]
  );

  const toast = useCallback(
    (message, opts) => push(message, opts),
    [push]
  );
  toast.success = (message, opts) => push(message, { ...opts, type: "success" });
  toast.error = (message, opts) => push(message, { ...opts, type: "error" });
  toast.info = (message, opts) => push(message, { ...opts, type: "info" });

  return (
    <ToastContext.Provider value={toast}>
      {children}
      <div
        className="fixed bottom-5 right-5 z-[100] flex w-[calc(100%-2.5rem)] max-w-sm flex-col gap-2"
        role="region"
        aria-label="Notifications"
      >
        <AnimatePresence>
          {toasts.map((t) => (
            <motion.div
              key={t.id}
              role="status"
              initial={{ opacity: 0, y: 12, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 8, scale: 0.98, transition: { duration: 0.12 } }}
              transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
              className="flex items-start gap-3 rounded-md border border-ink-950/10 bg-ink-950 px-4 py-3 text-paper-50 shadow-lifted"
            >
              <IconFor type={t.type} />
              <p className="flex-1 text-sm leading-snug">{t.message}</p>
              <button
                onClick={() => dismiss(t.id)}
                aria-label="Dismiss notification"
                className="shrink-0 rounded p-0.5 text-paper-200/70 hover:text-paper-50"
              >
                <X className="h-4 w-4" />
              </button>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  );
}

function IconFor({ type }) {
  if (type === "success") return <CheckCircle2 className="h-5 w-5 shrink-0 text-moss-400" aria-hidden="true" />;
  if (type === "error") return <XCircle className="h-5 w-5 shrink-0 text-rust-400" aria-hidden="true" />;
  return <Info className="h-5 w-5 shrink-0 text-copper-300" aria-hidden="true" />;
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used within ToastProvider");
  return ctx;
}
