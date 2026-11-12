const express = require('express');
const walletController = require('../controllers/wallet.controller');
const { authenticate } = require('../middleware/authMiddleware');

const router = express.Router();

router.use(authenticate);

router.get('/wallet', walletController.getWallet);
router.get('/wallet/transactions', walletController.getTransactions);
router.get('/audit-logs', walletController.getAuditLogs);

module.exports = router;

