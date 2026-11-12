const asyncHandler = require('../utils/asyncHandler');
const AppError = require('../utils/appError');
const streakService = require('../services/streak.service');
const { logAuditEvent } = require('../services/audit.service');
const { inspectClaimPayloadForTampering } = require('../validators/streakValidator');

const getDailyStreak = asyncHandler(async (req, res) => {
  // Explicitly ignore any ?day= or ?userId= query attempts (Section 31)
  if (req.query && req.query.userId && String(req.query.userId) !== req.user.id) {
    await logAuditEvent({
      event: 'CROSS_USER_ATTEMPT',
      userId: req.user.id,
      clientMeta: req.clientMeta,
      reason: 'Cross-user query parameter ignored/rejected on GET /daily-streak',
      metadata: { attemptedUserId: req.query.userId },
    });
    throw new AppError('Unauthorized user identity manipulation is prohibited.', 403, 'FORBIDDEN_OWNERSHIP');
  }

  const data = await streakService.getStreakDashboard(req.user.id, {
    clientMeta: req.clientMeta,
  });
  res.status(200).json(data);
});

const getDailyStreakStatus = asyncHandler(async (req, res) => {
  const data = await streakService.getStreakStatus(req.user.id, {
    clientMeta: req.clientMeta,
  });
  res.status(200).json(data);
});

async function assertCleanClaimRequest(req) {
  const inspection = inspectClaimPayloadForTampering(req.body, req.query, req.user.id);
  if (inspection.tampered) {
    await logAuditEvent({
      event: inspection.event,
      userId: req.user.id,
      clientMeta: req.clientMeta,
      requestedDay: req.body && req.body.day ? Number(req.body.day) : null,
      reason: inspection.message,
      metadata: { attemptedFields: inspection.attemptedFields },
    });
    throw new AppError(inspection.message, inspection.statusCode, inspection.code);
  }
  return inspection.requestedDay;
}

const initiateDailyClaim = asyncHandler(async (req, res) => {
  const requestedDay = await assertCleanClaimRequest(req);
  const data = await streakService.initiateClaim({
    userId: req.user.id,
    requestedDay,
    clientMeta: req.clientMeta,
  });
  res.status(200).json(data);
});

const claimDailyReward = asyncHandler(async (req, res) => {
  const requestedDay = await assertCleanClaimRequest(req);
  const rawKey = req.headers['idempotency-key'];
  const idempotencyKey =
    typeof rawKey === 'string' && rawKey.trim().length > 0 ? rawKey.trim().slice(0, 128) : null;

  const data = await streakService.claimReward({
    userId: req.user.id,
    requestedDay,
    idempotencyKey,
    clientMeta: req.clientMeta,
  });

  res.status(200).json(data);
});

const getDailyStreakHistory = asyncHandler(async (req, res) => {
  const data = await streakService.getClaimHistory(req.user.id, {
    page: req.query.page,
    limit: req.query.limit,
  });
  res.status(200).json(data);
});

module.exports = {
  getDailyStreak,
  getDailyStreakStatus,
  initiateDailyClaim,
  claimDailyReward,
  getDailyStreakHistory,
};

