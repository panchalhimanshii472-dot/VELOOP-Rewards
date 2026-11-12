/**
 * End-to-End Security & Concurrency Verification Script
 * Runs against a live MongoDB + Express instance using Node's built-in fetch.
 *
 * Usage:
 *   node tests/security.e2e.js
 */

const assert = require('node:assert/strict');
const { connectDatabase, disconnectDatabase } = require('../src/config/db');
const env = require('../src/config/env');
const { ensureDefaultStreakSetup } = require('../src/services/reward.service');
const createApp = require('../src/app');
const User = require('../src/models/User');
const Wallet = require('../src/models/Wallet');
const StreakCycle = require('../src/models/StreakCycle');
const StreakClaim = require('../src/models/StreakClaim');
const WalletTransaction = require('../src/models/WalletTransaction');
const AuditLog = require('../src/models/AuditLog');

async function request(baseUrl, path, { method = 'GET', token = null, body = null, headers = {} } = {}) {
  const res = await fetch(`${baseUrl}${path}`, {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...headers,
    },
    ...(body !== null ? { body: JSON.stringify(body) } : {}),
  });
  const data = await res.json();
  return { status: res.status, data };
}

async function runTests() {
  await connectDatabase(env.mongoUri);
  await ensureDefaultStreakSetup();

  const app = createApp();
  const server = app.listen(0);
  const { port } = server.address();
  const baseUrl = `http://127.0.0.1:${port}/api`;

  const testEmail = `e2e_${Date.now()}@velooprewards.in`;

  try {
    // 1. Unauthorized access check
    const unauth = await request(baseUrl, '/daily-streak');
    assert.equal(unauth.status, 401);

    // 2. Register fresh user
    const reg = await request(baseUrl, '/auth/register', {
      method: 'POST',
      body: { name: 'Security Tester', email: testEmail, password: 'TestPassword@123' },
    });
    assert.equal(reg.status, 201);
    const token = reg.data.token;
    assert.ok(token);

    // 3. GET initial streak state
    const initial = await request(baseUrl, '/daily-streak', { token });
    assert.equal(initial.status, 200);
    assert.equal(initial.data.streak.currentDay, 1);
    assert.equal(initial.data.streak.currentStreak, 0);
    assert.equal(initial.data.wallet.veBalance, 0);

    // 4. Anti-cheat: try jumping directly to Day 7
    const dayJump = await request(baseUrl, '/daily-streak/claim', {
      method: 'POST',
      token,
      body: { day: 7 },
    });
    assert.equal(dayJump.status, 400);

    // 5. Anti-cheat: try sending fake reward/currency
    const fakeReward = await request(baseUrl, '/daily-streak/claim', {
      method: 'POST',
      token,
      body: { day: 1, reward: 1000000, currency: 'VES' },
    });
    assert.equal(fakeReward.status, 400);

    // 6. Anti-cheat: try claiming for another userId
    const crossUser = await request(baseUrl, '/daily-streak/claim', {
      method: 'POST',
      token,
      body: { userId: 'anotherUser', day: 1 },
    });
    assert.equal(crossUser.status, 403);

    // 7. Concurrent claim test: fire two simultaneous requests for Day 1
    const [reqA, reqB] = await Promise.all([
      request(baseUrl, '/daily-streak/claim', {
        method: 'POST',
        token,
        body: { day: 1 },
        headers: { 'Idempotency-Key': 'e2e-day1-key' },
      }),
      request(baseUrl, '/daily-streak/claim', {
        method: 'POST',
        token,
        body: { day: 1 },
      }),
    ]);

    const statuses = [reqA.status, reqB.status].sort();
    assert.deepEqual(statuses, [200, 409]);

    // 7b. Idempotency replay using the winning key must not double-credit
    if (reqA.status === 200) {
      const replay = await request(baseUrl, '/daily-streak/claim', {
        method: 'POST',
        token,
        body: { day: 1 },
        headers: { 'Idempotency-Key': 'e2e-day1-key' },
      });
      assert.equal(replay.status, 200);
      assert.equal(replay.data.idempotentReplay, true);
    }

    const afterDay1 = await request(baseUrl, '/daily-streak', { token });
    assert.equal(afterDay1.data.wallet.veBalance, 5, 'Wallet must only credit +5 VEs once');
    assert.equal(afterDay1.data.streak.currentStreak, 1);
    assert.equal(afterDay1.data.streak.canClaim, false);

    // 8. Locked Day 2 claim must be rejected
    const lockedClaim = await request(baseUrl, '/daily-streak/claim', {
      method: 'POST',
      token,
      body: { day: 2 },
    });
    assert.equal(lockedClaim.status, 409);

    // 9. Missed streak simulation (> 48h elapsed)
    const userDoc = await User.findOne({ email: testEmail });
    await StreakCycle.updateOne(
      { userId: userDoc._id, status: 'ACTIVE' },
      {
        $set: {
          lastClaimAt: new Date(Date.now() - 50 * 60 * 60 * 1000),
          nextClaimAt: new Date(Date.now() - 26 * 60 * 60 * 1000),
          expiresAt: new Date(Date.now() - 2 * 60 * 60 * 1000),
        },
      }
    );

    const afterMissed = await request(baseUrl, '/daily-streak', { token });
    assert.equal(afterMissed.status, 200);
    assert.equal(afterMissed.data.streakResetInfo.wasReset, true);
    assert.equal(afterMissed.data.streak.currentStreak, 0);
    assert.equal(afterMissed.data.streak.currentDay, 1);

    // 10. Profile update & password change checks
    const badProfile = await request(baseUrl, '/auth/profile', {
      method: 'PATCH',
      token,
      body: { name: 'Tester', role: 'ADMIN' },
    });
    assert.equal(badProfile.status, 400);

    const goodProfile = await request(baseUrl, '/auth/profile', {
      method: 'PATCH',
      token,
      body: { name: 'Verified Tester' },
    });
    assert.equal(goodProfile.status, 200);
    assert.equal(goodProfile.data.user.name, 'Verified Tester');

    const pwChange = await request(baseUrl, '/auth/change-password', {
      method: 'POST',
      token,
      body: { currentPassword: 'TestPassword@123', newPassword: 'NewPassword@456' },
    });
    assert.equal(pwChange.status, 200);

    const reLogin = await request(baseUrl, '/auth/login', {
      method: 'POST',
      body: { email: testEmail, password: 'NewPassword@456' },
    });
    assert.equal(reLogin.status, 200);

    console.log('ALL E2E SECURITY & CONCURRENCY TESTS PASSED!');
  } finally {
    const userToClean = await User.findOne({ email: testEmail }).lean().catch(() => null);
    if (userToClean) {
      await Promise.all([
        Wallet.deleteMany({ userId: userToClean._id }),
        StreakCycle.deleteMany({ userId: userToClean._id }),
        StreakClaim.deleteMany({ userId: userToClean._id }),
        WalletTransaction.deleteMany({ userId: userToClean._id }),
        AuditLog.deleteMany({ userId: userToClean._id }),
        User.deleteOne({ _id: userToClean._id }),
      ]).catch(() => {});
    }
    server.close();
    await disconnectDatabase();
  }
}

runTests().catch((err) => {
  console.error('Security E2E test failed:', err);
  process.exit(1);
});

