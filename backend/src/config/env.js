const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const NODE_ENV = process.env.NODE_ENV || 'development';

if (NODE_ENV === 'production') {
  if (!process.env.MONGO_URI) {
    throw new Error('MONGO_URI environment variable is required in production.');
  }
  if (!process.env.JWT_SECRET || process.env.JWT_SECRET.length < 16) {
    throw new Error('A strong JWT_SECRET (min 16 chars) is required in production.');
  }
}

const env = {
  nodeEnv: NODE_ENV,
  port: Number(process.env.PORT) || 5000,
  mongoUri: process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/veloop_daily_streak',
  jwtSecret: process.env.JWT_SECRET || 'veloop_dev_only_secret_change_in_env',
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '7d',
  corsOrigin: process.env.CORS_ORIGIN || 'http://localhost:5173',
  rateLimitWindowMs: Number(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000,
  rateLimitMaxRequests: Number(process.env.RATE_LIMIT_MAX_REQUESTS) || 120,
  claimRateLimitMax: Number(process.env.CLAIM_RATE_LIMIT_MAX) || 30,
};

module.exports = env;

