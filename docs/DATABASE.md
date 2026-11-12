# VELoop Rewards — Database Architecture (`MongoDB` + `Mongoose`)

## Traceability Chain

Every successful reward claim creates a fully traceable database chain:

```text
StreakCycle (ACTIVE)
   │
   ▼
StreakClaim (claimId, referenceId, userId, cycleId, day, rewardId)
   │
   ▼
StreakReward (authoritative reward amount, type, currency)
   │
   ▼
WalletTransaction (transactionId, referenceId, balanceBefore -> balanceAfter)
   │
   ▼
Wallet (veBalance, giftCardBalanceInr, giftCardVouchers)
```

All security decisions and anomalies are simultaneously recorded in `AuditLog`.

---

## Collections & Key Constraints

### 1. `users` (`User`)
- `name`, `email` (unique), `passwordHash` (`select: false`), `role`, `isActive`, `lastLoginAt`

### 2. `wallets` (`Wallet`)
- `userId` (unique ref `User`)
- `veBalance` (Number >= 0), `giftCardBalanceInr` (Number >= 0)
- `totalVEsEarned`, `totalGiftCardsEarnedInr`
- `giftCardVouchers`: embedded voucher records (`voucherCode`, `brand`, `amountInr`, `claimId`, `referenceId`, `issuedAt`)

### 3. `streakconfigs` (`StreakConfig`)
- `key` (`'DEFAULT_DAILY_STREAK'`, unique)
- `totalDays` (`7`), `claimCooldownMinutes` (`1440`), `claimWindowMinutes` (`1440`)
- `cpaDemoEnabled`, `cpaDemoDurationMs`
- Changing values in MongoDB automatically drives countdowns, unlock windows, and UI statistics without React code changes.

### 4. `streakrewards` (`StreakReward`)
- Compound unique index: `{ configKey: 1, day: 1 }`
- Stores `day`, `rewardType` (`VES` | `GIFT_CARD`), `currency` (`VES` | `INR`), `amount`, `title`, `subtitle`, `displayAmount`, `badge`, `assetType`, `isUltimate`, `active`.

### 5. `streakcycles` (`StreakCycle`)
- `cycleId` (unique), `userId`, `cycleNumber`, `currentStreak`, `nextClaimDay`, `status` (`ACTIVE` | `COMPLETED` | `RESET`)
- `lastClaimAt`, `nextClaimAt`, `expiresAt`, `claimLock`
- **Partial Unique Index:** `{ userId: 1 }` where `status: 'ACTIVE'` guarantees a user can never hold two simultaneous active cycles.
- **Cycle Completion Approach:** When Day 7 is claimed, `nextClaimDay` moves to `8` (`> totalDays`) and `nextClaimAt` is set to `claimedAt + claimCooldownMinutes`. Once `serverNow >= nextClaimAt`, the active cycle is marked `COMPLETED` and a fresh `ACTIVE` cycle (`cycleNumber + 1`, Day 1 available) begins automatically.

### 6. `streakclaims` (`StreakClaim`)
- `claimId` (unique), `referenceId` (unique `STREAK-XXXXXXXX`), `userId`, `cycleId`, `day`, `rewardId`, `rewardSnapshot`, `status`, `idempotencyKey`, `transactionId`, `claimedAt`
- **Unique Compound Index:** `{ userId: 1, cycleId: 1, day: 1 }` enforces once-per-day claiming at the MongoDB storage layer.
- **Partial Unique Index:** `{ userId: 1, idempotencyKey: 1 }` when `idempotencyKey` is a string.

### 7. `wallettransactions` (`WalletTransaction`)
- `transactionId` (unique), `referenceId` (unique), `userId`, `walletId`, `claimId`, `rewardType`, `currency`, `type`, `amount`, `source` (`'DAILY_STREAK'`), `streakDay`, `balanceBefore`, `balanceAfter`, `status`, `createdAt`

### 8. `auditlogs` (`AuditLog`)
- `event`, `userId`, `ipAddress`, `userAgent`, `requestedDay`, `actualDay`, `reason`, `metadata`, `createdAt`

