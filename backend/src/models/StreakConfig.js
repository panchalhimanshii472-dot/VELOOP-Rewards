const mongoose = require('mongoose');

const streakConfigSchema = new mongoose.Schema(
  {
    key: {
      type: String,
      required: true,
      unique: true,
      default: 'DEFAULT_DAILY_STREAK',
    },
    cycleTitle: {
      type: String,
      required: true,
      default: '7-Day VELoop Streak',
    },
    totalDays: {
      type: Number,
      required: true,
      default: 7,
      min: 1,
      max: 30,
    },
    // Cooldown before the next day unlocks, configured in backend/DB (1440 = 24 hours).
    claimCooldownMinutes: {
      type: Number,
      required: true,
      default: 1440,
      min: 1,
    },
    // Grace window after unlock during which the user must claim before streak resets (1440 = 24 hours).
    claimWindowMinutes: {
      type: Number,
      required: true,
      default: 1440,
      min: 1,
    },
    requireSequentialClaim: {
      type: Boolean,
      default: true,
    },
    autoStartNewCycleOnCompletion: {
      type: Boolean,
      default: true,
    },
    cpaDemoEnabled: {
      type: Boolean,
      default: true,
    },
    cpaDemoDurationMs: {
      type: Number,
      default: 2200,
    },
    active: {
      type: Boolean,
      default: true,
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

module.exports = mongoose.model('StreakConfig', streakConfigSchema);

