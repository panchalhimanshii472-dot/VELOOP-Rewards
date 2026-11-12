const StreakCycle = require('../models/StreakCycle');
const StreakClaim = require('../models/StreakClaim');
const AppError = require('../utils/appError');
const {
  generateCycleId,
  generateClaimId,
  generateReferenceId,
} = require('../utils/idGenerator');
const { runWithOptionalTransaction } = require('../utils/dbTransaction');
const {
  getActiveConfigAndRewards,
  getRewardForDay,
} = require('./reward.service');
const {
  getOrCreateWallet,
  creditRewardToWallet,
  formatWalletSummary,
} = require('./wallet.service');
const { recordRewardTransaction } = require('./transaction.service');
const { logAuditEvent } = require('./audit.service');

/**
 * Computes nextClaimAt and expiresAt purely from DB-configured minutes and server time.
 */
function calculateNextTimestamps(claimDate, config) {
  const cooldownMs = Number(config.claimCooldownMinutes) * 60 * 1000;
  const windowMs = Number(config.claimWindowMinutes) * 60 * 1000;

  const nextClaimAt = new Date(claimDate.getTime() + cooldownMs);
  const expiresAt = new Date(nextClaimAt.getTime() + windowMs);

  return { nextClaimAt, expiresAt };
}

async function createNextActiveCycle({ userId, config, serverNow, clientMeta }) {
  const lastCycle = await StreakCycle.findOne({ userId })
    .sort({ cycleNumber: -1 })
    .lean();

  const nextCycleNumber = lastCycle ? lastCycle.cycleNumber + 1 : 1;

  try {
    return await StreakCycle.create({
      cycleId: generateCycleId(nextCycleNumber),
      userId,
      cycleNumber: nextCycleNumber,
      configKey: config.key,
      totalDays: config.totalDays,
      currentStreak: 0,
      nextClaimDay: 1,
      status: 'ACTIVE',
      startedAt: serverNow,
      lastClaimAt: null,
      nextClaimAt: null,
      expiresAt: null,
      claimLock: false,
    });
  } catch (err) {
    // Handle concurrent first-load creation gracefully via unique partial index
    if (err && err.code === 11000) {
      const existingActive = await StreakCycle.findOne({ userId, status: 'ACTIVE' });
      if (existingActive) return existingActive;
    }
    await logAuditEvent({
      event: 'STREAK_CLAIM_REJECTED',
      userId,
      clientMeta,
      reason: 'Cycle creation conflict',
    });
    throw err;
  }
}

/**
 * Resolves the user's current active cycle and applies authoritative server-side
 * missed-day reset or completed-cycle rollover based on serverTime.
 */
async function resolveOrInitializeActiveCycle({
  userId,
  config,
  serverNow,
  clientMeta = {},
}) {
  let activeCycle = await StreakCycle.findOne({ userId, status: 'ACTIVE' });

  if (!activeCycle) {
    activeCycle = await createNextActiveCycle({ userId, config, serverNow, clientMeta });
    return { activeCycle, resetInfo: { wasReset: false } };
  }

  // Completed 7-day cycle rolls over to Cycle N+1 once cooldown finishes
  if (
    activeCycle.nextClaimDay > config.totalDays &&
    activeCycle.nextClaimAt &&
    serverNow >= activeCycle.nextClaimAt
  ) {
    const completedCycle = await StreakCycle.findOneAndUpdate(
      { _id: activeCycle._id, status: 'ACTIVE' },
      {
        $set: {
          status: 'COMPLETED',
          completedAt: serverNow,
          claimLock: false,
        },
      },
      { new: true }
    );

    if (completedCycle && config.autoStartNewCycleOnCompletion) {
      const nextCycle = await createNextActiveCycle({
        userId,
        config,
        serverNow,
        clientMeta,
      });
      return {
        activeCycle: nextCycle,
        resetInfo: {
          wasReset: false,
          cycleCompleted: true,
          completedCycleNumber: completedCycle.cycleNumber,
        },
      };
    }
  }

  // Missed-day detection: user did not return before expiresAt
  if (
    activeCycle.lastClaimAt &&
    activeCycle.expiresAt &&
    activeCycle.nextClaimDay <= config.totalDays &&
    serverNow > activeCycle.expiresAt
  ) {
    const previousStreak = activeCycle.currentStreak;
    const missedDay = activeCycle.nextClaimDay;

    const resetCycle = await StreakCycle.findOneAndUpdate(
      { _id: activeCycle._id, status: 'ACTIVE' },
      {
        $set: {
          status: 'RESET',
          resetAt: serverNow,
          resetReason: 'MISSED_CLAIM_WINDOW',
          claimLock: false,
        },
      },
      { new: true }
    );

    if (resetCycle) {
      await logAuditEvent({
        event: 'STREAK_RESET',
        userId,
        clientMeta,
        actualDay: missedDay,
        reason: `Missed Day ${missedDay} claim window; streak reset from ${previousStreak} to 0.`,
        metadata: {
          previousCycleId: resetCycle.cycleId,
          previousStreak,
          expiredAt: resetCycle.expiresAt,
          detectedAt: serverNow,
        },
      });
    }

    const freshCycle = await createNextActiveCycle({
      userId,
      config,
      serverNow,
      clientMeta,
    });

    return {
      activeCycle: freshCycle,
      resetInfo: {
        wasReset: true,
        previousStreak,
        missedDay,
        resetAt: serverNow.toISOString(),
        message: 'Your streak has been reset after a missed day. Start again from Day 1.',
      },
    };
  }

  return { activeCycle, resetInfo: { wasReset: false } };
}

