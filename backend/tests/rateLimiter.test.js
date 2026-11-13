const test = require('node:test');
const assert = require('node:assert/strict');
const { getClientIp } = require('../src/middleware/rateLimiter');

test('getClientIp extracts leftmost client IP from X-Forwarded-For header', () => {
  const req = {
    headers: {
      'x-forwarded-for': '203.0.113.195, 10.0.0.1, 192.168.1.1',
    },
  };
  assert.equal(getClientIp(req), '203.0.113.195');
});

test('getClientIp trims whitespace around forwarded IP', () => {
  const req = {
    headers: {
      'x-forwarded-for': '  198.51.100.24  , 10.1.2.3',
    },
  };
  assert.equal(getClientIp(req), '198.51.100.24');
});

test('getClientIp falls back to req.ip when header is missing', () => {
  const req = {
    headers: {},
    ip: '192.0.2.1',
  };
  assert.equal(getClientIp(req), '192.0.2.1');
});

test('getClientIp falls back to 127.0.0.1 when no IP is available', () => {
  const req = {
    headers: {},
  };
  assert.equal(getClientIp(req), '127.0.0.1');
});

