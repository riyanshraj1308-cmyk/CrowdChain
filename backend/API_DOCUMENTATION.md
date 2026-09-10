# API Documentation

Base URL (local): `http://localhost:4000/api`

All responses follow:

```json
{ "success": true, "data": {}, "message": "..." }
{ "success": false, "message": "...", "error": "..." }
```

Authenticated endpoints require `Authorization: Bearer <jwt>`.

---

## Auth

### `POST /auth/nonce`
Request a signing nonce for a wallet address.

Body: `{ "walletAddress": "0x..." }`
Returns: `{ "walletAddress": "0x...", "message": "Welcome to Milestone Crowdfunding!..." }`

### `POST /auth/verify`
Verify a signature and receive a JWT.

Body: `{ "walletAddress": "0x...", "signature": "0x..." }`
Returns: `{ "token": "...", "user": { "id": "...", "walletAddress": "0x..." } }`

### `GET /auth/me` (auth required)
Returns the authenticated user's profile including reputation.

---

## Campaigns

### `POST /campaigns` (auth required, caller becomes creator)
Indexes a campaign that has already been created on-chain (client calls
`createCampaign` on the contract first, then reports the result here).

Body:
```json
{
  "contractCampaignId": 0,
  "contractAddress": "0x...",
  "chainId": 31337,
  "creationTxHash": "0x...",
  "title": "Clean Water Wells",
  "description": "...",
  "imageUrl": "https://...",
  "goal": "3000000000000000000",
  "deadline": "2026-12-01T00:00:00.000Z",
  "milestones": [
    { "contractMilestoneId": 0, "title": "...", "description": "...", "amount": "1000000000000000000" },
    { "contractMilestoneId": 1, "description": "...", "amount": "2000000000000000000" }
  ]
}
```

### `GET /campaigns`
Query params: `status`, `creator` (wallet address), `page`, `pageSize`.

### `GET /campaigns/:id`
Full campaign detail including milestones and confirmed contributions.

### `PUT /campaigns/:id` (auth required, creator only)
Updates off-chain metadata only (`title`, `description`, `imageUrl`). Financial
fields are never editable via this endpoint.

---

## Contributions

### `POST /campaigns/:id/contribute` (auth required)
Body: `{ "txHash": "0x..." }`

The caller must have already sent ETH via the contract's `contribute()` function.
The backend fetches the receipt, confirms it hit our contract, didn't revert, and
emitted `ContributionReceived` for this campaign and this wallet — only then is it
recorded as confirmed.

### `GET /campaigns/:id/contributors`
Lists confirmed contributors and amounts for a campaign.

### `GET /users/:address/contributions`
Lists all confirmed contributions made by a wallet address across campaigns.

---

## Milestones

### `GET /campaigns/:id/milestones`
### `GET /campaigns/:id/milestones/:milestoneId`

### `POST /campaigns/:id/milestones/:milestoneId/submit` (auth required, creator only)
Body: `{ "description": "...", "proofUrl": "https://...", "txHash": "0x..." }`
Requires a prior `submitMilestone()` contract call; verifies `MilestoneSubmitted`.

### `POST /campaigns/:id/milestones/:milestoneId/vote` (auth required, confirmed contributor only)
Body: `{ "support": true, "txHash": "0x..." }`
Requires a prior `voteOnMilestone()` contract call; verifies `VoteCast`.

### `POST /campaigns/:id/milestones/:milestoneId/release` (auth required)
Body: `{ "txHash": "0x..." }`
Requires a prior `releaseMilestone()` contract call; verifies `FundsReleased`. The
smart contract is what actually authorizes and moves funds — this endpoint only
mirrors a confirmed outcome into MongoDB.

---

## Reputation

### `GET /users/:address/reputation`
Returns the creator's current reputation score and its components
(`successfulCampaigns`, `milestoneCompletionPct`, `totalContributors`,
`rejectedMilestones`, `score`). Recomputed automatically after each campaign
completion or milestone rejection — never settable by the creator.

---

## Health

### `GET /health`
Basic liveness check, unauthenticated, outside the `/api` prefix.

---

## Error codes

| Status | Meaning |
|---|---|
| 400 | Bad request / on-chain verification failed |
| 401 | Missing/invalid/expired token, invalid signature |
| 403 | Authenticated but not authorized (wrong creator/contributor) |
| 404 | Resource not found |
| 409 | Conflict (duplicate tx hash, already-indexed campaign, already voted) |
| 422 | Request body/query/params failed Zod validation |
| 429 | Rate limit exceeded |
| 500 | Unexpected server error |
