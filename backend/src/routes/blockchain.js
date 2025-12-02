const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth');
const {
  getStudentRecord,
  getTranscriptHash,
  getCertificateHash,
  getBlockchainHashes
} = require('../controllers/blockchainController');

router.use(authenticate);

router.get('/student/:studentId', getStudentRecord);
router.get('/transcript/:transcriptId', getTranscriptHash);
router.get('/certificate/:certificateId', getCertificateHash);
router.get('/hashes', getBlockchainHashes);

module.exports = router;


