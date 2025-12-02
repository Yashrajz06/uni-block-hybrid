const express = require('express');
const router = express.Router();
const { authenticate, authorize } = require('../middleware/auth');
const {
  getProfile,
  getPendingTranscripts,
  getStudentCourses,
  issueCertificate,
  issueTranscript,
  getAuditLogs,
  manageUsers,
  getAnalyticsOverview,
  getVerificationStats
} = require('../controllers/adminController');

router.use(authenticate);
router.use(authorize('admin'));

router.get('/profile', getProfile);
router.get('/transcripts/pending', getPendingTranscripts);
router.get('/student/:studentId/courses', getStudentCourses);
router.post('/certificate/issue', issueCertificate);
router.post('/transcript/issue', issueTranscript);
router.get('/audit-logs', getAuditLogs);
router.post('/users/manage', manageUsers);
router.get('/analytics/overview', getAnalyticsOverview);
router.get('/analytics/verification', getVerificationStats);

module.exports = router;

