/**
 * Development utility to shift an active streak cycle's timestamps backwards
 * in MongoDB so evaluators can verify 24h unlock or missed-day streak reset
 * without waiting 24-48 real hours.
 *
 * Usage:
 *   node src/scripts/simulateMissedStreak.js <email> [hoursAgo]
 * Examples:
 *   node src/scripts/simulateMissedStreak.js demo@velooprewards.in 25   # Unlocks next day
 *   node src/scripts/simulateMissedStreak.js demo@velooprewards.in 50   # Triggers missed-day reset
 */

const { connectDatabase, disconnectDatabase } = require('../config/db');
const env = require('../config/env');
const User = require('../models/User');
const StreakCycle = require('../models/StreakCycle');
const StreakConfig = require('../models/StreakConfig');

async function run() {
  if (env.nodeEnv === 'production') {
    throw new Error('Time simulation script is disabled in production.');
  }

  const email = (process.argv[2] || 'demo@velooprewards.in').toLowerCase().trim();
  const hoursAgo = Number(process.argv[3] || 50);

  if (!Number.isFinite(hoursAgo) || hoursAgo <= 0) {
    throw new Error('hoursAgo must be a positive number.');
  }

  await connectDatabase(env.mongoUri);

  const user = await User.findOne({ email });
  if (!user) {
    throw new Error(`User not found: ${email}`);
  }

  const cycle = await StreakCycle.findOne({ userId: user._id, status: 'ACTIVE' });
  if (!cycle) {
    throw new Error(`No active streak cycle found for ${email}`);
  }

  const config = await StreakConfig.findOne({ key: cycle.configKey });
  const cooldownMs = (config ? config.claimCooldownMinutes : 1440) * 60 * 1000;
  const windowMs = (config ? config.claimWindowMinutes : 1440) * 60 * 1000;

  const simulatedLastClaim = new Date(Date.now() - hoursAgo * 60 * 60 * 1000);
  const simulatedNextClaim = new Date(simulatedLastClaim.getTime() + cooldownMs);
  const simulatedExpires = new Date(simulatedNextClaim.getTime() + windowMs);

  cycle.lastClaimAt = simulatedLastClaim;
  cycle.nextClaimAt = simulatedNextClaim;
  cycle.expiresAt = simulatedExpires;
  await cycle.save();

  console.log(`Updated active cycle ${cycle.cycleId} for ${email}:`);
  console.log(`  lastClaimAt : ${simulatedLastClaim.toISOString()}`);
  console.log(`  nextClaimAt : ${simulatedNextClaim.toISOString()}`);
  console.log(`  expiresAt   : ${simulatedExpires.toISOString()}`);

  await disconnectDatabase();
}

run().catch((err) => {
  console.error('Simulation failed:', err.message);
  process.exit(1);
});

