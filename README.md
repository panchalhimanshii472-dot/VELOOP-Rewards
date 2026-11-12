# VELoop Rewards — Daily Streak & Rewards System

A secure, backend-authoritative **MERN Stack** (MongoDB, Express.js, React.js, Node.js) implementation of the **VELoop Rewards — Daily Streak System** featuring Bootstrap 5 + CSS Modules, JWT authentication, atomic reward claiming, server-controlled 24-hour countdowns, missed-day streak resets, a CPA Advertisement Demo state, wallet ledger integration, and audit logging.

---

## 1. Project Overview

VELoop Rewards enables authenticated users to check in daily over a 7-day reward cycle and earn progressive rewards:

| Day | Reward | Type | Currency |
| :--- | :--- | :--- | :--- |
| Day 1 | +5 VEs | `VES` | `VES` |
| Day 2 | +10 VEs | `VES` | `VES` |
| Day 3 | +15 VEs | `VES` | `VES` |
| Day 4 | ₹1 Amazon Gift Card | `GIFT_CARD` | `INR` |
| Day 5 | ₹2 Amazon Gift Card | `GIFT_CARD` | `INR` |
| Day 6 | +30 VEs | `VES` | `VES` |
| Day 7 | ₹5 Amazon Gift Card (Ultimate Reward) | `GIFT_CARD` | `INR` |

**Core Security Principle:** React controls only visual presentation, animations, and user interactions. All business decisions—current streak, active day, reward values, eligibility, 24-hour cooldown timestamps, missed-day resets, wallet balances, and transaction ledgers—are computed and enforced by the Node/Express backend and MongoDB.

---

## 2. MERN Architecture

```text
Authenticated User (React + Bootstrap + CSS Modules)
  └── Centralized Axios Service (src/services/streakApi.js)
        │  JWT Bearer Token
        ▼
Express.js REST API (Helmet, CORS, Rate Limiting, JWT Middleware)
  └── Validators (Anti-Tampering Payload Inspection)
        ▼
Service Layer (streak.service, reward.service, wallet.service, transaction.service, audit.service)
        ▼
MongoDB + Mongoose (Atomic Locks, Unique Indexes, Optional ACID Transactions)
```

### Repository Layout

```text
├── backend/
│   ├── seed/seedData.js
│   ├── src/
│   │   ├── config/          # env.js, db.js
│   │   ├── controllers/     # auth, streak, wallet controllers
│   │   ├── middleware/      # JWT auth, rate limiters, error sanitizer
│   │   ├── models/          # 8 Mongoose schemas
│   │   ├── routes/          # REST endpoints
│   │   ├── scripts/         # simulateMissedStreak.js (dev test helper)
│   │   ├── services/        # Business logic layer
│   │   ├── utils/           # AppError, ID generators, transaction helper
│   │   └── validators/      # Strict anti-cheat payload guards
│   ├── tests/
│   │   ├── streak.unit.test.js
│   │   └── security.e2e.js
│   ├── .env.example
│   └── package.json
├── frontend/
│   ├── src/
│   │   ├── assets/          # VELoop artwork & drop-in asset mapper
│   │   ├── components/DailyStreak/
│   │   ├── context/         # AuthContext
│   │   ├── hooks/           # useServerCountdown (monotonic timer)
│   │   ├── pages/           # Auth, DailyStreak, History, Wallet, Profile
│   │   ├── services/        # apiClient, authApi, streakApi
│   │   └── styles/tokens.css
│   ├── .env.example
│   └── package.json
├── docs/
│   ├── API_DOCUMENTATION.md
│   ├── DATABASE.md
│   ├── SECURITY.md
│   └── TESTING.md
└── postman/
    └── veloop-daily-streak.postman_collection.json
```

---

## 3. Installation & Environment Setup

### Prerequisites
- **Node.js** >= 18.x and **npm**
- **MongoDB** (local `mongod` or MongoDB Atlas connection string)

### Step 1 — Configure Backend
```bash
cd backend
npm install
cp .env.example .env
```
Edit `backend/.env` with your `MONGO_URI` and a strong `JWT_SECRET`.

Seed the default 7-day configuration, reward schedule, and development demo accounts:
```bash
npm run seed
```

Start the backend server:
```bash
npm run dev
```

### Step 2 — Configure Frontend
```bash
cd frontend
npm install
cp .env.example .env
```
Verify `VITE_API_URL=http://localhost:5000/api` in `frontend/.env`, then launch the Vite dev server:
```bash
npm run dev
```

### Seeded Demo Credentials (Development Only)
Password for all seeded demo accounts: `VeloopDemo@2026`
- `demo@velooprewards.in` — Day 1 claimed 25h ago, Day 2 ready to claim, `120` VEs wallet balance
- `fresh@velooprewards.in` — New user on Day 1, `0` VEs
- `missed@velooprewards.in` — Missed Day 3 window (> 52h elapsed), demonstrates automatic reset to Day 1 on load

---

## 4. Database Schema Summary

