const express = require('express');
const router = express.Router();
const notificationController = require('../controllers/notification.controller');

// GET /v1/notifications?scope=student|institution|branch|admin&studentId=...&institutionId=...&branchId=...&institutionAdminId=...&page=1&limit=20&unread=true
router.get('/', notificationController.list);

// POST /v1/notifications
router.post('/', notificationController.create);

// POST /v1/notifications/read
router.post('/read', notificationController.markRead);

// DELETE /v1/notifications
router.delete('/', notificationController.remove);

module.exports = router; 