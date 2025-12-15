const express = require('express');
const authController = require('../controllers/authController');
const { authenticate } = require('../middleware/authMiddleware');

const router = express.Router();


// ==================== PUBLIC ROUTES ====================

// Register with email
// POST /api/auth/register/email
router.post('/register/email', authController.registerWithEmail);

// Login with email
// POST /api/auth/login/email
router.post('/login/email', authController.loginWithEmail);

// Send OTP to phone
// POST /api/auth/send-otp
router.post('/send-otp', authController.sendOtp);

// Verify OTP / Phone login
// POST /api/auth/verify-otp
router.post('/verify-otp', authController.verifyOtp);

// Forgot password
// POST /api/auth/forgot-password
router.post('/forgot-password', authController.forgotPassword);


// ==================== PROTECTED ROUTES ====================

// Resend verification email
// POST /api/auth/resend-verification
router.post('/resend-verification', authenticate, authController.resendVerification);

// Logout
// POST /api/auth/logout
router.post('/logout', authenticate, authController.logout);

// Get current user
// GET /api/auth/me
router.get('/me', authenticate, authController.getCurrentUser);

module.exports = router;








