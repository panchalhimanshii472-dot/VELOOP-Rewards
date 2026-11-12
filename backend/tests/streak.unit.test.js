const test = require('node:test');
const assert = require('node:assert/strict');
const { inspectClaimPayloadForTampering } = require('../src/validators/streakValidator');
const {
  validateUpdateProfilePayload,
  validateChangePasswordPayload,
} = require('../src/validators/authValidator');
const { calculateNextTimestamps } = require('../src/services/streak.service');

test('inspectClaimPayloadForTampering rejects client-supplied reward/currency/streak', () => {
  const res = inspectClaimPayloadForTampering(
    { day: 2, reward: 100000, currency: 'VES' },
    {},
    '65f000000000000000000001'
  );
  assert.equal(res.tampered, true);
  assert.equal(res.event, 'INVALID_CLAIM');
  assert.equal(res.statusCode, 400);
});

test('inspectClaimPayloadForTampering rejects cross-user userId manipulation', () => {
  const res = inspectClaimPayloadForTampering(
    { userId: 'anotherUser', day: 7 },
    {},
    '65f000000000000000000001'
  );
  assert.equal(res.tampered, true);
  assert.equal(res.event, 'CROSS_USER_ATTEMPT');
  assert.equal(res.statusCode, 403);
});

test('inspectClaimPayloadForTampering allows minimal valid day payload', () => {
  const res = inspectClaimPayloadForTampering(
    { day: 2 },
    {},
    '65f000000000000000000001'
  );
  assert.equal(res.tampered, false);
  assert.equal(res.requestedDay, 2);
});

test('calculateNextTimestamps derives unlock and expiry from DB config values', () => {
  const claimDate = new Date('2026-09-05T12:00:00.000Z');
  const { nextClaimAt, expiresAt } = calculateNextTimestamps(claimDate, {
    claimCooldownMinutes: 1440,
    claimWindowMinutes: 1440,
  });

  assert.equal(nextClaimAt.toISOString(), '2026-09-06T12:00:00.000Z');
  assert.equal(expiresAt.toISOString(), '2026-09-07T12:00:00.000Z');
});

test('validateUpdateProfilePayload rejects protected fields and trims valid name', () => {
  assert.throws(
    () => validateUpdateProfilePayload({ name: 'Hacker', role: 'ADMIN' }),
    /cannot be modified/
  );
  const clean = validateUpdateProfilePayload({ name: '  Aarav Mehta  ' });
  assert.equal(clean.name, 'Aarav Mehta');
});

test('validateChangePasswordPayload enforces different new password >= 6 chars', () => {
  assert.throws(
    () => validateChangePasswordPayload({ currentPassword: 'secret', newPassword: 'secret' }),
    /must be different/
  );
  const valid = validateChangePasswordPayload({
    currentPassword: 'oldPassword1',
    newPassword: 'newPassword2',
  });
  assert.equal(valid.newPassword, 'newPassword2');
});

