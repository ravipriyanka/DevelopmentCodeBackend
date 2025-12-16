const express = require('express');
const router = express.Router();
const { sendNotification } = require('../controllers/notificationController'); // <- go up one level

router.post('/notifications', sendNotification);

module.exports = router;
