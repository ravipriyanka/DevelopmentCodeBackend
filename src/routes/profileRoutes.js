const express = require('express');
const profileController = require('../controllers/profileController');
const { authenticate } = require('../middleware/authMiddleware');

const router = express.Router();

// All profile routes require authentication
router.use(authenticate);


// ==================== PROFILE ROUTES ====================

// Get profile
// GET /api/profile
router.get('/', profileController.getProfile);

// Update profile
// PUT /api/profile
router.put('/', profileController.updateProfile);

// Update email
// PUT /api/profile/email
router.put('/email', profileController.updateEmail);

// Update phone
// PUT /api/profile/phone
router.put('/phone', profileController.updatePhone);

// Delete account
// DELETE /api/profile
router.delete('/', profileController.deleteAccount);


// ==================== SETTINGS ROUTES ====================

// Get settings
// GET /api/profile/settings
router.get('/settings', profileController.getSettings);

// Update settings
// PUT /api/profile/settings
router.put('/settings', profileController.updateSettings);


module.exports = router;

