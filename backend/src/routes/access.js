const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth');
const {
  checkAccess,
  evaluatePolicy,
  getAccessLogs
} = require('../controllers/accessController');

router.use(authenticate);

router.post('/check', checkAccess);
router.post('/policy/evaluate', evaluatePolicy);
router.get('/logs', getAccessLogs);

module.exports = router;


