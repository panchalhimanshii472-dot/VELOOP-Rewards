const mongoose = require('mongoose');

const walletTransactionSchema = new mongoose.Schema(
  {
    transactionId: {
      type: String,
      required: true,
      unique: true,
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    walletId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Wallet',
      required: true,
    },
    claimId: {
      type: String,
      required: true,
    },
    rewardType: {
      type: String,
      enum: ['VES', 'GIFT_CARD'],
      required: true,
    },
    currency: {
      type: String,
      enum: ['VES', 'INR'],
      required: true,
    },
    type: {
      type: String,
      enum: ['CREDIT', 'DEBIT'],
      default: 'CREDIT',
    },
    amount: {
      type: Number,
      required: true,
      min: 0,
    },
    source: {
      type: String,
      required: true,
      default: 'DAILY_STREAK',
    },
    streakDay: {
      type: Number,
      required: true,
      min: 1,
    },
    referenceId: {
      type: String,
      required: true,
      unique: true,
    },
    balanceBefore: {
      type: Number,
      required: true,
      min: 0,
    },
    balanceAfter: {
      type: Number,
      required: true,
      min: 0,
    },
    status: {
      type: String,
      enum: ['COMPLETED', 'FAILED', 'REVERSED'],
      default: 'COMPLETED',
    },
    metadata: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
  },
  {
    timestamps: true,
  }
);

walletTransactionSchema.index({ userId: 1, createdAt: -1 });

module.exports = mongoose.model('WalletTransaction', walletTransactionSchema);

