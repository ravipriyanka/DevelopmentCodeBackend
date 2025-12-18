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
// POST /api/auth/send-otp
router.post('/send-otp', authController.sendOtp);

// Verify OTP / Phone login (Firebase phone flow)
// POST /api/auth/verify-otp
router.post('/verify-otp', authController.verifyOtp);

// Forgot password (send OTP to email) – STEP 1
// POST /api/auth/forgot-password
router.post('/forgot-password', authController.forgotPassword);

// Verify forgot-password OTP – STEP 2
// POST /api/auth/verify-forgot-otp
router.post('/verify-forgot-otp', authController.verifyForgotOtp);

// Set new password (after OTP verified) – STEP 3
// POST /api/auth/set-new-password
router.post('/set-new-password', authController.setNewPassword);

// Send email OTP (manual, not forgot password)
// POST /api/auth/send-email-otp
router.post('/send-email-otp', authController.sendEmailOtp);

// Verify email OTP (registration / manual)
// POST /api/auth/verify-email-otp
router.post('/verify-email-otp', authController.verifyEmailOtp);

// Verify phone OTP (our own OTP from register/phone)
// POST /api/auth/verify-phone-otp
router.post('/verify-phone-otp', authController.verifyPhoneOtp);

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
