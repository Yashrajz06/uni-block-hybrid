const mongoose = require('mongoose');

const blockchainHashSchema = new mongoose.Schema({
  resourceType: {
    type: String,
    enum: ['student', 'faculty', 'transcript', 'certificate'],
    required: true
  },
  resourceId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true
  },
  chainType: {
    type: String,
    enum: ['student', 'faculty', 'institutional'],
    required: true
  },
  hash: {
    type: String,
    required: true,
    unique: true
  },
  transactionHash: {
    type: String,
    required: true
  },
  blockNumber: {
    type: Number,
    default: null
  },
  contractAddress: {
    type: String,
    required: true
  },
  timestamp: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('BlockchainHash', blockchainHashSchema);


