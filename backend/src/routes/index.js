const express = require('express');
const mongoose = require('mongoose');
const authRoutes = require('./auth.routes');
const streakRoutes = require('./streak.routes');
const walletRoutes = require('./wallet.routes');

const router = express.Router();

router.get('/health', (_req, res) => {
  res.status(200).json({
    success: true,
    service: 'veloop-daily-streak-api',
    dbReady: mongoose.connection.readyState === 1,
    serverTime: new Date().toISOString(),
  });
});

router.use('/auth', authRoutes);
router.use('/daily-streak', streakRoutes);
router.use('/', walletRoutes);

module.exports = router;