function buildStatusMessage({ canClaim, isCycleCompleted, resetInfo, activeCycle }) {
  if (resetInfo && resetInfo.wasReset) {
    return resetInfo.message;
  }
  if (isCycleCompleted) {
    return '7-Day cycle completed! Next streak cycle unlocks when the timer finishes.';
  }
  if (canClaim) {
    return activeCycle.currentStreak === 0
      ? 'Start your streak today and claim your first reward!'
      : `Day ${activeCycle.nextClaimDay} reward is ready to claim now!`;
  }
  return 'Come back tomorrow for more rewards!';
}

/**
 * Returns the complete backend-calculated streak dashboard state.
 */
async function getStreakDashboard(userId, options = {}) {
  const nowProvider = options.now || (() => new Date());
  const serverNow = nowProvider();
  const clientMeta = options.clientMeta || {};

  const { config, rewards } = await getActiveConfigAndRewards();
  const { activeCycle, resetInfo } = await resolveOrInitializeActiveCycle({
    userId,
    config,
    serverNow,
    clientMeta,
  });

  const [claims, walletDoc] = await Promise.all([
    StreakClaim.find({
      userId,
      cycleId: activeCycle._id,
      status: 'CLAIMED',
    })
      .sort({ day: 1 })
      .lean(),
    getOrCreateWallet(userId),
  ]);

  const claimByDay = new Map(claims.map((claim) => [claim.day, claim]));
  const isCycleCompleted = activeCycle.nextClaimDay > config.totalDays;
  const isCooldownElapsed =
    !activeCycle.nextClaimAt || serverNow >= activeCycle.nextClaimAt;
  const canClaimNow = !isCycleCompleted && isCooldownElapsed;

  const rewardCards = rewards.map((reward) => {
    const existingClaim = claimByDay.get(reward.day);
    let cardStatus = 'LOCKED';
    let isToday = false;
    let cardNextClaimAt = null;

    if (existingClaim) {
      cardStatus = 'CLAIMED';
    } else if (reward.day === activeCycle.nextClaimDay) {
      if (isCooldownElapsed) {
        cardStatus = 'AVAILABLE';
        isToday = true;
      } else {
        cardStatus = 'LOCKED';
        cardNextClaimAt = activeCycle.nextClaimAt
          ? activeCycle.nextClaimAt.toISOString()
          : null;
      }
    }

    return {
      rewardId: String(reward._id),
      day: reward.day,
      status: cardStatus,
      isToday,
      isUltimate: Boolean(reward.isUltimate),
      badge: reward.badge || null,
      assetType: reward.assetType,
      title: reward.title,
      subtitle: reward.subtitle,
      displayAmount: reward.displayAmount,
      nextClaimAt: cardNextClaimAt,
      claimedAt: existingClaim ? existingClaim.claimedAt.toISOString() : null,
      referenceId: existingClaim ? existingClaim.referenceId : null,
      reward: {
        type: reward.rewardType,
        currency: reward.currency,
        amount: reward.amount,
      },
    };
  });

  const ultimateConfig =
    rewards.find((r) => r.isUltimate) || rewards[rewards.length - 1];
  const ultimateClaim = claimByDay.get(ultimateConfig.day);

  const nextRewardDoc = !isCycleCompleted
    ? rewards.find((r) => r.day === activeCycle.nextClaimDay) || rewards[0]
    : rewards[0];

  const displayCurrentDay = isCycleCompleted
    ? config.totalDays
    : activeCycle.nextClaimDay;

  return {
    success: true,
    serverTime: serverNow.toISOString(),
    config: {
      cycleTitle: config.cycleTitle,
      totalDays: rewards.length,
      claimCooldownMinutes: config.claimCooldownMinutes,
      claimWindowMinutes: config.claimWindowMinutes,
      cpaDemoEnabled: Boolean(config.cpaDemoEnabled),
      cpaDemoDurationMs: Number(config.cpaDemoDurationMs) || 2200,
    },
    streak: {
      cycleId: activeCycle.cycleId,
      cycleNumber: activeCycle.cycleNumber,
      currentStreak: activeCycle.currentStreak,
      currentDay: displayCurrentDay,
      checkedIn: claims.length,
      totalRewards: rewards.length,
      status: isCycleCompleted
        ? 'COMPLETED'
        : canClaimNow
          ? 'AVAILABLE'
          : 'LOCKED',
      canClaim: canClaimNow,
      lastClaimAt: activeCycle.lastClaimAt
        ? activeCycle.lastClaimAt.toISOString()
        : null,
      nextClaimAt: activeCycle.nextClaimAt
        ? activeCycle.nextClaimAt.toISOString()
        : null,
      expiresAt: activeCycle.expiresAt
        ? activeCycle.expiresAt.toISOString()
        : null,
      nextReward: {
        day: nextRewardDoc.day,
        amount: nextRewardDoc.amount,
        currency: nextRewardDoc.currency,
        rewardType: nextRewardDoc.rewardType,
        title: nextRewardDoc.title,
        subtitle: nextRewardDoc.subtitle,
        displayAmount: nextRewardDoc.displayAmount,
      },
      statusMessage: buildStatusMessage({
        canClaim: canClaimNow,
        isCycleCompleted,
        resetInfo,
        activeCycle,
      }),
    },
    ultimateReward: {
      day: ultimateConfig.day,
      title: ultimateConfig.title,
      subtitle: ultimateConfig.subtitle,
      displayAmount: ultimateConfig.displayAmount,
      amount: ultimateConfig.amount,
      currency: ultimateConfig.currency,
      rewardType: ultimateConfig.rewardType,
      assetType: ultimateConfig.assetType,
      status: ultimateClaim
        ? 'CLAIMED'
        : ultimateConfig.day === activeCycle.nextClaimDay && canClaimNow
          ? 'AVAILABLE'
          : 'LOCKED',
      unlockText: ultimateClaim ? 'Unlocked' : `Unlock on Day ${ultimateConfig.day}`,
    },
    rewards: rewardCards,
    wallet: formatWalletSummary(walletDoc),
    streakResetInfo: resetInfo,
  };
}

