import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { api } from "../lib/api";
import { connectWallet, signMessage, subscribeToAccountChange } from "../lib/wallet";
import { MOCK_USERS } from "../lib/mockData";
import { useToast } from "./ToastContext";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const toast = useToast();
  const [address, setAddress] = useState(localStorage.getItem("gw_address") || null);
  const [provider, setProvider] = useState(null);
  const [user, setUser] = useState(null);
  const [status, setStatus] = useState("idle"); // idle | connecting | signing | ready | error
  const [error, setError] = useState(null);

  const disconnect = useCallback(() => {
    api.setToken(null);
    localStorage.removeItem("gw_address");
    setAddress(null);
    setProvider(null);
    setUser(null);
    setStatus("idle");
  }, []);

  const connect = useCallback(async () => {
    setError(null);
    setStatus("connecting");
    try {
      const { provider: p, address: addr } = await connectWallet();
      setProvider(p);

      setStatus("signing");
      const { message } = await api.requestNonce(addr);
      const signature = await signMessage(p, addr, message);
      const { token } = await api.verifySignature(addr, signature);

      api.setToken(token);
      localStorage.setItem("gw_address", addr);
      setAddress(addr);
      setStatus("ready");

      try {
        const me = await api.getMe();
        setUser(me);
      } catch {
        setUser(MOCK_USERS[addr.toLowerCase()] || { walletAddress: addr });
      }
    } catch (err) {
      const message = err?.message || "Failed to connect wallet";
      setError(message);
      setStatus("error");
      toast.error(message);
    }
  }, [toast]);

  useEffect(() => {
    if (!hasInjected()) return;
    const unsubscribe = subscribeToAccountChange((accounts) => {
      if (!accounts.length) disconnect();
    });
    return unsubscribe;
  }, [disconnect]);

  const value = useMemo(
    () => ({
      address,
      user,
      status,
      error,
      isConnected: Boolean(address && status === "ready"),
      connect,
      disconnect,
    }),
    [address, user, status, error, connect, disconnect]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

function hasInjected() {
  return typeof window !== "undefined" && Boolean(window.ethereum);
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
