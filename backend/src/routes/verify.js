const express = require('express');
const router = express.Router();
const {
  verifyByQR,
  verifyById,
  getVerificationHistory,
  getVerificationStats
} = require('../controllers/verifyController');

router.post('/qr', verifyByQR);
router.post('/:type/:id', verifyById);
router.get('/history/:credentialId', getVerificationHistory);
router.get('/stats', getVerificationStats);

module.exports = router;


