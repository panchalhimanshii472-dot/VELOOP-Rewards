const StreakConfig = require('../models/StreakConfig');
const StreakReward = require('../models/StreakReward');
const AppError = require('../utils/appError');

const DEFAULT_CONFIG_KEY = 'DEFAULT_DAILY_STREAK';

const DEFAULT_CONFIG_DATA = {
  key: DEFAULT_CONFIG_KEY,
  cycleTitle: '7-Day VELoop Streak',
  totalDays: 7,
  claimCooldownMinutes: 1440,
  claimWindowMinutes: 1440,
  requireSequentialClaim: true,
  autoStartNewCycleOnCompletion: true,
  cpaDemoEnabled: true,
  cpaDemoDurationMs: 2200,
  active: true,
  metadata: {
    brandName: 'VELoop Rewards',
    officialDomain: 'VeloopRewards.in',
  },
};

const DEFAULT_REWARDS_DATA = [
  {
    configKey: DEFAULT_CONFIG_KEY,
    day: 1,
    rewardType: 'VES',
    currency: 'VES',
    amount: 5,
    title: 'Daily Reward',
    subtitle: '5 VEs',
    displayAmount: '+5',
    badge: null,
    assetType: 'coin',
    isUltimate: false,
    active: true,
    metadata: { tier: 'starter' },
  },
  {
    configKey: DEFAULT_CONFIG_KEY,
    day: 2,
    rewardType: 'VES',
    currency: 'VES',
    amount: 10,
    title: 'Daily Reward',
    subtitle: '10 VEs',
    displayAmount: '+10',
    badge: null,
    assetType: 'coin',
    isUltimate: false,
    active: true,
    metadata: { tier: 'standard' },
  },
  {
    configKey: DEFAULT_CONFIG_KEY,
    day: 3,
    rewardType: 'VES',
    currency: 'VES',
    amount: 15,
    title: 'Daily Reward',
    subtitle: '15 VEs',
    displayAmount: '+15',
    badge: null,
    assetType: 'coin',
    isUltimate: false,
    active: true,
    metadata: { tier: 'standard' },
  },
  {
    configKey: DEFAULT_CONFIG_KEY,
    day: 4,
    rewardType: 'GIFT_CARD',
    currency: 'INR',
    amount: 1,
    title: 'Daily Reward',
    subtitle: 'Amazon Gift Card',
    displayAmount: '₹1',
    badge: null,
    assetType: 'gift-box',
    isUltimate: false,
    active: true,
    metadata: { brand: 'Amazon', voucherPrefix: 'AMZ-VL' },
  },
  {
    configKey: DEFAULT_CONFIG_KEY,
    day: 5,
    rewardType: 'GIFT_CARD',
    currency: 'INR',
    amount: 2,
    title: 'Daily Reward',
    subtitle: 'Amazon Gift Card',
    displayAmount: '₹2',
    badge: 'Gift Card',
    assetType: 'gift-card',
    isUltimate: false,
    active: true,
    metadata: { brand: 'Amazon', voucherPrefix: 'AMZ-VL' },
  },
  {
    configKey: DEFAULT_CONFIG_KEY,
    day: 6,
    rewardType: 'VES',
    currency: 'VES',
    amount: 30,
    title: 'Daily Reward',
    subtitle: '30 VEs',
    displayAmount: '+30',
    badge: 'Coin',
    assetType: 'coin',
    isUltimate: false,
    active: true,
    metadata: { tier: 'bonus' },
  },
  {
    configKey: DEFAULT_CONFIG_KEY,
    day: 7,
    rewardType: 'GIFT_CARD',
    currency: 'INR',
    amount: 5,
    title: 'Ultimate Reward',
    subtitle: 'Amazon Gift Card',
    displayAmount: '₹5',
    badge: 'VIP',
    assetType: 'crown',
    isUltimate: true,
    active: true,
    metadata: { brand: 'Amazon', voucherPrefix: 'AMZ-VIP', tier: 'ultimate' },
  },
];

/**
 * Ensures baseline StreakConfig and StreakReward entries exist in MongoDB.
 * Does not overwrite administrator edits when records already exist.
 */
async function ensureDefaultStreakSetup() {
  await StreakConfig.updateOne(
    { key: DEFAULT_CONFIG_KEY },
    { $setOnInsert: DEFAULT_CONFIG_DATA },
    { upsert: true }
  );

  for (const reward of DEFAULT_REWARDS_DATA) {
    await StreakReward.updateOne(
      { configKey: reward.configKey, day: reward.day },
      { $setOnInsert: reward },
      { upsert: true }
    );
  }
}

async function getActiveConfigAndRewards(configKey = DEFAULT_CONFIG_KEY) {
  let config = await StreakConfig.findOne({ key: configKey, active: true }).lean();
  if (!config) {
    await ensureDefaultStreakSetup();
    config = await StreakConfig.findOne({ key: configKey, active: true }).lean();
  }
  if (!config) {
    throw new AppError('Streak configuration is currently unavailable.', 503, 'CONFIG_UNAVAILABLE');
  }

  let rewards = await StreakReward.find({ configKey: config.key, active: true })
    .sort({ day: 1 })
    .lean();

  if (rewards.length === 0) {
    await ensureDefaultStreakSetup();
    rewards = await StreakReward.find({ configKey: config.key, active: true })
      .sort({ day: 1 })
      .lean();
  }

  if (rewards.length === 0) {
    throw new AppError('No active streak rewards are configured.', 503, 'REWARDS_UNAVAILABLE');
  }

  return { config, rewards };
}

async function getRewardForDay(configKey, day, session = null) {
  const query = StreakReward.findOne({ configKey, day, active: true });
  if (session) {
    query.session(session);
  }
  const reward = await query.lean();
  if (!reward) {
    throw new AppError('Requested reward configuration is unavailable.', 404, 'REWARD_NOT_FOUND');
  }
  return reward;
}

module.exports = {
  DEFAULT_CONFIG_KEY,
  DEFAULT_CONFIG_DATA,
  DEFAULT_REWARDS_DATA,
  ensureDefaultStreakSetup,
  getActiveConfigAndRewards,
  getRewardForDay,
};

