const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth');
const {
  getNotifications,
  createNotification,
  markAsRead,
  markAllAsRead
} = require('../controllers/notificationController');

router.use(authenticate);

router.get('/', getNotifications);
router.post('/', createNotification);
router.post('/:id/read', markAsRead);
router.post('/read-all', markAllAsRead);

module.exports = router;
