# VELoop Rewards — Security Architecture & Threat Mitigations

## Core Security Principle
**The frontend is treated as an untrusted client.** All streak progression, reward definitions, eligibility rules, countdown authority, and wallet mutations execute exclusively on the Express/Node.js backend against MongoDB.

---

## Threat Matrix & Implemented Controls

| Threat Vector | Mitigation Implemented | Code Location |
| :--- | :--- | :--- |
| **React DevTools State Manipulation** | React holds zero authoritative streak/reward logic; changing local React state does not alter API requests or MongoDB data. Backend re-derives eligibility on every call. | `backend/src/services/streak.service.js` |
| **System Clock Manipulation (+24h)** | Cooldown (`nextClaimAt`) and expiry (`expiresAt`) are validated exclusively using server `new Date()`. Frontend countdown advances via monotonic `performance.now()` relative to `serverTime`, then confirms via `GET /api/daily-streak/status`. | `backend/src/services/streak.service.js`, `frontend/src/hooks/useServerCountdown.js` |
| **Client-Supplied Reward / Streak Tampering** | `inspectClaimPayloadForTampering` detects `reward`, `amount`, `currency`, `rewardType`, `streak`, `status`, etc., logs `INVALID_CLAIM` to `AuditLog`, and rejects with `400`. | `backend/src/validators/streakValidator.js` |
| **Day Skipping (`{ "day": 7 }`)** | Backend verifies `requestedDay === activeCycle.nextClaimDay` AND explicitly queries `StreakClaim` for `day - 1` before allowing Day `N`. Rejections are logged as `INVALID_CLAIM`. | `backend/src/services/streak.service.js` |
| **Cross-User Attack (`{ "userId": "anotherUser" }`)** | User identity comes strictly from verified JWT (`req.user.id`). Foreign `userId` params trigger `CROSS_USER_ATTEMPT` in `AuditLog` and `403 Forbidden`. | `backend/src/middleware/authMiddleware.js`, `backend/src/validators/streakValidator.js` |
| **Duplicate / Double-Click Claims** | Frontend disables Claim button immediately and sends an `Idempotency-Key`. Backend enforces idempotent replay checks + `StreakClaim` unique index `{ userId, cycleId, day }`. | `backend/src/services/streak.service.js`, `backend/src/models/StreakClaim.js` |
| **Concurrent Race Condition** | Atomic `StreakCycle.findOneAndUpdate({ ..., claimLock: false }, { $set: { claimLock: true } })` lock + unique DB constraints + MongoDB transactions (replica set) ensure only 1 concurrent claim succeeds. | `backend/src/services/streak.service.js`, `backend/src/utils/dbTransaction.js` |
| **API Abuse / Brute Force** | `helmet` security headers, strict JSON payload cap (`32kb`), and `express-rate-limit` on `/api`, `/api/auth/*`, and `/api/daily-streak/claim*`. | `backend/src/app.js`, `backend/src/middleware/rateLimiter.js` |
| **Internal Error Leakage** | Central error middleware sanitizes `MongoServerError`, `CastError`, and unexpected errors into user-safe messages. | `backend/src/middleware/errorMiddleware.js` |

