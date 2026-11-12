const AuditLog = require('../models/AuditLog');

/**
 * Persists a security or streak lifecycle audit event without interrupting
 * main execution if audit persistence encounters a transient error.
 */
async function logAuditEvent({
  event,
  userId = null,
  clientMeta = {},
  requestedDay = null,
  actualDay = null,
  reason = null,
  metadata = {},
  session = null,
}) {
  try {
    const doc = {
      event,
      userId,
      ipAddress: clientMeta.ipAddress || null,
      userAgent: clientMeta.userAgent || null,
      requestedDay,
      actualDay,
      reason,
      metadata,
    };

    if (session) {
      await AuditLog.create([doc], { session });
    } else {
      await AuditLog.create(doc);
    }
  } catch {
    // Audit logging should not mask primary domain error responses.
  }
}

async function getUserAuditLogs(userId, limit = 30) {
  return AuditLog.find({ userId })
    .sort({ createdAt: -1 })
    .limit(Math.min(Math.max(Number(limit) || 30, 1), 100))
    .lean();
}

module.exports = {
  logAuditEvent,
  getUserAuditLogs,
};

