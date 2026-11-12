const mongoose = require('mongoose');

const auditLogSchema = new mongoose.Schema(
  {
    event: {
      type: String,
      enum: [
        'AUTH_REGISTER',
        'AUTH_LOGIN',
        'AUTH_LOGIN_FAILED',
        'STREAK_STATUS_CHECK',
        'STREAK_CLAIM_REQUEST',
        'STREAK_CLAIM_SUCCESS',
        'STREAK_CLAIM_REJECTED',
        'STREAK_RESET',
        'DUPLICATE_CLAIM',
        'INVALID_CLAIM',
        'CONCURRENT_CLAIM_BLOCKED',
        'CROSS_USER_ATTEMPT',
        'PROFILE_UPDATED',
        'PASSWORD_CHANGED',
      ],
      required: true,
      index: true,
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
      index: true,
    },
    ipAddress: {
      type: String,
      default: null,
    },
    userAgent: {
      type: String,
      default: null,
    },
    requestedDay: {
      type: Number,
      default: null,
    },
    actualDay: {
      type: Number,
      default: null,
    },
    reason: {
      type: String,
      default: null,
    },
    metadata: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
  },
  {
    timestamps: { createdAt: true, updatedAt: false },
  }
);

auditLogSchema.index({ userId: 1, createdAt: -1 });
auditLogSchema.index({ event: 1, createdAt: -1 });

module.exports = mongoose.model('AuditLog', auditLogSchema);

