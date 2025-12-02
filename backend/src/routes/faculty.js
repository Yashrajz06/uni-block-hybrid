const express = require('express');
const router = express.Router();
const { authenticate, authorize } = require('../middleware/auth');
const {
  getProfile,
  getPendingTranscripts,
  uploadGrade,
  uploadCourse,
  approveTranscript,
  rejectTranscript,
  getAuditLogs
} = require('../controllers/facultyController');

router.use(authenticate);
router.use(authorize('faculty', 'admin'));

router.get('/profile', getProfile);
router.get('/transcripts/pending', getPendingTranscripts);
router.post('/grade/upload', uploadGrade);
router.post('/course/upload', uploadCourse);
router.post('/transcript/approve/:requestId', approveTranscript);
router.post('/transcript/reject/:requestId', rejectTranscript);
router.get('/audit-logs', getAuditLogs);

module.exports = router;