Detailed schema documentation is available in [`docs/DATABASE.md`](docs/DATABASE.md).
- `User`: Authenticated user credentials (`passwordHash` excluded by default).
- `Wallet`: Server-owned `veBalance`, `giftCardBalanceInr`, and `giftCardVouchers`.
- `StreakConfig`: Configurable cycle length (`totalDays`), cooldown (`claimCooldownMinutes`), expiry window (`claimWindowMinutes`), and CPA demo timings.
- `StreakReward`: Backend-driven 7-day reward items (`day`, `rewardType`, `currency`, `amount`, `badge`, `assetType`, `isUltimate`).
- `StreakCycle`: Tracks each 7-day cycle (`ACTIVE`, `COMPLETED`, `RESET`), `currentStreak`, `nextClaimDay`, `nextClaimAt`, `expiresAt`, and `claimLock`. Partial unique index guarantees at most one `ACTIVE` cycle per user.
- `StreakClaim`: Immutable claim records with unique compound index `(userId, cycleId, day)` and sparse unique `(userId, idempotencyKey)`.
- `WalletTransaction`: Auditable ledger entries (`DAILY_STREAK`, `STREAK-XXXXXXXX`, `balanceBefore`, `balanceAfter`).
- `AuditLog`: Security and lifecycle events (`STREAK_CLAIM_REQUEST`, `STREAK_CLAIM_SUCCESS`, `STREAK_CLAIM_REJECTED`, `STREAK_RESET`, `DUPLICATE_CLAIM`, `INVALID_CLAIM`, `CONCURRENT_CLAIM_BLOCKED`, `CROSS_USER_ATTEMPT`).

---

## 5. Streak Logic, Timer Architecture & Reset Rules

- **Streak Cycle Architecture:** Each 7-day sequence is tracked as a `StreakCycle`. When Day 7 is claimed and the final cooldown elapses, the cycle automatically transitions to `COMPLETED` and Cycle `N+1` starts at Day 1.
- **Timer Architecture:** Cooldown and grace intervals are stored in `StreakConfig` in MongoDB (`claimCooldownMinutes = 1440`, `claimWindowMinutes = 1440`). After a claim at `serverNow`, the backend persists `nextClaimAt = serverNow + cooldown` and `expiresAt = nextClaimAt + window`. The frontend calculates visual countdowns using `serverTime` + monotonic `performance.now()` deltas, preventing system-clock tampering. When the visual timer reaches zero, React queries `GET /api/daily-streak/status` before enabling any UI change.
- **Missed-Day Detection & Reset Logic:** Whenever `serverNow > activeCycle.expiresAt` before the next day is claimed, the backend marks the cycle `RESET`, logs `STREAK_RESET` in `AuditLog`, and initializes a fresh `ACTIVE` cycle at Day 1 (`currentStreak = 0`). Closing the browser does not reset the streak.

---

## 6. Claim Flow & Security Architecture

See [`docs/SECURITY.md`](docs/SECURITY.md) for full threat-model coverage.
1. User clicks **Claim Now** -> frontend disables the button immediately.
2. Frontend calls `POST /api/daily-streak/claim/initiate` (validates eligibility without granting anything).
3. Frontend displays the VELoop-themed **CPA Advertisement Demo** verification overlay (`Preparing your reward...`).
4. Frontend sends `POST /api/daily-streak/claim` with an `Idempotency-Key`.
5. Backend re-validates JWT identity, rejects tampered fields (`reward`, `currency`, `streak`, `userId`), verifies sequential day + previous-day completion + server timer, acquires an atomic cycle lock (`claimLock: false -> true`), runs inside a MongoDB transaction (on replica sets) / atomic guarded writes with unique indexes, credits `Wallet`, records `WalletTransaction` + `StreakClaim` + `AuditLog`, and returns authoritative state.
6. Frontend calls `GET /api/daily-streak` to re-render entirely from backend state.

---

## 7. API Endpoints

Full request/response contracts are documented in [`docs/API_DOCUMENTATION.md`](docs/API_DOCUMENTATION.md) and bundled in [`postman/veloop-daily-streak.postman_collection.json`](postman/veloop-daily-streak.postman_collection.json).

- `GET /api/health`
- `POST /api/auth/register`
- `POST /api/auth/login`
- `GET /api/auth/me`
- `PATCH /api/auth/profile`
- `POST /api/auth/change-password`
- `GET /api/daily-streak`
- `GET /api/daily-streak/status`
- `POST /api/daily-streak/claim/initiate`
- `POST /api/daily-streak/claim`
- `GET /api/daily-streak/history`
- `GET /api/wallet`
- `GET /api/wallet/transactions`
- `GET /api/audit-logs`

---

## 8. Testing

See [`docs/TESTING.md`](docs/TESTING.md) for all verification steps:
```bash
cd backend
npm test              # Unit tests for tamper validation & timestamp calculations
npm run test:security # Live E2E anti-cheat, concurrency, and missed-streak verification
```

---

## 9. Deployment Guide

- **Database:** Provision a MongoDB Atlas cluster (M0+ supports replica-set multi-document transactions automatically).
- **Backend (Render / Railway):** Deploy `backend/` with `PORT`, `MONGO_URI`, `JWT_SECRET`, and `CORS_ORIGIN` set to your live frontend URL. Run `npm run seed` once against the dev/staging database.
- **Frontend (Vercel / Netlify):** Deploy `frontend/` with `VITE_API_URL` pointing to `https://<your-backend-domain>/api` and SPA fallback rewrites to `index.html`.

---

## 10. Known Limitations & Design Notes

- **CPA Integration:** Uses the requested VELoop CPA Advertisement Demo placeholder (`CpaDemoModal`); real ad-network SDKs and server-to-server postbacks should replace the demo step when integrating production ad providers.
- **Visual Assets Fallback:** Includes bespoke theme-matched SVG/animated VELoop illustrations in `frontend/src/assets/RewardArtwork.jsx`. Official raster PNGs from the assignment Drive folder can be dropped into `frontend/public/assets/supplied/` and mapped in `frontend/src/assets/rewardAssets.jsx`.
- **Single-Node MongoDB Fallback:** Multi-document ACID transactions execute on MongoDB Atlas / replica sets; on local standalone MongoDB instances without `--replSet`, the backend automatically uses atomic document locking (`claimLock`) and unique database constraints.

