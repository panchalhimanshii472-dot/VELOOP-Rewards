const mongoose = require('mongoose');

const streakClaimSchema = new mongoose.Schema(
  {
    claimId: {
      type: String,
      required: true,
      unique: true,
    },
    referenceId: {
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
    cycleId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'StreakCycle',
      required: true,
    },
    cycleCode: {
      type: String,
      required: true,
    },
    day: {
      type: Number,
      required: true,
      min: 1,
    },
    rewardId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'StreakReward',
      required: true,
    },
    rewardSnapshot: {
      rewardType: { type: String, required: true },
      currency: { type: String, required: true },
      amount: { type: Number, required: true },
      title: { type: String, required: true },
      subtitle: { type: String, required: true },
    },
    status: {
      type: String,
      enum: ['PROCESSING', 'CLAIMED', 'FAILED'],
      default: 'CLAIMED',
    },
    idempotencyKey: {
      type: String,
      default: null,
    },
    transactionId: {
      type: String,
      default: null,
    },
    claimedAt: {
      type: Date,
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

// Enforces once-per-day-per-cycle claiming even under simultaneous concurrent requests.
streakClaimSchema.index({ userId: 1, cycleId: 1, day: 1 }, { unique: true });
streakClaimSchema.index(
  { userId: 1, idempotencyKey: 1 },
  {
    unique: true,
    partialFilterExpression: { idempotencyKey: { $type: 'string' } },
  }
);
streakClaimSchema.index({ userId: 1, claimedAt: -1 });

module.exports = mongoose.model('StreakClaim', streakClaimSchema);

