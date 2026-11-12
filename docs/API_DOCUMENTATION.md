# VELoop Rewards — API Documentation

Base URL (local): `http://localhost:5000/api`

All protected endpoints require:
```http
Authorization: Bearer <JWT_TOKEN>
```

---

## Authentication Endpoints

### `POST /api/auth/register`
Creates a new user account, initializes a MongoDB `Wallet`, and returns a JWT token.

**Request Body:**
```json
{
  "name": "Aarav Mehta",
  "email": "aarav@example.com",
  "password": "StrongPassword123"
}
```

**Response (`201 Created`):**
```json
{
  "success": true,
  "message": "Account created successfully.",
  "serverTime": "2026-11-11T12:00:00.000Z",
  "token": "<jwt>",
  "user": {
    "id": "65f0...",
    "name": "Aarav Mehta",
    "email": "aarav@example.com",
    "role": "USER"
  },
  "wallet": {
    "veBalance": 0,
    "giftCardBalanceInr": 0,
    "totalVEsEarned": 0,
    "totalGiftCardsEarnedInr": 0,
    "giftCardVouchers": []
  }
}
```

### `POST /api/auth/login`
Authenticates user credentials and returns a JWT.

### `GET /api/auth/me` *(Protected)*
Returns authenticated user profile, wallet summary, and streak summary.

### `PATCH /api/auth/profile` *(Protected)*
Updates the authenticated user's display `name` (rejects protected fields such as `role`, `email`, `veBalance`, `streak`).

### `POST /api/auth/change-password` *(Protected)*
Verifies `currentPassword` and updates the user's password hash (`bcryptjs`).

---

## Daily Streak Endpoints

### `GET /api/daily-streak` *(Protected)*
Computes and returns the full authoritative Daily Streak state from MongoDB (including missed-day detection/reset, cycle completion rollover, server timestamps, backend-configured reward cards, ultimate reward card, and wallet balance).

> Note: Query parameters such as `?day=7` or `?userId=...` are ignored or rejected (`403` for cross-user attempts).

**Response (`200 OK`):**
```json
{
  "success": true,
  "serverTime": "2026-11-11T12:00:00.000Z",
  "config": {
    "cycleTitle": "7-Day VELoop Streak",
    "totalDays": 7,
    "claimCooldownMinutes": 1440,
    "claimWindowMinutes": 1440,
    "cpaDemoEnabled": true,
    "cpaDemoDurationMs": 2200
  },
  "streak": {
    "cycleId": "CYC-001-ABCD",
    "cycleNumber": 1,
    "currentStreak": 1,
    "currentDay": 2,
    "checkedIn": 1,
    "totalRewards": 7,
    "status": "AVAILABLE",
    "canClaim": true,
    "lastClaimAt": "2026-11-10T11:00:00.000Z",
    "nextClaimAt": "2026-11-11T11:00:00.000Z",
    "expiresAt": "2026-11-12T11:00:00.000Z",
    "nextReward": {
      "day": 2,
      "amount": 10,
      "currency": "VES",
      "rewardType": "VES",
      "title": "Daily Reward",
      "subtitle": "10 VEs",
      "displayAmount": "+10"
    },
    "statusMessage": "Day 2 reward is ready to claim now!"
  },
  "ultimateReward": {
    "day": 7,
    "title": "Ultimate Reward",
    "subtitle": "Amazon Gift Card",
    "displayAmount": "₹5",
    "amount": 5,
    "currency": "INR",
    "rewardType": "GIFT_CARD",
    "assetType": "crown",
    "status": "LOCKED",
    "unlockText": "Unlock on Day 7"
  },
  "rewards": [
    {
      "rewardId": "...",
      "day": 1,
      "status": "CLAIMED",
      "isToday": false,
      "isUltimate": false,
      "badge": null,
      "assetType": "coin",
      "title": "Daily Reward",
      "subtitle": "5 VEs",
      "displayAmount": "+5",
      "nextClaimAt": null,
      "claimedAt": "2026-11-10T11:00:00.000Z",
      "referenceId": "STREAK-1A2B3C4D",
      "reward": { "type": "VES", "currency": "VES", "amount": 5 }
    }
  ],
  "wallet": {
    "veBalance": 120,
    "giftCardBalanceInr": 0,
    "totalVEsEarned": 120,
    "totalGiftCardsEarnedInr": 0,
    "giftCardVouchers": []
  },
  "streakResetInfo": { "wasReset": false }
}
```

### `GET /api/daily-streak/status` *(Protected)*
Lightweight endpoint called when the frontend visual countdown reaches `00:00:00`.

### `POST /api/daily-streak/claim/initiate` *(Protected)*
Pre-flight validation endpoint called before showing the CPA Advertisement Demo modal. Validates auth, cycle state, previous day, and server timer without crediting any reward.

### `POST /api/daily-streak/claim` *(Protected)*
Executes the authoritative, idempotent, concurrency-safe reward claim.

**Headers (optional but recommended):**
```http
Idempotency-Key: claim-day2-550e8400-e29b-41d4-a716-446655440000
```

**Minimal Request Body:**
```json
{
  "day": 2
}
```
*(Or `{}` — the backend derives the eligible day exclusively from `StreakCycle.nextClaimDay`.)*

**Forbidden Client Fields (automatically rejected & logged to `AuditLog`):**
- `userId`, `user`, `ownerId`, `accountId` -> `403 FORBIDDEN_OWNERSHIP`
- `reward`, `amount`, `currency`, `rewardType`, `streak`, `currentStreak`, `status` -> `400 TAMPERED_CLAIM_PAYLOAD`

**Error Responses:**
- `400 DAY_SKIP_FORBIDDEN` — Requesting Day 7 when eligible day is Day 2
- `409 ALREADY_CLAIMED` — Day already claimed
- `409 STREAK_LOCKED` — 24h server cooldown not finished yet
- `409 STREAK_RESET` — Missed-day window elapsed; cycle reset to Day 1
- `409 CONCURRENT_CLAIM` — Simultaneous claim in progress

### `GET /api/daily-streak/history` *(Protected)*
Returns paginated `StreakClaim` records and `StreakCycle` history (`?page=1&limit=20`).

---

## Wallet & Audit Endpoints

### `GET /api/wallet` *(Protected)*
Returns backend wallet balances (`veBalance`, `giftCardBalanceInr`), earned Amazon Gift Card vouchers, and paginated `WalletTransaction` ledger entries.

### `GET /api/wallet/transactions` *(Protected)*
Returns paginated `WalletTransaction` ledger entries.

### `GET /api/audit-logs` *(Protected)*
Returns recent `AuditLog` records for the authenticated user (`?limit=25`).

