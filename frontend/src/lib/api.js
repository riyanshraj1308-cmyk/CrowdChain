import {
  MOCK_CAMPAIGNS,
  MOCK_CONTRIBUTIONS,
  MOCK_TRANSACTIONS,
  MOCK_USERS,
  PLATFORM_STATS,
} from "./mockData";

const API_BASE = import.meta.env.VITE_API_BASE_URL || "http://localhost:4000/api";

// The backend may not be running in every environment this frontend is
// previewed in (e.g. a static design review). Every read falls back to
// realistic demo data so the UI is always fully explorable; every write
// clearly reports that it requires a live backend + wallet connection.
const USE_MOCKS_ON_FAILURE = true;

class ApiClient {
  constructor() {
    this.token = localStorage.getItem("gw_token") || null;
    // Whether reads are hitting the live API ("live"), serving fallback demo
    // data because the API is unreachable ("demo"), or haven't been tried yet
    // ("unknown"). Kept on the client so the UI can surface the data source
    // instead of silently mixing mocks and live data.
    this.dataMode = "unknown";
    this.modeError = null;
    this._modeListeners = new Set();
  }

  get baseUrl() {
    return API_BASE;
  }

  onModeChange(listener) {
    this._modeListeners.add(listener);
    return () => this._modeListeners.delete(listener);
  }

  setMode(mode, error = null) {
    if (this.dataMode === mode) return;
    this.dataMode = mode;
    this.modeError = error;
    this._modeListeners.forEach((listener) => listener(mode, error));
  }

  // Pings the backend's /health endpoint directly (no mock fallback) so the UI
  // can verify connectivity and flip data mode without issuing a data call.
  async probe() {
    try {
      const root = API_BASE.replace(/\/api\/?$/, "");
      const res = await fetch(`${root}/health`, { method: "GET" });
      if (!res.ok) throw new Error(`Backend responded with HTTP ${res.status}`);
      this.setMode("live");
      return true;
    } catch (err) {
      this.setMode("demo", err);
      return false;
    }
  }

  setToken(token) {
    this.token = token;
    if (token) localStorage.setItem("gw_token", token);
    else localStorage.removeItem("gw_token");
  }

  async request(path, { method = "GET", body, auth = false } = {}) {
    const headers = { "Content-Type": "application/json" };
    if (auth && this.token) headers.Authorization = `Bearer ${this.token}`;

    const res = await fetch(`${API_BASE}${path}`, {
      method,
      headers,
      body: body ? JSON.stringify(body) : undefined,
    });

    const json = await res.json().catch(() => ({}));
    if (!res.ok || json.success === false) {
      throw new ApiError(json.message || `Request failed (${res.status})`, res.status);
    }
    this.setMode("live");
    return json.data;
  }

  // ---- Auth ----
  requestNonce(walletAddress) {
    return this.request("/auth/nonce", { method: "POST", body: { walletAddress } });
  }

  verifySignature(walletAddress, signature) {
    return this.request("/auth/verify", { method: "POST", body: { walletAddress, signature } });
  }

  getMe() {
    return this.request("/auth/me", { auth: true });
  }

  // ---- Campaigns ----
  async listCampaigns(params = {}) {
    try {
      const query = new URLSearchParams(params).toString();
      return await this.request(`/campaigns${query ? `?${query}` : ""}`);
    } catch (err) {
      if (!USE_MOCKS_ON_FAILURE) throw err;
      this.setMode("demo", err);
      return mockList(params);
    }
  }

  async getCampaign(id) {
    try {
      return await this.request(`/campaigns/${id}`);
    } catch (err) {
      if (!USE_MOCKS_ON_FAILURE) throw err;
      const found = MOCK_CAMPAIGNS.find((c) => c.id === id);
      if (!found) throw err;
      this.setMode("demo", err);
      return found;
    }
  }

  createCampaign(payload) {
    return this.request("/campaigns", { method: "POST", body: payload, auth: true });
  }

  updateCampaign(id, payload) {
    return this.request(`/campaigns/${id}`, { method: "PUT", body: payload, auth: true });
  }

  // ---- Contributions ----
  contribute(campaignId, txHash) {
    return this.request(`/campaigns/${campaignId}/contribute`, {
      method: "POST",
      body: { txHash },
      auth: true,
    });
  }

  async listContributors(campaignId) {
    try {
      return await this.request(`/campaigns/${campaignId}/contributors`);
    } catch (err) {
      if (!USE_MOCKS_ON_FAILURE) throw err;
      this.setMode("demo", err);
      return MOCK_CONTRIBUTIONS;
    }
  }

  async listUserContributions(address) {
    try {
      return await this.request(`/users/${address}/contributions`);
    } catch (err) {
      if (!USE_MOCKS_ON_FAILURE) throw err;
      this.setMode("demo", err);
      return MOCK_CONTRIBUTIONS;
    }
  }

  // ---- Milestones ----
  submitMilestone(campaignId, milestoneId, payload) {
    return this.request(`/campaigns/${campaignId}/milestones/${milestoneId}/submit`, {
      method: "POST",
      body: payload,
      auth: true,
    });
  }

  voteOnMilestone(campaignId, milestoneId, support, txHash) {
    return this.request(`/campaigns/${campaignId}/milestones/${milestoneId}/vote`, {
      method: "POST",
      body: { support, txHash },
      auth: true,
    });
  }

  releaseMilestone(campaignId, milestoneId, txHash) {
    return this.request(`/campaigns/${campaignId}/milestones/${milestoneId}/release`, {
      method: "POST",
      body: { txHash },
      auth: true,
    });
  }

  // ---- Reputation ----
  async getReputation(address) {
    try {
      return await this.request(`/users/${address}/reputation`);
    } catch (err) {
      if (!USE_MOCKS_ON_FAILURE) throw err;
      this.setMode("demo", err);
      return MOCK_USERS[address]?.reputation || { score: 0 };
    }
  }

  // ---- Demo-only helpers (no backend equivalent yet, purely for dashboard UI) ----
  async getPlatformStats() {
    return PLATFORM_STATS;
  }

  async listTransactions() {
    return MOCK_TRANSACTIONS;
  }
}

function mockList({ status, creator, page = 1, pageSize = 20 }) {
  let items = MOCK_CAMPAIGNS;
  if (status) items = items.filter((c) => c.status === status);
  if (creator) items = items.filter((c) => c.creator.walletAddress === creator);
  const start = (page - 1) * pageSize;
  return {
    items: items.slice(start, start + pageSize),
    total: items.length,
    page: Number(page),
    pageSize: Number(pageSize),
  };
}

export class ApiError extends Error {
  constructor(message, status) {
    super(message);
    this.status = status;
  }
}

export const api = new ApiClient();
