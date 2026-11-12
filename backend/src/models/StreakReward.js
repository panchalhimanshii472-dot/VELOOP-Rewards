const mongoose = require('mongoose');

const streakRewardSchema = new mongoose.Schema(
  {
    configKey: {
      type: String,
      required: true,
      default: 'DEFAULT_DAILY_STREAK',
    },
    day: {
      type: Number,
      required: true,
      min: 1,
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
    amount: {
      type: Number,
      required: true,
      min: 1,
    },
    title: {
      type: String,
      required: true,
      trim: true,
    },
    subtitle: {
      type: String,
      required: true,
      trim: true,
    },
    displayAmount: {
      type: String,
      required: true,
      trim: true,
    },
    badge: {
      type: String,
      default: null,
    },
    assetType: {
      type: String,
      enum: ['coin', 'gift-box', 'gift-card', 'crown'],
      required: true,
    },
    isUltimate: {
      type: Boolean,
      default: false,
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

streakRewardSchema.index({ configKey: 1, day: 1 }, { unique: true });

module.exports = mongoose.model('StreakReward', streakRewardSchema);

