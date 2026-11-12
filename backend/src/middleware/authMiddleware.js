const jwt = require('jsonwebtoken');
const env = require('../config/env');
const User = require('../models/User');
const AppError = require('../utils/appError');

/**
 * Extracts and verifies JWT Bearer token. Never reads user identity from body/query/params.
 */
async function authenticate(req, _res, next) {
  try {
    const authHeader = req.headers.authorization || '';
    if (!authHeader.startsWith('Bearer ')) {
      throw new AppError('Please log in to continue.', 401, 'UNAUTHORIZED');
    }

    const token = authHeader.slice(7).trim();
    if (!token) {
      throw new AppError('Please log in to continue.', 401, 'UNAUTHORIZED');
    }

    let decoded;
    try {
      decoded = jwt.verify(token, env.jwtSecret);
    } catch {
      throw new AppError('Session expired or invalid. Please log in again.', 401, 'INVALID_TOKEN');
    }

    const user = await User.findById(decoded.sub).select('name email role isActive').lean();
    if (!user || !user.isActive) {
      throw new AppError('Please log in to continue.', 401, 'UNAUTHORIZED');
    }

    req.user = {
      id: String(user._id),
      name: user.name,
      email: user.email,
      role: user.role,
    };

    req.clientMeta = {
      ipAddress:
        (req.headers['x-forwarded-for'] && String(req.headers['x-forwarded-for']).split(',')[0].trim()) ||
        req.ip ||
        null,
      userAgent: req.headers['user-agent'] || null,
    };

    next();
  } catch (err) {
    next(err);
  }
}

module.exports = {
  authenticate,
};

