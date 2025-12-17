const express = require('express');
const authController = require('../controllers/authController');
const { authenticate } = require('../middleware/authMiddleware');

const router = express.Router();

// ==================== PUBLIC ROUTES ====================

// Register with email
// POST /api/auth/register/email
router.post('/register/email', authController.registerWithEmail);

// Register with phone
// POST /api/auth/register/phone
router.post('/register/phone', authController.registerWithPhone);

// Login with email
// POST /api/auth/login/email
router.post('/login/email', authController.loginWithEmail);

// Send OTP to phone (Firebase phone flow info)
router.post('/send-otp', authController.sendOtp);

// Verify OTP / Phone login (Firebase phone flow)
router.post('/verify-otp', authController.verifyOtp);

// Forgot password (send OTP via Nodemailer)
router.post('/forgot-password', authController.forgotPassword);

// Reset password (verify OTP)
router.post('/reset-password', authController.resetPassword);

// Send email OTP (manual)
router.post('/send-email-otp', authController.sendEmailOtp);

// Verify email OTP
router.post('/verify-email-otp', authController.verifyEmailOtp);

// Verify phone OTP (our own OTP from register/email or register/phone)
router.post('/verify-phone-otp', authController.verifyPhoneOtp);

// ==================== PROTECTED ROUTES ====================

// Resend verification email
router.post('/resend-verification', authenticate, authController.resendVerification);

// Logout
router.post('/logout', authenticate, authController.logout);

// Get current user
router.get('/me', authenticate, authController.getCurrentUser);

module.exports = router;
