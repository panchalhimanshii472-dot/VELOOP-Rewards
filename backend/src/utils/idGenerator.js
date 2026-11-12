const crypto = require('crypto');

function randomToken(length = 8) {
  return crypto.randomBytes(Math.ceil(length / 2)).toString('hex').slice(0, length).toUpperCase();
}

function generateCycleId(cycleNumber) {
  const padded = String(cycleNumber).padStart(3, '0');
  return `CYC-${padded}-${randomToken(4)}`;
}

function generateClaimId() {
  return `CLM-${randomToken(8)}`;
}

function generateReferenceId() {
  return `STREAK-${randomToken(8)}`;
}

function generateTransactionId() {
  return `TXN-${randomToken(10)}`;
}

function generateGiftCardVoucherCode() {
  return `AMZ-VL-${randomToken(4)}-${randomToken(4)}`;
}

module.exports = {
  generateCycleId,
  generateClaimId,
  generateReferenceId,
  generateTransactionId,
  generateGiftCardVoucherCode,
};

