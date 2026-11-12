const asyncHandler = require('../utils/asyncHandler');
const walletService = require('../services/wallet.service');
const transactionService = require('../services/transaction.service');
const auditService = require('../services/audit.service');

const getWallet = asyncHandler(async (req, res) => {
  const [walletDoc, transactions] = await Promise.all([
    walletService.getOrCreateWallet(req.user.id),
    transactionService.getUserTransactions(req.user.id, {
      page: req.query.page,
      limit: req.query.limit,
    }),
  ]);

  res.status(200).json({
    success: true,
    serverTime: new Date().toISOString(),
    wallet: walletService.formatWalletSummary(walletDoc),
    transactions: transactions.items,
    pagination: transactions.pagination,
  });
});

const getTransactions = asyncHandler(async (req, res) => {
  const result = await transactionService.getUserTransactions(req.user.id, {
    page: req.query.page,
    limit: req.query.limit,
  });

  res.status(200).json({
    success: true,
    serverTime: new Date().toISOString(),
    transactions: result.items,
    pagination: result.pagination,
  });
});

const getAuditLogs = asyncHandler(async (req, res) => {
  const logs = await auditService.getUserAuditLogs(req.user.id, req.query.limit);
  res.status(200).json({
    success: true,
    serverTime: new Date().toISOString(),
    logs,
  });
});

module.exports = {
  getWallet,
  getTransactions,
  getAuditLogs,
};

