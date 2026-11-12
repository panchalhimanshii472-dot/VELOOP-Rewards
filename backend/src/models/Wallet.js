const mongoose = require('mongoose');

const voucherSchema = new mongoose.Schema(
  {
    voucherCode: { type: String, required: true },
    brand: { type: String, required: true, default: 'Amazon' },
    amountInr: { type: Number, required: true, min: 1 },
    claimId: { type: String, required: true },
    referenceId: { type: String, required: true },
    issuedAt: { type: Date, required: true },
  },
  { _id: false }
);

const walletSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true,
    },
    veBalance: {
      type: Number,
      required: true,
      default: 0,
      min: 0,
    },
    giftCardBalanceInr: {
      type: Number,
      required: true,
      default: 0,
      min: 0,
    },
    totalVEsEarned: {
      type: Number,
      required: true,
      default: 0,
      min: 0,
    },
    totalGiftCardsEarnedInr: {
      type: Number,
      required: true,
      default: 0,
      min: 0,
    },
    giftCardVouchers: {
      type: [voucherSchema],
      default: [],
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('Wallet', walletSchema);

