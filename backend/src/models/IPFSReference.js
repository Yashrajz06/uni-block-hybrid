const mongoose = require('mongoose');

const ipfsReferenceSchema = new mongoose.Schema({
  resourceType: {
    type: String,
    enum: ['transcript', 'certificate', 'document'],
    required: true
  },
  resourceId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true
  },
  ipfsHash: {
    type: String,
    required: true,
    unique: true
  },
  fileName: {
    type: String,
    required: true
  },
  fileSize: {
    type: Number,
    required: true
  },
  mimeType: {
    type: String,
    default: 'application/pdf'
  },
  uploadedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  uploadedAt: {
    type: Date,
    default: Date.now
  },
  accessCount: {
    type: Number,
    default: 0
  },
  lastAccessed: {
    type: Date,
    default: null
  }
});

module.exports = mongoose.model('IPFSReference', ipfsReferenceSchema);


