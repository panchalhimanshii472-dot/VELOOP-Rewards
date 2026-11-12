const mongoose = require('mongoose');

const streakCycleSchema = new mongoose.Schema(
  {
    cycleId: {
      type: String,
      required: true,
      unique: true,
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    cycleNumber: {
      type: Number,
      required: true,
      min: 1,
    },
    configKey: {
      type: String,
      required: true,
      default: 'DEFAULT_DAILY_STREAK',
    },
    totalDays: {
      type: Number,
      required: true,
      default: 7,
    },
    currentStreak: {
      type: Number,
      required: true,
      default: 0,
      min: 0,
    },
    nextClaimDay: {
      type: Number,
      required: true,
      default: 1,
      min: 1,
    },
    status: {
      type: String,
      enum: ['ACTIVE', 'COMPLETED', 'RESET'],
      default: 'ACTIVE',
      index: true,
    },
    startedAt: {
      type: Date,
      required: true,
    },
    lastClaimAt: {
      type: Date,
      default: null,
    },
    nextClaimAt: {
      type: Date,
      default: null,
    },
    expiresAt: {
      type: Date,
      default: null,
    },
    completedAt: {
      type: Date,
      default: null,
    },
    resetAt: {
      type: Date,
      default: null,
    },
    resetReason: {
      type: String,
      default: null,
    },
    claimLock: {
      type: Boolean,
      default: false,
    },
    claimLockAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

streakCycleSchema.index(
  { userId: 1 },
  {
    unique: true,
    partialFilterExpression: { status: 'ACTIVE' },
  }
);
streakCycleSchema.index({ userId: 1, cycleNumber: -1 });

module.exports = mongoose.model('StreakCycle', streakCycleSchema);

