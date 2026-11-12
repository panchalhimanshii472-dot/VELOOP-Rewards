const express = require('express');
const streakController = require('../controllers/streak.controller');
const { authenticate } = require('../middleware/authMiddleware');
const { claimLimiter } = require('../middleware/rateLimiter');

const router = express.Router();

router.use(authenticate);

router.get('/', streakController.getDailyStreak);
router.get('/status', streakController.getDailyStreakStatus);
router.post('/claim/initiate', claimLimiter, streakController.initiateDailyClaim);
router.post('/claim', claimLimiter, streakController.claimDailyReward);
router.get('/history', streakController.getDailyStreakHistory);

module.exports = router;

