import { useEffect, useState } from "react";
import { Link, NavLink, useNavigate } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import { Menu, X, Wallet, ChevronDown, LayoutDashboard, User, LogOut, Sprout } from "lucide-react";
import Button from "../ui/Button";
import Avatar from "../ui/Avatar";
import { useAuth } from "../../context/AuthContext";
import { shortAddress } from "../../lib/format";

const NAV_LINKS = [
  { to: "/explore", label: "Explore" },
  { to: "/voting", label: "Vote on Milestones" },
  { to: "/create", label: "Start a Campaign" },
  { to: "/about", label: "How It Works" },
];

export default function Navbar() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const { isConnected, address, user, connect, disconnect, status } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    setMobileOpen(false);
  }, [navigate]);

  return (
    <header className="sticky top-0 z-40 border-b border-ink-950/8 bg-paper-50/90 backdrop-blur-md">
      <div className="container-page flex h-18 items-center justify-between">
        <Link to="/" className="flex items-center gap-2 font-display text-xl text-ink-950">
          <span className="flex h-8 w-8 items-center justify-center rounded-md bg-ink-950 text-paper-50">
            <Sprout className="h-4 w-4" aria-hidden="true" />
          </span>
          Groundwork
        </Link>

        <nav className="hidden items-center gap-8 md:flex" aria-label="Primary">
          {NAV_LINKS.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              className={({ isActive }) =>
                `relative py-2 text-sm font-medium transition-colors ${
                  isActive ? "text-ink-950" : "text-ink-600 hover:text-ink-950"
                }`
              }
            >
              {({ isActive }) => (
                <>
                  {link.label}
                  {isActive && (
                    <motion.span
                      layoutId="nav-underline"
                      className="absolute inset-x-0 -bottom-0.5 h-0.5 rounded-full bg-copper-500"
                      transition={{ type: "spring", stiffness: 400, damping: 32 }}
                    />
                  )}
                </>
              )}
            </NavLink>
          ))}
        </nav>

        <div className="hidden items-center gap-3 md:flex">
          {isConnected ? (
            <div className="relative">
              <button
                onClick={() => setMenuOpen((o) => !o)}
                className="flex h-11 items-center gap-2 rounded-md border border-ink-950/15 pl-2 pr-3 hover:bg-ink-950/5"
                aria-haspopup="menu"
                aria-expanded={menuOpen}
              >
                <Avatar address={address} name={user?.displayName} size={28} />
                <span className="font-mono text-sm text-ink-800">
                  {user?.displayName || shortAddress(address)}
                </span>
                <ChevronDown className="h-3.5 w-3.5 text-ink-500" aria-hidden="true" />
              </button>
              <AnimatePresence>
                {menuOpen && (
                  <>
                    <div className="fixed inset-0 z-10" onClick={() => setMenuOpen(false)} />
                    <motion.div
                      role="menu"
                      initial={{ opacity: 0, y: -6 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -4, transition: { duration: 0.12 } }}
                      transition={{ duration: 0.16 }}
                      className="absolute right-0 z-20 mt-2 w-52 overflow-hidden rounded-md border border-ink-950/10 bg-paper-50 py-1.5 shadow-lifted"
                    >
                      <MenuItem to="/dashboard" icon={LayoutDashboard} onClick={() => setMenuOpen(false)}>
                        Dashboard
                      </MenuItem>
                      <MenuItem to="/profile" icon={User} onClick={() => setMenuOpen(false)}>
                        Profile
                      </MenuItem>
                      <button
                        role="menuitem"
                        onClick={() => {
                          disconnect();
                          setMenuOpen(false);
                        }}
                        className="flex w-full items-center gap-2.5 px-3.5 py-2.5 text-left text-sm text-rust-500 hover:bg-rust-50"
                      >
                        <LogOut className="h-4 w-4" aria-hidden="true" />
                        Disconnect
                      </button>
                    </motion.div>
                  </>
                )}
              </AnimatePresence>
            </div>
          ) : (
            <Button
              variant="primary"
              icon={Wallet}
              loading={status === "connecting" || status === "signing"}
              onClick={connect}
            >
              {status === "signing" ? "Confirm in wallet…" : "Connect Wallet"}
            </Button>
          )}
        </div>

        <button
          className="flex h-11 w-11 items-center justify-center rounded-md text-ink-900 md:hidden"
          onClick={() => setMobileOpen(true)}
          aria-label="Open menu"
        >
          <Menu className="h-6 w-6" />
        </button>
      </div>

      <MobileMenu open={mobileOpen} onClose={() => setMobileOpen(false)} />
    </header>
  );
}

function MenuItem({ to, icon: Icon, children, onClick }) {
  return (
    <Link
      to={to}
      role="menuitem"
      onClick={onClick}
      className="flex items-center gap-2.5 px-3.5 py-2.5 text-sm text-ink-800 hover:bg-ink-950/5"
    >
      <Icon className="h-4 w-4 text-ink-500" aria-hidden="true" />
      {children}
    </Link>
  );
}

function MobileMenu({ open, onClose }) {
  const { isConnected, address, connect, disconnect, status } = useAuth();

  useEffect(() => {
    if (!open) return;
    function handleKey(e) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("keydown", handleKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", handleKey);
      document.body.style.overflow = "";
    };
  }, [open, onClose]);

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            className="fixed inset-0 z-40 bg-ink-950/50 md:hidden"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />
          <motion.div
            className="fixed inset-y-0 right-0 z-50 flex w-[82%] max-w-xs flex-col gap-1 bg-paper-50 p-6 shadow-lifted md:hidden"
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ duration: 0.28, ease: [0.16, 1, 0.3, 1] }}
            role="dialog"
            aria-modal="true"
            aria-label="Menu"
          >
            <div className="mb-4 flex items-center justify-between">
              <span className="font-display text-lg text-ink-950">Menu</span>
              <button
                onClick={onClose}
                aria-label="Close menu"
                className="flex h-10 w-10 items-center justify-center rounded-md hover:bg-ink-950/5"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            {NAV_LINKS.map((link) => (
              <NavLink
                key={link.to}
                to={link.to}
                className="rounded-md px-3 py-3 text-base font-medium text-ink-900 hover:bg-ink-950/5"
              >
                {link.label}
              </NavLink>
            ))}
            {isConnected ? (
              <>
                <NavLink to="/dashboard" className="rounded-md px-3 py-3 text-base font-medium text-ink-900 hover:bg-ink-950/5">
                  Dashboard
                </NavLink>
                <NavLink to="/profile" className="rounded-md px-3 py-3 text-base font-medium text-ink-900 hover:bg-ink-950/5">
                  Profile
                </NavLink>
                <button
                  onClick={disconnect}
                  className="mt-2 flex items-center gap-2 rounded-md border border-ink-950/15 px-3 py-3 text-left text-base font-medium text-rust-500"
                >
                  <LogOut className="h-4 w-4" /> Disconnect {shortAddress(address)}
                </button>
              </>
            ) : (
              <Button className="mt-4 w-full" icon={Wallet} loading={status === "connecting" || status === "signing"} onClick={connect}>
                Connect Wallet
              </Button>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
