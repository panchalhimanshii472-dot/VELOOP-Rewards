const bcrypt = require('bcryptjs');
const { connectDatabase, disconnectDatabase } = require('../src/config/db');
const env = require('../src/config/env');
const User = require('../src/models/User');
const Wallet = require('../src/models/Wallet');
const StreakCycle = require('../src/models/StreakCycle');
const StreakClaim = require('../src/models/StreakClaim');
const WalletTransaction = require('../src/models/WalletTransaction');
const AuditLog = require('../src/models/AuditLog');
const {
  ensureDefaultStreakSetup,
  DEFAULT_CONFIG_KEY,
} = require('../src/services/reward.service');
const StreakReward = require('../src/models/StreakReward');
const {
  generateCycleId,
  generateClaimId,
  generateReferenceId,
  generateTransactionId,
} = require('../src/utils/idGenerator');

async function resetUserRecords(userId) {
  await Promise.all([
    Wallet.deleteMany({ userId }),
    StreakCycle.deleteMany({ userId }),
    StreakClaim.deleteMany({ userId }),
    WalletTransaction.deleteMany({ userId }),
    AuditLog.deleteMany({ userId }),
  ]);
}

async function seedDemoUsers() {
  const passwordHash = await bcrypt.hash('VeloopDemo@2026', 12);
  const now = new Date();
  const rewards = await StreakReward.find({ configKey: DEFAULT_CONFIG_KEY }).sort({ day: 1 });
  const day1Reward = rewards.find((r) => r.day === 1);
  const day2Reward = rewards.find((r) => r.day === 2);

  // 1. Primary Demo User: Day 1 claimed 25h ago, Day 2 ready now, 120 VEs wallet
  const demoUser = await User.findOneAndUpdate(
    { email: 'demo@velooprewards.in' },
    {
      $set: {
        name: 'Aarav Mehta',
        email: 'demo@velooprewards.in',
        passwordHash,
        role: 'USER',
        isActive: true,
        lastLoginAt: now,
      },
    },
    { upsert: true, new: true }
  );
  await resetUserRecords(demoUser._id);

  const demoWallet = await Wallet.create({
    userId: demoUser._id,
    veBalance: 120,
    giftCardBalanceInr: 0,
    totalVEsEarned: 120,
    totalGiftCardsEarnedInr: 0,
  });

  const day1ClaimedAt = new Date(now.getTime() - 25 * 60 * 60 * 1000);
  const day2UnlockAt = new Date(day1ClaimedAt.getTime() + 24 * 60 * 60 * 1000);
  const day2ExpireAt = new Date(day2UnlockAt.getTime() + 24 * 60 * 60 * 1000);

  const demoCycle = await StreakCycle.create({
    cycleId: generateCycleId(1),
    userId: demoUser._id,
    cycleNumber: 1,
    configKey: DEFAULT_CONFIG_KEY,
    totalDays: 7,
    currentStreak: 1,
    nextClaimDay: 2,
    status: 'ACTIVE',
    startedAt: day1ClaimedAt,
    lastClaimAt: day1ClaimedAt,
    nextClaimAt: day2UnlockAt,
    expiresAt: day2ExpireAt,
    claimLock: false,
  });

  const demoClaimId = generateClaimId();
  const demoRefId = generateReferenceId();
  const demoTxnId = generateTransactionId();

  await StreakClaim.create({
    claimId: demoClaimId,
    referenceId: demoRefId,
    userId: demoUser._id,
    cycleId: demoCycle._id,
    cycleCode: demoCycle.cycleId,
    day: 1,
    rewardId: day1Reward._id,
    rewardSnapshot: {
      rewardType: day1Reward.rewardType,
      currency: day1Reward.currency,
      amount: day1Reward.amount,
      title: day1Reward.title,
      subtitle: day1Reward.subtitle,
    },
    status: 'CLAIMED',
    transactionId: demoTxnId,
    claimedAt: day1ClaimedAt,
  });

  await WalletTransaction.create({
    transactionId: demoTxnId,
    userId: demoUser._id,
    walletId: demoWallet._id,
    claimId: demoClaimId,
    rewardType: day1Reward.rewardType,
    currency: day1Reward.currency,
    type: 'CREDIT',
    amount: day1Reward.amount,
    source: 'DAILY_STREAK',
    streakDay: 1,
    referenceId: demoRefId,
    balanceBefore: 115,
    balanceAfter: 120,
    status: 'COMPLETED',
    metadata: { rewardTitle: day1Reward.title, rewardSubtitle: day1Reward.subtitle },
  });

  // 2. Fresh User: Day 1 ready to claim
  const freshUser = await User.findOneAndUpdate(
    { email: 'fresh@velooprewards.in' },
    {
      $set: {
        name: 'Priya Sharma',
        email: 'fresh@velooprewards.in',
        passwordHash,
        role: 'USER',
        isActive: true,
        lastLoginAt: now,
      },
    },
    { upsert: true, new: true }
  );
  await resetUserRecords(freshUser._id);
  await Wallet.create({ userId: freshUser._id, veBalance: 0 });
  await StreakCycle.create({
    cycleId: generateCycleId(1),
    userId: freshUser._id,
    cycleNumber: 1,
    configKey: DEFAULT_CONFIG_KEY,
    totalDays: 7,
    currentStreak: 0,
    nextClaimDay: 1,
    status: 'ACTIVE',
    startedAt: now,
    claimLock: false,
  });

  // 3. Missed-Streak Demo User: Day 1 & Day 2 claimed > 52h ago -> triggers reset on next check
  const missedUser = await User.findOneAndUpdate(
    { email: 'missed@velooprewards.in' },
    {
      $set: {
        name: 'Rohan Verma',
        email: 'missed@velooprewards.in',
        passwordHash,
        role: 'USER',
        isActive: true,
        lastLoginAt: now,
      },
    },
    { upsert: true, new: true }
  );
  await resetUserRecords(missedUser._id);
  const missedWallet = await Wallet.create({
    userId: missedUser._id,
    veBalance: 15,
    totalVEsEarned: 15,
  });

  const missedDay1At = new Date(now.getTime() - 78 * 60 * 60 * 1000);
  const missedDay2At = new Date(now.getTime() - 52 * 60 * 60 * 1000);
  const missedUnlockAt = new Date(missedDay2At.getTime() + 24 * 60 * 60 * 1000);
  const missedExpireAt = new Date(missedUnlockAt.getTime() + 24 * 60 * 60 * 1000);

  const missedCycle = await StreakCycle.create({
    cycleId: generateCycleId(1),
    userId: missedUser._id,
    cycleNumber: 1,
    configKey: DEFAULT_CONFIG_KEY,
    totalDays: 7,
    currentStreak: 2,
    nextClaimDay: 3,
    status: 'ACTIVE',
    startedAt: missedDay1At,
    lastClaimAt: missedDay2At,
    nextClaimAt: missedUnlockAt,
    expiresAt: missedExpireAt,
    claimLock: false,
  });

  for (const [day, reward, claimedAt, beforeBal, afterBal] of [
    [1, day1Reward, missedDay1At, 0, 5],
    [2, day2Reward, missedDay2At, 5, 15],
  ]) {
    const cId = generateClaimId();
    const rId = generateReferenceId();
    const tId = generateTransactionId();
    await StreakClaim.create({
      claimId: cId,
      referenceId: rId,
      userId: missedUser._id,
      cycleId: missedCycle._id,
      cycleCode: missedCycle.cycleId,
      day,
      rewardId: reward._id,
      rewardSnapshot: {
        rewardType: reward.rewardType,
        currency: reward.currency,
        amount: reward.amount,
        title: reward.title,
        subtitle: reward.subtitle,
      },
      status: 'CLAIMED',
      transactionId: tId,
      claimedAt,
    });
    await WalletTransaction.create({
      transactionId: tId,
      userId: missedUser._id,
      walletId: missedWallet._id,
      claimId: cId,
      rewardType: reward.rewardType,
      currency: reward.currency,
      type: 'CREDIT',
      amount: reward.amount,
      source: 'DAILY_STREAK',
      streakDay: day,
      referenceId: rId,
      balanceBefore: beforeBal,
      balanceAfter: afterBal,
      status: 'COMPLETED',
    });
  }
}

async function main() {
  await connectDatabase(env.mongoUri);
  await ensureDefaultStreakSetup();
  await seedDemoUsers();

  console.log('Seed completed successfully.');
  console.log('Demo accounts (password: VeloopDemo@2026):');
  console.log('  - demo@velooprewards.in   (Day 1 claimed, Day 2 ready now, 120 VEs)');
  console.log('  - fresh@velooprewards.in  (New user, Day 1 ready now, 0 VEs)');
  console.log('  - missed@velooprewards.in (Missed Day 3 window -> resets to Day 1 on load)');

  await disconnectDatabase();
}

main().catch((err) => {
  console.error('Seed failed:', err);
  process.exit(1);
});

