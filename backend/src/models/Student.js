const mongoose = require('mongoose');

const studentSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true
  },
  studentId: {
    type: String,
    required: true,
    unique: true
  },
  firstName: {
    type: String,
    required: true
  },
  lastName: {
    type: String,
    required: true
  },
  dateOfBirth: {
    type: Date,
    required: true
  },
  enrollmentDate: {
    type: Date,
    required: true
  },
  department: {
    type: String,
    required: true
  },
  program: {
    type: String,
    required: true
  },
  currentSemester: {
    type: Number,
    default: 1
  },
  cgpa: {
    type: Number,
    default: 0
  },
  blockchainHash: {
    type: String,
    default: null
  },
  attributes: {
    type: Map,
    of: String,
    default: {}
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

module.exports = mongoose.model('Student', studentSchema);