/**
 * Lightweight status endpoint used by countdown completion and polling.
 */
async function getStreakStatus(userId, options = {}) {
  const dashboard = await getStreakDashboard(userId, options);
  return {
    success: true,
    serverTime: dashboard.serverTime,
    streak: dashboard.streak,
    streakResetInfo: dashboard.streakResetInfo,
  };
}

/**
 * Validates every eligibility rule strictly on the server before claiming.
 */
async function validateClaimEligibility({
  userId,
  requestedDay = null,
  config,
  activeCycle,
  resetInfo,
  serverNow,
  clientMeta = {},
}) {
  if (resetInfo && resetInfo.wasReset) {
    await logAuditEvent({
      event: 'STREAK_CLAIM_REJECTED',
      userId,
      clientMeta,
      requestedDay,
      actualDay: activeCycle.nextClaimDay,
      reason: 'Claim attempted after streak reset due to missed day',
    });
    throw new AppError(
      'Your streak has been reset. Start again from Day 1.',
      409,
      'STREAK_RESET',
      {
        resetInfo,
        currentDay: 1,
        serverTime: serverNow.toISOString(),
      }
    );
  }

  if (activeCycle.nextClaimDay > config.totalDays) {
    await logAuditEvent({
      event: 'DUPLICATE_CLAIM',
      userId,
      clientMeta,
      requestedDay,
      actualDay: config.totalDays,
      reason: 'Cycle already completed; waiting for next cycle cooldown',
    });
    throw new AppError(
      'All rewards for this cycle have been claimed. Next cycle unlocks soon.',
      409,
      'CYCLE_COMPLETED',
      {
        nextClaimAt: activeCycle.nextClaimAt
          ? activeCycle.nextClaimAt.toISOString()
          : null,
        serverTime: serverNow.toISOString(),
      }
    );
  }

  const eligibleDay = activeCycle.nextClaimDay;

  if (requestedDay !== null) {
    if (requestedDay < 1 || requestedDay > config.totalDays) {
      await logAuditEvent({
        event: 'INVALID_CLAIM',
        userId,
        clientMeta,
        requestedDay,
        actualDay: eligibleDay,
        reason: 'Requested day outside configured streak cycle bounds',
      });
      throw new AppError('Invalid reward day requested.', 400, 'INVALID_DAY');
    }

    const existingForRequestedDay = await StreakClaim.findOne({
      userId,
      cycleId: activeCycle._id,
      day: requestedDay,
      status: 'CLAIMED',
    }).lean();

    if (existingForRequestedDay) {
      await logAuditEvent({
        event: 'DUPLICATE_CLAIM',
        userId,
        clientMeta,
        requestedDay,
        actualDay: eligibleDay,
        reason: `Day ${requestedDay} already claimed in cycle ${activeCycle.cycleId}`,
      });
      throw new AppError(
        'This reward has already been claimed.',
        409,
        'ALREADY_CLAIMED'
      );
    }

    if (requestedDay !== eligibleDay) {
      await logAuditEvent({
        event: 'INVALID_CLAIM',
        userId,
        clientMeta,
        requestedDay,
        actualDay: eligibleDay,
        reason: `Sequential violation: requested Day ${requestedDay} when eligible day is ${eligibleDay}`,
      });
      throw new AppError(
        'Your next reward is not available yet.',
        400,
        'DAY_SKIP_FORBIDDEN',
        { eligibleDay }
      );
    }
  }

  // Previous-day completion check (mandatory rule 13)
  if (eligibleDay > 1) {
    const previousClaim = await StreakClaim.findOne({
      userId,
      cycleId: activeCycle._id,
      day: eligibleDay - 1,
      status: 'CLAIMED',
    }).lean();

    if (!previousClaim) {
      await logAuditEvent({
        event: 'INVALID_CLAIM',
        userId,
        clientMeta,
        requestedDay: requestedDay || eligibleDay,
        actualDay: eligibleDay,
        reason: `Previous Day ${eligibleDay - 1} claim record missing`,
      });
      throw new AppError(
        'Previous streak day must be completed before claiming this reward.',
        400,
        'PREVIOUS_DAY_NOT_CLAIMED'
      );
    }
  }

  // Server-time cooldown check (mandatory rules 10-12, 46-48)
  if (activeCycle.nextClaimAt && serverNow < activeCycle.nextClaimAt) {
    await logAuditEvent({
      event: 'STREAK_CLAIM_REJECTED',
      userId,
      clientMeta,
      requestedDay: requestedDay || eligibleDay,
      actualDay: eligibleDay,
      reason: 'Cooldown timer has not expired on server clock',
      metadata: {
        serverTime: serverNow.toISOString(),
        nextClaimAt: activeCycle.nextClaimAt.toISOString(),
      },
    });
    throw new AppError(
      'Your next reward is not available yet.',
      409,
      'STREAK_LOCKED',
      {
        nextClaimAt: activeCycle.nextClaimAt.toISOString(),
        serverTime: serverNow.toISOString(),
      }
    );
  }

  const reward = await getRewardForDay(config.key, eligibleDay);
  return { eligibleDay, reward };
}

