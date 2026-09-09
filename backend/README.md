# Blockchain Crowdfunding Platform — Backend

A production-style backend for a milestone-based crowdfunding platform. Contributors
send ETH into a Solidity escrow contract; funds are only released to creators in
milestone-sized chunks after contributor voting approves them. PostgreSQL is used
purely as an indexed, queryable mirror of on-chain state plus off-chain metadata
(titles, descriptions, images) — **the blockchain is always the source of truth for
money and critical campaign state.**

## Architecture

```
Frontend
   ↓
Backend REST API  (validates requests, never marks funds released itself)
   ↓
Wallet Transaction (user signs with MetaMask/etc, sent directly from frontend/user)
   ↓
Smart Contract (escrow, voting, fund release, refunds)
   ↓
Blockchain
   ↓
Event                         ┌───────────────────────────────┐
   ↓                          │ Two complementary write paths: │
Backend Indexer  ◄────────────┤ 1) API endpoints independently │
   ↓                          │    verify a tx hash the client │
PostgreSQL                    │    reports, before writing.    │
   ↓                          │ 2) The polling indexer re-scans │
Frontend                      │    all logs as an audit trail  │
                               │    and catches anything missed.│
                               └───────────────────────────────┘
```

Every endpoint that could change financial or milestone state (`contribute`,
`milestone submit/vote/release`) requires the caller to have already sent a real
transaction to the contract and provide its hash. The backend fetches the receipt,
confirms it was mined, sent to the correct contract, didn't revert, and emitted the
expected event — only then does it write to Postgres. **There is no code path where
the backend can mark funds released, a vote counted, or a milestone approved
without a verified on-chain transaction backing it.** No admin key can withdraw
escrowed funds — that capability simply does not exist in the contract.

## Tech Stack

- Node.js + TypeScript + Express.js
- PostgreSQL + Prisma ORM
- Solidity 0.8.24 + Hardhat + ethers.js v6
- JWT (wallet-signature authentication, no passwords, no stored private keys)
- Zod for request validation
- Jest + Supertest (API), Hardhat/Chai (contract)

## Project Structure

```
backend/
├── src/
│   ├── config/            env loading, Prisma client
│   ├── controllers/       thin HTTP handlers
│   ├── routes/             route wiring
│   ├── services/           business logic (DB + on-chain verification)
│   ├── middleware/        auth, validation, rate limiting, error handling
│   ├── validators/        Zod schemas
│   ├── blockchain/
│   │   ├── contracts/     deployment info written by scripts/deploy.ts
│   │   ├── listeners/     polling event indexer
│   │   └── provider.ts    ethers provider/contract factory
│   ├── utils/
│   ├── app.ts
│   └── server.ts
├── contracts/
│   └── Crowdfunding.sol
├── scripts/
│   ├── deploy.ts
│   └── seed-demo.ts        full end-to-end demo flow
├── test/
│   ├── contract/           Hardhat/Chai tests
│   └── api/                Jest/Supertest tests
├── prisma/schema.prisma
├── hardhat.config.ts
├── .env.example
├── API_DOCUMENTATION.md
└── postman_collection.json
```

## Prerequisites

- Node.js 18+
- PostgreSQL 14+ running locally (or a connection string to one)
- npm

## Setup

```bash
npm install
cp .env.example .env
# edit .env: set DATABASE_URL to your Postgres instance, set JWT_SECRET

npx prisma migrate dev --name init
npx prisma generate
```

## Running locally (four terminals)

```bash
# Terminal 1 — local blockchain
npx hardhat node

# Terminal 2 — compile & deploy the contract to it
npx hardhat compile
npx hardhat run scripts/deploy.ts --network localhost
# This writes src/blockchain/contracts/Crowdfunding.latest.json,
# which the backend reads automatically — no manual address copying needed.

# Terminal 3 — backend API
npm run dev

# Terminal 4 — event indexer (keeps Postgres reconciled with chain state)
npm run listener
```

