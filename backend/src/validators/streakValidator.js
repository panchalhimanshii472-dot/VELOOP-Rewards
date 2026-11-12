const AppError = require('../utils/appError');

const OWNERSHIP_FIELDS = ['userId', 'user', 'ownerId', 'accountId', 'targetUserId'];
const FORBIDDEN_REWARD_OR_STREAK_FIELDS = [
  'reward',
  'rewardId',
  'rewardType',
  'rewardAmount',
  'amount',
  'currency',
  'streak',
  'currentStreak',
  'currentDay',
  'status',
  'claimedAt',
  'nextClaimAt',
  'expiresAt',
  'veBalance',
  'balance',
];

/**
 * Inspects request body/query for client-side tampering attempts (cross-user
 * ownership injection or client-supplied reward/streak fields).
 */
function inspectClaimPayloadForTampering(body = {}, query = {}, authenticatedUserId) {
  const bodyObj = body && typeof body === 'object' ? body : {};
  const queryObj = query && typeof query === 'object' ? query : {};

  for (const field of OWNERSHIP_FIELDS) {
    const bodyVal = bodyObj[field];
    const queryVal = queryObj[field];
    const candidate = bodyVal !== undefined ? bodyVal : queryVal;
    if (candidate !== undefined && String(candidate) !== String(authenticatedUserId)) {
      return {
        tampered: true,
        event: 'CROSS_USER_ATTEMPT',
        statusCode: 403,
        code: 'FORBIDDEN_OWNERSHIP',
        message: 'Unauthorized user identity manipulation is prohibited.',
        attemptedFields: { [field]: candidate },
      };
    }
    if (candidate !== undefined) {
      return {
        tampered: true,
        event: 'INVALID_CLAIM',
        statusCode: 400,
        code: 'CLIENT_USER_ID_FORBIDDEN',
        message: 'User identity is derived exclusively from your authenticated session.',
        attemptedFields: { [field]: candidate },
      };
    }
  }

  const tamperedRewardFields = {};
  for (const field of FORBIDDEN_REWARD_OR_STREAK_FIELDS) {
    if (Object.prototype.hasOwnProperty.call(bodyObj, field)) {
      tamperedRewardFields[field] = bodyObj[field];
    }
  }

  if (Object.keys(tamperedRewardFields).length > 0) {
    return {
      tampered: true,
      event: 'INVALID_CLAIM',
      statusCode: 400,
      code: 'TAMPERED_CLAIM_PAYLOAD',
      message: 'Reward values, currency, and streak fields cannot be supplied by the client.',
      attemptedFields: tamperedRewardFields,
    };
  }

  let requestedDay = null;
  if (Object.prototype.hasOwnProperty.call(bodyObj, 'day') && bodyObj.day !== undefined && bodyObj.day !== null) {
    const parsed = Number(bodyObj.day);
    if (!Number.isInteger(parsed) || parsed < 1) {
      throw new AppError('Invalid reward day requested.', 400, 'INVALID_DAY');
    }
    requestedDay = parsed;
  }

  return {
    tampered: false,
    requestedDay,
  };
}

module.exports = {
  inspectClaimPayloadForTampering,
};

