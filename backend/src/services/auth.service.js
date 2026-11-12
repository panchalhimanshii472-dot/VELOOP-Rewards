const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const StreakCycle = require('../models/StreakCycle');
const StreakClaim = require('../models/StreakClaim');
const env = require('../config/env');
const AppError = require('../utils/appError');
const { getOrCreateWallet, formatWalletSummary } = require('./wallet.service');
const { logAuditEvent } = require('./audit.service');

function signAuthToken(user) {
  return jwt.sign(
    {
      sub: String(user._id),
      role: user.role,
    },
    env.jwtSecret,
    { expiresIn: env.jwtExpiresIn }
  );
}

function formatSafeUser(user) {
  return {
    id: String(user._id),
    name: user.name,
    email: user.email,
    role: user.role,
    lastLoginAt: user.lastLoginAt,
    createdAt: user.createdAt,
  };
}

async function registerUser({ name, email, password }, clientMeta = {}) {
  const existing = await User.findOne({ email }).lean();
  if (existing) {
    throw new AppError('An account with this email already exists.', 409, 'EMAIL_EXISTS');
  }

  const passwordHash = await bcrypt.hash(password, 12);
  const user = await User.create({
    name,
    email,
    passwordHash,
    role: 'USER',
    lastLoginAt: new Date(),
  });

  const wallet = await getOrCreateWallet(user._id);
  const token = signAuthToken(user);

  await logAuditEvent({
    event: 'AUTH_REGISTER',
    userId: user._id,
    clientMeta,
    reason: 'New user registered',
  });

  return {
    token,
    user: formatSafeUser(user),
    wallet: formatWalletSummary(wallet),
  };
}

async function loginUser({ email, password }, clientMeta = {}) {
  const user = await User.findOne({ email }).select('+passwordHash');
  if (!user || !user.isActive) {
    await logAuditEvent({
      event: 'AUTH_LOGIN_FAILED',
      userId: user ? user._id : null,
      clientMeta,
      reason: 'Invalid credentials or inactive account',
      metadata: { email },
    });
    throw new AppError('Invalid email or password.', 401, 'INVALID_CREDENTIALS');
  }

  const matches = await bcrypt.compare(password, user.passwordHash);
  if (!matches) {
    await logAuditEvent({
      event: 'AUTH_LOGIN_FAILED',
      userId: user._id,
      clientMeta,
      reason: 'Incorrect password',
      metadata: { email },
    });
    throw new AppError('Invalid email or password.', 401, 'INVALID_CREDENTIALS');
  }

  user.lastLoginAt = new Date();
  await user.save();

  const wallet = await getOrCreateWallet(user._id);
  const token = signAuthToken(user);

  await logAuditEvent({
    event: 'AUTH_LOGIN',
    userId: user._id,
    clientMeta,
    reason: 'User logged in successfully',
  });

  return {
    token,
    user: formatSafeUser(user),
    wallet: formatWalletSummary(wallet),
  };
}

async function getCurrentUserProfile(userId) {
  const user = await User.findById(userId).lean();
  if (!user) {
    throw new AppError('User account not found.', 404, 'USER_NOT_FOUND');
  }
  const [wallet, activeCycle, totalClaims, completedCycles, totalCycles] = await Promise.all([
    getOrCreateWallet(user._id),
    StreakCycle.findOne({ userId: user._id, status: 'ACTIVE' }).lean(),
    StreakClaim.countDocuments({ userId: user._id, status: 'CLAIMED' }),
    StreakCycle.countDocuments({ userId: user._id, status: 'COMPLETED' }),
    StreakCycle.countDocuments({ userId: user._id }),
  ]);

  return {
    user: formatSafeUser(user),
    wallet: formatWalletSummary(wallet),
    streakSummary: {
      currentStreak: activeCycle ? activeCycle.currentStreak : 0,
      currentDay: activeCycle ? Math.min(activeCycle.nextClaimDay, activeCycle.totalDays) : 1,
      activeCycleId: activeCycle ? activeCycle.cycleId : null,
      totalClaims,
      completedCycles,
      totalCycles,
    },
  };
}

async function updateUserProfile(userId, { name }, clientMeta = {}) {
  const user = await User.findByIdAndUpdate(
    userId,
    { $set: { name } },
    { new: true, runValidators: true }
  ).lean();

  if (!user) {
    throw new AppError('User account not found.', 404, 'USER_NOT_FOUND');
  }

  await logAuditEvent({
    event: 'PROFILE_UPDATED',
    userId: user._id,
    clientMeta,
    reason: 'User updated profile name',
  });

  return {
    user: formatSafeUser(user),
  };
}

async function changeUserPassword(userId, { currentPassword, newPassword }, clientMeta = {}) {
  const user = await User.findById(userId).select('+passwordHash');
  if (!user) {
    throw new AppError('User account not found.', 404, 'USER_NOT_FOUND');
  }

  const matches = await bcrypt.compare(currentPassword, user.passwordHash);
  if (!matches) {
    throw new AppError('Current password is incorrect.', 401, 'INVALID_CURRENT_PASSWORD');
  }

  user.passwordHash = await bcrypt.hash(newPassword, 12);
  await user.save();

  await logAuditEvent({
    event: 'PASSWORD_CHANGED',
    userId: user._id,
    clientMeta,
    reason: 'User changed account password',
  });

  return {
    message: 'Password updated successfully.',
  };
}

module.exports = {
  registerUser,
  loginUser,
  getCurrentUserProfile,
  updateUserProfile,
  changeUserPassword,
};

