const mongoose = require('mongoose');

const certificateSchema = new mongoose.Schema({
  studentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Student',
    required: true
  },
  certificateId: {
    type: String,
    required: true,
    unique: true
  },
  type: {
    type: String,
    enum: ['degree', 'diploma', 'certificate', 'achievement'],
    required: true
  },
  title: {
    type: String,
    required: true
  },
  description: {
    type: String,
    default: ''
  },
  issuedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  issuedDate: {
    type: Date,
    default: Date.now
  },
  ipfsHash: {
    type: String,
    default: null
  },
  blockchainHash: {
    type: String,
    default: null
  },
  blockchainTxHash: {
    type: String,
    default: null
  },
  qrCode: {
    type: String,
    default: null
  },
  blsSignature: {
    type: String,
    default: null
  },
  accessList: [{
    verifierId: String,
    grantedAt: Date,
    revokedAt: Date,
    isActive: Boolean
  }],
  isRevoked: {
    type: Boolean,
    default: false
  },
  revokedAt: {
    type: Date,
    default: null
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Certificate', certificateSchema);


