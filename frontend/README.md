# Groundwork — Frontend

A production-quality frontend for a milestone-based, decentralized crowdfunding
platform. Built with React, Vite, Tailwind CSS, and Framer Motion, designed to
pair with the companion Node/Express/Solidity backend.

See [`DESIGN_SYSTEM.md`](./DESIGN_SYSTEM.md) for the full design system
(colors, typography, spacing, motion, component rules) established before
implementation, per the project brief.

## Pages

| Route | Page |
|---|---|
| `/` | Landing — hero, featured campaigns, how it works, milestone voting explainer, benefits, stats, testimonials, FAQ, final CTA |
| `/explore` | Explore campaigns — search, category filter, sort |
| `/campaigns/:id` | Campaign details — story, milestone timeline + live voting, contributors, contribute widget |
| `/create` | Create campaign — 4-step progressive form (basics → funding → milestones → review) |
| `/dashboard` | Creator + contributor dashboard — my campaigns, my contributions, votes needed, transaction history |
| `/profile` | Profile — reputation score and breakdown, campaigns launched (supports `?address=0x...` to view others) |
| `/voting` | Platform-wide milestone voting hub |
| `/about` | How it works, security model, FAQ |

## Tech

- **React 18 + Vite** — fast dev server, no framework lock-in
- **Tailwind CSS** — design tokens defined in `tailwind.config.js`
- **Framer Motion** — page transitions, scroll reveals, hover/tap micro-interactions
- **react-router-dom** — client-side routing
- **ethers v6** — wallet connection + message signing
- **lucide-react** — icon set

## Setup

```bash
npm install
cp .env.example .env
# point VITE_API_BASE_URL at your running backend, default http://localhost:4000/api
npm run dev
```

Open `http://localhost:5173`.

## Working without a live backend

Every read call in `src/lib/api.js` gracefully falls back to realistic demo
data (`src/lib/mockData.js`) if the backend is unreachable, so the entire UI —
landing stats, campaign browsing, dashboards, profiles — is fully explorable
standalone. Write actions (contribute, vote, create campaign, submit/release
milestone) are wired to call the wallet + backend in the real flow; in this
preview build they're simulated with a short delay and a success toast so the
interaction and motion design can be reviewed without a deployed contract.

To wire up the real transaction flow end-to-end against the companion
backend's local Hardhat deployment:
1. Run the backend per its own README (`hardhat node` → deploy → `npm run dev`).
2. Set `VITE_API_BASE_URL=http://localhost:4000/api` in `.env`.
3. Replace the simulated `await new Promise(...)` blocks in
   `ContributeWidget.jsx`, `MilestoneVoteCard.jsx`, and `CreateCampaign.jsx`
   with the corresponding calls in `src/lib/wallet.js` (`sendContribution`,
   etc.), each followed by the matching `api.*` verification call.

## Accessibility

- All interactive elements have a visible `:focus-visible` ring (see
  `index.css`) — never removed.
- Icon-only buttons carry `aria-label`.
- Color is never the sole signal — status badges pair color with text, vote
  bars pair color with percentage labels.
- `prefers-reduced-motion` is respected globally.
- Minimum 44px touch targets on all buttons and nav controls.
- Modals trap focus, close on `Escape`, and return focus on close.

## Dependency security

`vite` is pinned to `^8.2.2` and `react-router-dom` to `^7.18.3` to resolve the
moderate/high advisories `npm audit` flags on the earlier `vite@5` /
`react-router-dom@6` combination (a dev-server request-forgery issue in
esbuild, and an open-redirect / constructor-injection issue in React Router).
The app only uses React Router's stable declarative APIs (`BrowserRouter`,
`Routes`, `Route`, `Link`, `NavLink`, `useNavigate`, `useLocation`,
`useParams`, `useSearchParams`) — no data routers, loaders, or `Outlet` — so
the v6 → v7 jump needed no code changes.

After `npm install`, if `@vitejs/plugin-react` reports a peer-dependency
mismatch against your resolved Vite version, run
`npm install @vitejs/plugin-react@latest` — npm will pick the correct minor
version for whatever Vite 8.x patch is current at install time.

## Build

```bash
npm run build
npm run preview
```
