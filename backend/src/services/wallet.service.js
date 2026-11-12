const Wallet = require('../models/Wallet');
const { generateGiftCardVoucherCode } = require('../utils/idGenerator');
const AppError = require('../utils/appError');

async function getOrCreateWallet(userId, session = null) {
  let query = Wallet.findOne({ userId });
  if (session) query = query.session(session);
  let wallet = await query;

  if (!wallet) {
    const created = await Wallet.create(
      [
        {
          userId,
          veBalance: 0,
          giftCardBalanceInr: 0,
          totalVEsEarned: 0,
          totalGiftCardsEarnedInr: 0,
          giftCardVouchers: [],
        },
      ],
      session ? { session } : {}
    );
    wallet = created[0];
  }

  return wallet;
}

/**
 * Atomically credits a verified reward to the user's MongoDB wallet and returns
 * before/after balance snapshots for the transaction ledger.
 */
async function creditRewardToWallet({
  userId,
  reward,
  claimId,
  referenceId,
  creditedAt,
  session = null,
}) {
  const existingWallet = await getOrCreateWallet(userId, session);

  const isVes = reward.rewardType === 'VES';
  const balanceBefore = isVes
    ? existingWallet.veBalance
    : existingWallet.giftCardBalanceInr;

  const incFields = isVes
    ? { veBalance: reward.amount, totalVEsEarned: reward.amount }
    : {
        giftCardBalanceInr: reward.amount,
        totalGiftCardsEarnedInr: reward.amount,
      };

  const voucher = !isVes
    ? {
        voucherCode: generateGiftCardVoucherCode(),
        brand: (reward.metadata && reward.metadata.brand) || 'Amazon',
        amountInr: reward.amount,
        claimId,
        referenceId,
        issuedAt: creditedAt,
      }
    : null;

  const updateOps = { $inc: incFields };
  if (voucher) {
    updateOps.$push = { giftCardVouchers: voucher };
  }

  const updatedWallet = await Wallet.findOneAndUpdate(
    { _id: existingWallet._id, userId },
    updateOps,
    { new: true, session: session || undefined }
  );

  if (!updatedWallet) {
    throw new AppError('Unable to update wallet balance.', 500, 'WALLET_UPDATE_FAILED');
  }

  const balanceAfter = isVes
    ? updatedWallet.veBalance
    : updatedWallet.giftCardBalanceInr;

  return {
    wallet: updatedWallet,
    balanceBefore,
    balanceAfter,
    voucher,
  };
}

function formatWalletSummary(walletDoc) {
  if (!walletDoc) {
    return {
      veBalance: 0,
      giftCardBalanceInr: 0,
      totalVEsEarned: 0,
      totalGiftCardsEarnedInr: 0,
      giftCardVouchers: [],
    };
  }

  const vouchers = Array.isArray(walletDoc.giftCardVouchers)
    ? [...walletDoc.giftCardVouchers].sort(
        (a, b) => new Date(b.issuedAt) - new Date(a.issuedAt)
      )
    : [];

  return {
    veBalance: walletDoc.veBalance,
    giftCardBalanceInr: walletDoc.giftCardBalanceInr,
    totalVEsEarned: walletDoc.totalVEsEarned,
    totalGiftCardsEarnedInr: walletDoc.totalGiftCardsEarnedInr,
    giftCardVouchers: vouchers,
  };
}

module.exports = {
  getOrCreateWallet,
  creditRewardToWallet,
  formatWalletSummary,
};

