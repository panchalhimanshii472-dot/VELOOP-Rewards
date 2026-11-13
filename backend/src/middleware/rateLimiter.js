const rateLimit = require('express-rate-limit');
const env = require('../config/env');

/**
 * Safely resolves the client IP address behind reverse proxies (e.g., Render, Vercel, Cloudflare).
 * When trust proxy is active, the first (leftmost) IP in X-Forwarded-For is the real client IP.
 */
function getClientIp(req) {
  const xff = req.headers && req.headers['x-forwarded-for'];
  if (xff && typeof xff === 'string') {
    const firstIp = xff.split(',')[0].trim();
    if (firstIp) return firstIp;
  }
  return req.ip || (req.socket && req.socket.remoteAddress) || '127.0.0.1';
}

/**
 * Global API rate limiter for standard routes.
 * Skips:
 * 1. OPTIONS preflight requests (CORS).
 * 2. Localhost requests during local development.
 * 3. /health check endpoint (Render uptime monitors / load balancers).
 * 4. /auth/login & /auth/register (protected by dedicated authLimiter).
 */
const apiLimiter = rateLimit({
  windowMs: env.rateLimitWindowMs,
  max: env.rateLimitMaxRequests,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  validate: { trustProxy: false, xForwardedForHeader: false },
  keyGenerator: getClientIp,
  skip: (req) => {
    if (req.method === 'OPTIONS') return true;

    // Never throttle localhost in local development
    if (env.nodeEnv !== 'production') {
      const ip = getClientIp(req);
      if (ip === '127.0.0.1' || ip === '::1' || ip === '::ffff:127.0.0.1' || ip === 'localhost') {
        return true;
      }
    }

    const url = req.originalUrl || req.url || '';
    if (url.includes('/health') || req.path === '/health') return true;
    if (url.includes('/auth/login') || url.includes('/auth/register')) return true;
    return false;
  },
  handler: (req, res, _next, options) => {
    res.status(options.statusCode || 429).json({
      success: false,
      code: 'RATE_LIMITED',
      message: 'Too many requests. Please slow down and try again shortly.',
      retryAfterMinutes: Math.ceil(options.windowMs / 60000),
      serverTime: new Date().toISOString(),
    });
  },
});

/**
 * Dedicated authentication limiter for login and registration.
 * Allows failed attempts per 15 minutes per IP.
 * Crucially: skipSuccessfulRequests is true so legitimate logins NEVER count towards the limit.
 */
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: env.authRateLimitMax || 20,
  skipSuccessfulRequests: true,
  skipFailedRequests: false,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  validate: { trustProxy: false, xForwardedForHeader: false },
  keyGenerator: getClientIp,
  handler: (req, res, _next, options) => {
    res.status(options.statusCode || 429).json({
      success: false,
      code: 'AUTH_RATE_LIMITED',
      message: 'Too many failed login attempts. Please wait 15 minutes before trying again.',
      retryAfterMinutes: Math.ceil(options.windowMs / 60000),
      serverTime: new Date().toISOString(),
    });
  },
});

/**
 * Dedicated rate limiter for daily streak claims to prevent rapid click flooding.
 */
const claimLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: env.claimRateLimitMax,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  validate: { trustProxy: false, xForwardedForHeader: false },
  keyGenerator: getClientIp,
  handler: (req, res, _next, options) => {
    res.status(options.statusCode || 429).json({
      success: false,
      code: 'CLAIM_RATE_LIMITED',
      message: 'Too many claim requests. Please wait a moment and try again.',
      retryAfterMinutes: 1,
      serverTime: new Date().toISOString(),
    });
  },
});

module.exports = {
  getClientIp,
  apiLimiter,
  authLimiter,
  claimLimiter,
};
