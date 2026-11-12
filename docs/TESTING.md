# VELoop Rewards — Testing & Verification Guide

## Automated Test Suites

### 1. Backend Unit Tests
Tests payload tamper inspection and DB-config-driven timestamp calculation without needing external services:
```bash
cd backend
npm test
```

### 2. Live End-to-End Security & Concurrency Suite
Requires MongoDB running at `MONGO_URI` in `backend/.env`:
```bash
cd backend
npm run test:security
```
This script verifies:
- Unauthenticated request rejection (`401`)
- Day-skip rejection (`{ "day": 7 }` on Day 1 -> `400`)
- Fake reward/currency rejection (`{ "day": 1, "reward": 1000000, "currency": "VES" }` -> `400`)
- Cross-user manipulation rejection (`{ "userId": "anotherUser" }` -> `403`)
- Concurrent simultaneous claims (`Promise.all` firing 2 simultaneous `POST /claim` requests -> strictly `[200, 409]`, wallet credited only once)
- Locked Day 2 claim rejection (`409`)
- Missed-day streak reset (`> 48h` elapsed -> `wasReset: true`, `currentStreak: 0`, `currentDay: 1`)

---

## Manual QA Checklist & Reproduction Steps

| Scenario | How to Test | Expected Result |
| :--- | :--- | :--- |
| **1. Normal Claim** | Log in as `demo@velooprewards.in` (`VeloopDemo@2026`), click **Claim Now** on Day 2. | CPA Demo modal plays -> backend credits `+10 VEs` -> wallet updates `120 -> 130 VEs` -> Day 2 shows `✓ Claimed` -> Day 3 shows 24h countdown. |
| **2. Already Claimed** | Call `POST /api/daily-streak/claim` with `{ "day": 1 }` via Postman. | `409 Conflict` (`"This reward has already been claimed."`) + `DUPLICATE_CLAIM` in `AuditLog`. |
| **3. Locked Reward** | Call `POST /api/daily-streak/claim` with `{ "day": 3 }` while Day 3 timer is active. | `409 Conflict` (`"Your next reward is not available yet."`). |
| **4. Timer Manipulation** | Advance OS clock forward by 24 hours and refresh / click Claim. | Frontend monotonic timer does not unlock early; backend rejects claim using trusted server clock. |
| **5. Timer Expiry Unlock** | Run `node src/scripts/simulateMissedStreak.js demo@velooprewards.in 25` to move last claim 25h back, then wait/refresh. | `GET /api/daily-streak/status` unlocks next day; button changes to **Claim Now**. |
| **6. Missed Day & Reset** | Log in as `missed@velooprewards.in` OR run `node src/scripts/simulateMissedStreak.js demo@velooprewards.in 50` and reload `/daily-streak`. | Backend detects expired window, marks cycle `RESET`, logs `STREAK_RESET`, shows reset notice, and resets user to **Day 1**. |
| **7. Duplicate / Idempotent Request** | Send identical `POST /api/daily-streak/claim` twice with same `Idempotency-Key` header. | Second response returns `idempotentReplay: true` with NO extra wallet credit. |
| **8. Concurrent Request** | Run `npm run test:security` or fire two simultaneous `POST /claim` requests via curl/Postman Runner. | Only 1 succeeds (`200`); the second is blocked (`409`). |
| **9. Fake Reward / Day / User** | Execute the Negative Tests folder in `postman/veloop-daily-streak.postman_collection.json`. | Rejected with `400`/`403` and recorded in `AuditLog`. |
| **10. Refresh & Logout/Login** | Claim Day 2, refresh browser (`F5`), then log out and log back in. | State persists identically from MongoDB (`Day 2 Claimed`, `Day 3 Locked`). |
| **11. Multiple Tabs** | Open `/daily-streak` in Tab A and Tab B. Claim in Tab A, then attempt claim in Tab B. | Tab B is rejected by backend (`409`) and syncs cleanly to claimed/locked state. |
| **12. Responsive Breakpoints** | Inspect in DevTools at `320`, `360`, `375`, `390`, `414`, `480`, `768`, `820`, `834`, `1024`, `1280`, `1366`, `1440`, `1920`. | Dedicated mobile 4+3 grid, tablet adaptation, and desktop 7-column layout with zero horizontal overflow. |

