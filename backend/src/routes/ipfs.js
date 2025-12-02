const express = require('express');
const router = express.Router();
const {
  uploadFile,
  retrieveFile,
  getIPFSReference,
  verifyHash
} = require('../controllers/ipfsController');
const { authenticate } = require('../middleware/auth');

router.post('/upload', uploadFile);
router.get('/:ipfsHash', retrieveFile);
router.get('/reference/:ipfsHash', authenticate, getIPFSReference);
router.post('/verify', authenticate, verifyHash);

module.exports = router;


