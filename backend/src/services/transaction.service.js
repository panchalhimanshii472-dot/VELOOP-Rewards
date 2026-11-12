const WalletTransaction = require('../models/WalletTransaction');
const { generateTransactionId } = require('../utils/idGenerator');

async function recordRewardTransaction({
  userId,
  walletId,
  claimId,
  reward,
  streakDay,
  referenceId,
  balanceBefore,
  balanceAfter,
  voucher = null,
  session = null,
}) {
  const payload = {
    transactionId: generateTransactionId(),
    userId,
    walletId,
    claimId,
    rewardType: reward.rewardType,
    currency: reward.currency,
    type: 'CREDIT',
    amount: reward.amount,
    source: 'DAILY_STREAK',
    streakDay,
    referenceId,
    balanceBefore,
    balanceAfter,
    status: 'COMPLETED',
    metadata: {
      rewardTitle: reward.title,
      rewardSubtitle: reward.subtitle,
      ...(voucher ? { voucherCode: voucher.voucherCode, brand: voucher.brand } : {}),
    },
  };

  const created = await WalletTransaction.create([payload], session ? { session } : {});
  return created[0];
}

async function getUserTransactions(userId, { page = 1, limit = 20 } = {}) {
  const safePage = Math.max(Number(page) || 1, 1);
  const safeLimit = Math.min(Math.max(Number(limit) || 20, 1), 100);
  const skip = (safePage - 1) * safeLimit;

  const [items, total] = await Promise.all([
    WalletTransaction.find({ userId })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(safeLimit)
      .lean(),
    WalletTransaction.countDocuments({ userId }),
  ]);

  return {
    items,
    pagination: {
      page: safePage,
      limit: safeLimit,
      total,
      totalPages: Math.max(Math.ceil(total / safeLimit), 1),
    },
  };
}

module.exports = {
  recordRewardTransaction,
  getUserTransactions,
};