Then, optionally, run the full end-to-end demo (creates a campaign, contributes,
votes, and releases a milestone using two of Hardhat's default test accounts):

```bash
npm run seed:demo
```

The API is now available at `http://localhost:4000/api`. See
[`API_DOCUMENTATION.md`](./API_DOCUMENTATION.md) for the full endpoint reference,
or import [`postman_collection.json`](./postman_collection.json) into Postman.

## Testing

```bash
npm run test:contract   # Hardhat/Chai smart contract tests
npm run test:api        # Jest/Supertest backend tests (mocked Prisma + chain calls)
npm test                # both
```

## Deploying to a testnet (Sepolia)

1. Set `SEPOLIA_RPC_URL` and `DEPLOYER_PRIVATE_KEY` in `.env` (use a throwaway
   testnet-only key — never a real funded key).
2. `npx hardhat run scripts/deploy.ts --network sepolia`
3. Update `.env`: `RPC_URL` to the same Sepolia RPC URL, `CHAIN_ID=11155111`.
4. Restart the backend and indexer.

## Authentication flow

```
Connect Wallet
   ↓
POST /api/auth/nonce        { walletAddress } → { message }   (message embeds a fresh nonce)
   ↓
Sign message client-side with the wallet (e.g. MetaMask personal_sign)
   ↓
POST /api/auth/verify       { walletAddress, signature } → { token }
   ↓
Use `Authorization: Bearer <token>` on subsequent requests
```

The nonce is rotated immediately after a successful verification, so a captured
signature can never be replayed to obtain a second token.

## Dependency security

`npm audit` on a fresh install of this project surfaces two distinct classes
of finding:

**Fixed directly in this repo:**
- Our own `uuid` dependency bumped `^9.0.1` → `^11.1.1` (GHSA-w5hq-g745-h8pq,
  a buffer-bounds check issue in v3/v5/v6 generation — irrelevant to our
  actual usage of `v4()`, but patched regardless).
- `@nomicfoundation/hardhat-toolbox` replaced with the three granular plugins
  it wraps that we actually use — `hardhat-ethers`, `hardhat-chai-matchers`,
  `hardhat-network-helpers` (plus `@typechain/hardhat` directly, since the
  toolbox previously supplied it). The toolbox additionally bundles
  `hardhat-ignition`, `hardhat-verify`, `hardhat-gas-reporter`, and
  `solidity-coverage`, none of which this project calls anywhere. Those
  four plugins are what pull in most of the flagged transitive tree: an
  old `ethers@5` + `@ethersproject/*` chain (`elliptic`, outdated
  `@ethersproject/signing-key`), `web3-utils`/`ethjs-unit` (`bn.js`), and
  `mocha`'s own `diff`/`serialize-javascript` copies, plus `lodash` via
  `@nomicfoundation/ignition-core`. Dropping them removes those advisories
  outright with no change to our compile/test/deploy flow, since we never
  call ignition, verify, gas-reporter, or coverage APIs.
- A `package.json` `overrides` block pins `qs@6.16.0`, `tmp@0.2.7`, `ws@8.21.0`,
  `lodash@4.18.0`, `diff@8.0.3`, and `serialize-javascript@7.0.3` — exactly the
  advisories `npm audit` marks as fixable via plain `npm audit fix` (already
  within Hardhat/Express/mocha's own declared semver ranges; the overrides
  just guarantee resolution without depending on lockfile state).

**Confirmed irreducible without a Hardhat major-version migration:**
After the fixes above, `npm audit` still reports `adm-zip`, `cookie` (via
`@sentry/node`), `undici`, a second internally-nested `uuid`, and an
`elliptic`/`secp256k1`/`ethereum-cryptography`/`ethereumjs-util` chain. I
verified directly against Hardhat's own migration documentation
(hardhat.org/docs/migrate-from-hardhat2) rather than guessing: the first four
are bundled inside **Hardhat 2.x's own core package** (telemetry via Sentry,
compiler-archive handling via adm-zip, network fetch via undici), and the
`elliptic` chain comes from `@nomicfoundation/hardhat-network-helpers`
itself depending on the legacy `ethereumjs-util` — a package we use directly
in the contract test suite (`time.increaseTo`, etc.), so it can't simply be
dropped the way `solidity-coverage`/`hardhat-ignition` could.

The only real fix is Hardhat 3, which Hardhat's own docs describe as **"a
complete rewrite"**: config becomes ESM-only (`"type": "module"` and a
declarative `defineConfig()` with an explicit `plugins: []` array, replacing
side-effect imports), network connections become explicit and asynchronous
(`hre.network` is no longer a single always-on connection — code like our
`ethers.getSigners()` calls in `scripts/deploy.ts` and the test suite would
need to change), Node.js **v22.10.0+** becomes a hard requirement, and the
recommended deployment approach shifts from a procedural `hardhat run
scripts/deploy.ts` script to the declarative Hardhat Ignition system.

That's a real, multi-file rewrite of the entire contracts dev workflow, not
a dependency bump — and I don't have network access in this sandbox to
install Hardhat 3 and actually run `hardhat compile`/`hardhat test` against
the rewritten config to confirm it works, so I'm not going to ship an
unverified rewrite of a currently-working, tested setup. The residual risk
in the meantime is confined to your **local dev/test toolchain** — all of
adm-zip/undici/cookie/@sentry/elliptic are `devDependencies` used only while
compiling contracts or running a local Hardhat node on your own machine;
none reach the deployed Express API in `dist/`.

**If you'd like me to do the Hardhat 3 migration**, say so explicitly and
I'll take it on as its own reviewable change — rewriting `hardhat.config.ts`,
`package.json` (ESM + Node engine bump), `scripts/deploy.ts`, and the
contract test suite together, so you can review and test it as a unit rather
than have it silently bundled into a routine dependency-security pass.

After `npm install`, run `npm audit` again — it should report only the
Hardhat-2-core cluster documented above.

## Security notes

- No private keys or seed phrases ever touch the backend — the frontend/user signs
  transactions and messages with their own wallet.
- Every financial write requires independent verification of a mined transaction
  and its emitted event against our contract address before Postgres is touched.
- Creator-only middleware gates milestone submission and campaign edits;
  contributor-only middleware (backed by a confirmed, on-chain-verified
  contribution) gates voting.
- Helmet, CORS allow-listing, and two-tier rate limiting (general + stricter on
  auth) are enabled by default.
- The smart contract uses Checks-Effects-Interactions and OpenZeppelin's
  `ReentrancyGuard` on both value-transferring functions (`releaseMilestone`,
  `claimRefund`).
- There is no owner/admin address in the contract with the ability to withdraw
  escrowed funds.

## Reputation system

Reputation is recomputed server-side (never client-settable) from indexed on-chain
facts: completed campaigns, milestone completion rate, contributor participation,
and rejected-milestone count. The formula lives in a single pure function,
`computeReputationScore` in `src/services/reputation.service.ts`, so it can be
unit-tested and swapped out independently of the rest of the system.