/**
 * Pre-flight endpoint handler before frontend enters CPA Advertisement Demo state.
 * Does NOT grant any reward.
 */
async function initiateClaim({ userId, requestedDay = null, clientMeta = {}, now }) {
  const nowProvider = now || (() => new Date());
  const serverNow = nowProvider();

  const { config } = await getActiveConfigAndRewards();
  const { activeCycle, resetInfo } = await resolveOrInitializeActiveCycle({
    userId,
    config,
    serverNow,
    clientMeta,
  });

  const { eligibleDay, reward } = await validateClaimEligibility({
    userId,
    requestedDay,
    config,
    activeCycle,
    resetInfo,
    serverNow,
    clientMeta,
  });

  return {
    success: true,
    eligible: true,
    serverTime: serverNow.toISOString(),
    day: eligibleDay,
    cpaDemo: {
      enabled: Boolean(config.cpaDemoEnabled),
      durationMs: Number(config.cpaDemoDurationMs) || 2200,
      message: 'Preparing your reward...',
    },
    rewardPreview: {
      day: reward.day,
      title: reward.title,
      subtitle: reward.subtitle,
      displayAmount: reward.displayAmount,
    },
  };
}

/**
 * Authoritative idempotent and concurrency-safe reward claim execution.
 */
async function claimReward({
  userId,
  requestedDay = null,
  idempotencyKey = null,
  clientMeta = {},
  now,
}) {
  const nowProvider = now || (() => new Date());
  const serverNow = nowProvider();

  await logAuditEvent({
    event: 'STREAK_CLAIM_REQUEST',
    userId,
    clientMeta,
    requestedDay,
    reason: 'Claim request received',
    metadata: idempotencyKey ? { idempotencyKey } : {},
  });

  // Idempotency replay check
  if (idempotencyKey) {
    const existingIdempotentClaim = await StreakClaim.findOne({
      userId,
      idempotencyKey,
      status: 'CLAIMED',
    }).lean();

    if (existingIdempotentClaim) {
      await logAuditEvent({
        event: 'DUPLICATE_CLAIM',
        userId,
        clientMeta,
        requestedDay: existingIdempotentClaim.day,
        actualDay: existingIdempotentClaim.day,
        reason: 'Idempotent replay handled without duplicate credit',
        metadata: { idempotencyKey, claimId: existingIdempotentClaim.claimId },
      });

      const dashboard = await getStreakDashboard(userId, { now: () => serverNow, clientMeta });
      return {
        ...dashboard,
        idempotentReplay: true,
        message: `Day ${existingIdempotentClaim.day} reward already processed.`,
        claim: {
          claimId: existingIdempotentClaim.claimId,
          referenceId: existingIdempotentClaim.referenceId,
          day: existingIdempotentClaim.day,
          claimedAt: existingIdempotentClaim.claimedAt.toISOString(),
          reward: existingIdempotentClaim.rewardSnapshot,
          transactionId: existingIdempotentClaim.transactionId,
        },
      };
    }
  }

  const { config } = await getActiveConfigAndRewards();
  const { activeCycle, resetInfo } = await resolveOrInitializeActiveCycle({
    userId,
    config,
    serverNow,
    clientMeta,
  });

  const { eligibleDay, reward } = await validateClaimEligibility({
    userId,
    requestedDay,
    config,
    activeCycle,
    resetInfo,
    serverNow,
    clientMeta,
  });

  // Acquire atomic cycle-level lock so simultaneous requests cannot race.
  // Stale locks older than 30s are safely recoverable after abrupt process failures.
  const staleLockCutoff = new Date(serverNow.getTime() - 30 * 1000);
  const lockedCycle = await StreakCycle.findOneAndUpdate(
    {
      _id: activeCycle._id,
      userId,
      status: 'ACTIVE',
      nextClaimDay: eligibleDay,
      $or: [
        { claimLock: false },
        { claimLock: true, claimLockAt: { $lte: staleLockCutoff } },
      ],
    },
    { $set: { claimLock: true, claimLockAt: serverNow } },
    { new: true }
  );

  if (!lockedCycle) {
    await logAuditEvent({
      event: 'CONCURRENT_CLAIM_BLOCKED',
      userId,
      clientMeta,
      requestedDay: requestedDay || eligibleDay,
      actualDay: eligibleDay,
      reason: 'Concurrent claim attempt blocked by atomic cycle lock',
    });
    throw new AppError(
      'This reward claim is already being processed.',
      409,
      'CONCURRENT_CLAIM'
    );
  }

  let claimResult;
  try {
    claimResult = await runWithOptionalTransaction(async (session) => {
      const claimId = generateClaimId();
      const referenceId = generateReferenceId();

      const [createdClaim] = await StreakClaim.create(
        [
          {
            claimId,
            referenceId,
            userId,
            cycleId: lockedCycle._id,
            cycleCode: lockedCycle.cycleId,
            day: eligibleDay,
            rewardId: reward._id,
            rewardSnapshot: {
              rewardType: reward.rewardType,
              currency: reward.currency,
              amount: reward.amount,
              title: reward.title,
              subtitle: reward.subtitle,
            },
            status: 'CLAIMED',
            idempotencyKey: idempotencyKey || null,
            claimedAt: serverNow,
          },
        ],
        session ? { session } : {}
      );

      const { wallet, balanceBefore, balanceAfter, voucher } =
        await creditRewardToWallet({
          userId,
          reward,
          claimId,
          referenceId,
          creditedAt: serverNow,
          session,
        });

      const transaction = await recordRewardTransaction({
        userId,
        walletId: wallet._id,
        claimId,
        reward,
        streakDay: eligibleDay,
        referenceId,
        balanceBefore,
        balanceAfter,
        voucher,
        session,
      });

      createdClaim.transactionId = transaction.transactionId;
      await createdClaim.save(session ? { session } : {});

      const { nextClaimAt, expiresAt } = calculateNextTimestamps(serverNow, config);
      const nextDay =
        eligibleDay >= config.totalDays ? config.totalDays + 1 : eligibleDay + 1;

      await StreakCycle.updateOne(
        { _id: lockedCycle._id },
        {
          $set: {
            currentStreak: eligibleDay,
            nextClaimDay: nextDay,
            lastClaimAt: serverNow,
            nextClaimAt,
            expiresAt,
            claimLock: false,
            claimLockAt: null,
          },
        },
        session ? { session } : {}
      );

      await logAuditEvent({
        event: 'STREAK_CLAIM_SUCCESS',
        userId,
        clientMeta,
        requestedDay: requestedDay || eligibleDay,
        actualDay: eligibleDay,
        reason: `Day ${eligibleDay} reward claimed successfully`,
        metadata: {
          claimId,
          referenceId,
          transactionId: transaction.transactionId,
          amount: reward.amount,
          currency: reward.currency,
        },
        session,
      });

      return {
        claim: createdClaim,
        transaction,
        voucher,
      };
    });
  } catch (err) {
    if (err && err.code === 11000) {
      await logAuditEvent({
        event: 'DUPLICATE_CLAIM',
        userId,
        clientMeta,
        requestedDay: requestedDay || eligibleDay,
        actualDay: eligibleDay,
        reason: 'Duplicate claim prevented by unique database constraint',
      });
      throw new AppError(
        'This reward has already been claimed.',
        409,
        'ALREADY_CLAIMED'
      );
    }
    throw err;
  } finally {
    await StreakCycle.updateOne(
      { _id: lockedCycle._id },
      { $set: { claimLock: false, claimLockAt: null } }
    ).catch(() => {});
  }

  const freshDashboard = await getStreakDashboard(userId, {
    now: () => serverNow,
    clientMeta,
  });

  return {
    ...freshDashboard,
    idempotentReplay: false,
    message: `Day ${eligibleDay} reward claimed successfully!`,
    claim: {
      claimId: claimResult.claim.claimId,
      referenceId: claimResult.claim.referenceId,
      day: claimResult.claim.day,
      claimedAt: claimResult.claim.claimedAt.toISOString(),
      reward: claimResult.claim.rewardSnapshot,
      transactionId: claimResult.transaction.transactionId,
      voucher: claimResult.voucher,
    },
    transaction: {
      transactionId: claimResult.transaction.transactionId,
      amount: claimResult.transaction.amount,
      currency: claimResult.transaction.currency,
      rewardType: claimResult.transaction.rewardType,
      balanceBefore: claimResult.transaction.balanceBefore,
      balanceAfter: claimResult.transaction.balanceAfter,
      referenceId: claimResult.transaction.referenceId,
      createdAt: claimResult.transaction.createdAt,
    },
  };
}

/**
 * Retrieves claim history and cycle summaries for the authenticated user.
 */
async function getClaimHistory(userId, { page = 1, limit = 20 } = {}) {
  const safePage = Math.max(Number(page) || 1, 1);
  const safeLimit = Math.min(Math.max(Number(limit) || 20, 1), 100);
  const skip = (safePage - 1) * safeLimit;

  const [claims, totalClaims, cycles] = await Promise.all([
    StreakClaim.find({ userId })
      .sort({ claimedAt: -1 })
      .skip(skip)
      .limit(safeLimit)
      .lean(),
    StreakClaim.countDocuments({ userId }),
    StreakCycle.find({ userId }).sort({ cycleNumber: -1 }).limit(10).lean(),
  ]);

  return {
    success: true,
    serverTime: new Date().toISOString(),
    claims,
    cycles,
    pagination: {
      page: safePage,
      limit: safeLimit,
      total: totalClaims,
      totalPages: Math.max(Math.ceil(totalClaims / safeLimit), 1),
    },
  };
}

module.exports = {
  calculateNextTimestamps,
  resolveOrInitializeActiveCycle,
  getStreakDashboard,
  getStreakStatus,
  initiateClaim,
  claimReward,
  getClaimHistory,
};

