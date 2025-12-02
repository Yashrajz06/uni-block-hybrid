const express = require('express');
const router = express.Router();
const { authenticate, authorize } = require('../middleware/auth');
const {
  getProfile,
  getAcademicHistory,
  requestTranscript,
  getTranscripts,
  getCertificates,
  downloadCredential,
  grantAccess,
  revokeAccess
} = require('../controllers/studentController');

router.use(authenticate);
router.use(authorize('student'));

router.get('/profile', getProfile);
router.get('/academic-history', getAcademicHistory);
router.post('/transcript/request', requestTranscript);
router.get('/transcripts', getTranscripts);
router.get('/certificates', getCertificates);
router.get('/credential/:type/:id', downloadCredential);
router.post('/access/grant', grantAccess);
router.post('/access/revoke', revokeAccess);

module.exports = router;


