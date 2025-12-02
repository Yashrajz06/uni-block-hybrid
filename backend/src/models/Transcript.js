const mongoose = require('mongoose');

const transcriptSchema = new mongoose.Schema({
  studentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Student',
    required: true
  },
  requestId: {
    type: String,
    required: true,
    unique: true
  },
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected', 'issued'],
    default: 'pending'
  },
  requestedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  approvedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  courses: [{
    courseCode: String,
    courseName: String,
    credits: Number,
    grade: String,
    semester: Number,
    year: Number
  }],
  cgpa: {
    type: Number,
    required: true
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
  accessList: [{
    verifierId: String,
    grantedAt: Date,
    revokedAt: Date,
    isActive: Boolean
  }],
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  },
  issuedAt: {
    type: Date,
    default: null
  }
});

module.exports = mongoose.model('Transcript', transcriptSchema);


