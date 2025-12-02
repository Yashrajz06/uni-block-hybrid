const mongoose = require('mongoose');

const accessLogSchema = new mongoose.Schema({
  resourceType: {
    type: String,
    enum: ['transcript', 'certificate', 'record'],
    required: true
  },
  resourceId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true
  },
  accessedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  accessType: {
    type: String,
    enum: ['view', 'download', 'verify', 'grant', 'revoke'],
    required: true
  },
  ipAddress: {
    type: String,
    default: null
  },
  userAgent: {
    type: String,
    default: null
  },
  timestamp: {
    type: Date,
    default: Date.now
  },
  success: {
    type: Boolean,
    default: true
  },
  reason: {
    type: String,
    default: null
  }
});

module.exports = mongoose.model('AccessLog', accessLogSchema);


