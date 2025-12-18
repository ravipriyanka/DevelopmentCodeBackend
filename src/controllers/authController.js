const { auth } = require('../config/firebase');
const { 
    signInWithEmailAndPassword,
    createUserWithEmailAndPassword,
    sendEmailVerification,
    signOut
} = require('firebase/auth');
const { UserModel } = require('../models/userModel');
const jwt = require('jsonwebtoken');
const { generateOtp, getExpiryTime } = require('../utils/otp');   // OTP helper
const { sendEmail } = require('../config/mailer');                // Nodemailer helper
// Twilio SMS disabled for now
// const { sendOtpSms } = require('../services/smsService');

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';
const JWT_EXPIRES = process.env.JWT_EXPIRES || '7d';

// Generate JWT token
const generateToken = (user) => {
    return jwt.sign(
        { uuid: user.uuid, email: user.email, phone: user.phone },
        JWT_SECRET,
        { expiresIn: JWT_EXPIRES }
    );
};

const authController = {

    // ==================== REGISTER WITH EMAIL ====================
    // POST /api/auth/register/email
    async registerWithEmail(req, res) {
        try {
            const { email, password, firstName, lastName, phone } = req.body;

            if (!email || !password) {
                return res.status(400).json({
                    success: false,
                    message: 'Email and password are required'
                });
            }

            // Check if user already exists
            const existingUser = await UserModel.findByEmail(email);
            if (existingUser) {
                return res.status(409).json({
                    success: false,
                    message: 'User with this email already exists'
                });
            }

            // Create user in Firebase
            const userCredential = await createUserWithEmailAndPassword(auth, email, password);
            const firebaseUser = userCredential.user;

            // Send default Firebase email verification (optional)
            await sendEmailVerification(firebaseUser);

            // Create user in database
            const { uuid } = await UserModel.create({
                firebaseUid: firebaseUser.uid,
                email: email,
                phone: phone,
                firstName: firstName,
                lastName: lastName
            });

            // Get user from database
            const user = await UserModel.findByUuid(uuid);

            // Generate OTP for email
            const emailOtp = generateOtp();
            const emailOtpExpiresAt = getExpiryTime();

            // Save email OTP in DB
            await UserModel.update(user.uuid, {
                email_otp: emailOtp,
                email_otp_expires_at: emailOtpExpiresAt
            });

            // Send email OTP
            await sendEmail({
                to: user.email,
                subject: 'Your registration OTP',
                text: `Your email OTP code is ${emailOtp}. It will expire in 10 minutes.`
            });

            // Generate JWT
            const token = generateToken(user);

            res.status(201).json({
                success: true,
                message: 'OTP sent to your email. Please enter it to complete registration.',
                data: {
                    user: {
                        uuid: user.uuid,
                        email: user.email,
                        firstName: user.first_name,
                        lastName: user.last_name,
                        phone: user.phone,
                        isEmailVerified: false,
                        isPhoneVerified: user.is_phone_verified
                    },
                    token: token
                }
            });

        } catch (error) {
            console.log('Register error:', error.message);
            
            let message = 'Registration failed';
            if (error.code === 'auth/email-already-in-use') {
                message = 'Email is already registered';
            } else if (error.code === 'auth/weak-password') {
                message = 'Password should be at least 6 characters';
            } else if (error.code === 'auth/invalid-email') {
                message = 'Invalid email address';
            }

            res.status(400).json({
                success: false,
                message: message,
                error: error.message
            });
        }
    },

    // ==================== REGISTER WITH PHONE ====================
    // POST /api/auth/register/phone
    async registerWithPhone(req, res) {
        try {
            const { phone, password } = req.body;

            if (!phone || !password) {
                return res.status(400).json({
                    success: false,
                    message: 'Phone and password are required'
                });
            }

            // Check if user already exists by phone
            const existingUser = await UserModel.findByPhone(phone);
            if (existingUser) {
                return res.status(409).json({
                    success: false,
                    message: 'User with this phone already exists'
                });
            }

            // Firebase needs an email, so create a fake one from phone
            const fakeEmail = `${phone.replace(/[^0-9]/g, '')}@phone.local`;

            const userCredential = await createUserWithEmailAndPassword(auth, fakeEmail, password);
            const firebaseUser = userCredential.user;

            // Create user in database
            const { uuid } = await UserModel.create({
                firebaseUid: firebaseUser.uid,
                email: fakeEmail,
                phone: phone
            });

            const user = await UserModel.findByUuid(uuid);

            // Generate phone OTP only
            const phoneOtp = generateOtp();
            const phoneOtpExpiresAt = getExpiryTime();

            await UserModel.update(user.uuid, {
                phone_otp: phoneOtp,
                phone_otp_expires_at: phoneOtpExpiresAt
            });

            // Log OTP (SMS disabled for now)
            console.log('PHONE OTP for', user.phone, 'is', phoneOtp);
            // await sendOtpSms(user.phone, phoneOtp);

            const token = generateToken(user);

            res.status(201).json({
                success: true,
                message: 'OTP sent to your phone. Please enter it to complete registration.',
                data: {
                    user: {
                        uuid: user.uuid,
                        phone: user.phone,
                        isPhoneVerified: user.is_phone_verified
                    },
                    token: token
                }
            });

        } catch (error) {
            console.log('Register with phone error:', error.message);

            let message = 'Registration failed';
            if (error.code === 'auth/email-already-in-use') {
                message = 'Phone is already registered';
            } else if (error.code === 'auth/weak-password') {
                message = 'Password should be at least 6 characters';
            }

            res.status(400).json({
                success: false,
                message: message,
                error: error.message
            });
        }
    },

    // ==================== LOGIN WITH EMAIL ====================
    // POST /api/auth/login/email
    async loginWithEmail(req, res) {
        try {
            const { email, password } = req.body;

            if (!email || !password) {
                return res.status(400).json({
                    success: false,
                    message: 'Email and password are required'
                });
            }

            const userCredential = await signInWithEmailAndPassword(auth, email, password);
            const firebaseUser = userCredential.user;

            let user = await UserModel.findByFirebaseUid(firebaseUser.uid);

            if (!user) {
                const { uuid } = await UserModel.create({
                    firebaseUid: firebaseUser.uid,
                    email: firebaseUser.email
                });
                user = await UserModel.findByUuid(uuid);
            }

            await UserModel.updateLastLogin(user.uuid);

            if (firebaseUser.emailVerified && !user.is_email_verified) {
                await UserModel.update(user.uuid, { isEmailVerified: true });
            }

            const token = generateToken(user);

            res.json({
                success: true,
                message: 'Login successful',
                data: {
                    user: {
                        uuid: user.uuid,
                        email: user.email,
                        firstName: user.first_name,
                        lastName: user.last_name,
                        phone: user.phone,
                        profileImage: user.profile_image,
                        isEmailVerified: firebaseUser.emailVerified,
                        isPhoneVerified: user.is_phone_verified
                    },
                    token: token
                }
            });

        } catch (error) {
            console.log('Login error:', error.message);

            let message = 'Login failed';
            if (error.code === 'auth/user-not-found') {
                message = 'User not found';
            } else if (error.code === 'auth/wrong-password') {
                message = 'Invalid password';
            } else if (error.code === 'auth/invalid-email') {
                message = 'Invalid email address';
            } else if (error.code === 'auth/too-many-requests') {
                message = 'Too many failed attempts. Please try again later.';
            }

            res.status(401).json({
                success: false,
                message: message,
                error: error.message
            });
        }
    },

    // ==================== SEND OTP TO PHONE (Firebase phone info) ====================
    // POST /api/auth/send-otp
    async sendOtp(req, res) {
        try {
            const { phone } = req.body;

            if (!phone) {
                return res.status(400).json({
                    success: false,
                    message: 'Phone number is required'
                });
            }

            res.json({
                success: true,
                message: 'OTP should be sent from frontend using Firebase SDK',
                data: {
                    phone: phone,
                    note: 'Use Firebase signInWithPhoneNumber on frontend',
                    steps: [
                        '1. Initialize Firebase on frontend',
                        '2. Set up reCAPTCHA verifier',
                        '3. Call signInWithPhoneNumber(auth, phoneNumber, appVerifier)',
                        '4. User receives OTP via SMS',
                        '5. Verify OTP using confirmationResult.confirm(code)',
                        '6. Send Firebase ID token to /api/auth/verify-otp'
                    ]
                }
            });

        } catch (error) {
            console.log('Send OTP error:', error.message);
            res.status(500).json({
                success: false,
                message: 'Failed to send OTP',
                error: error.message
            });
        }
    },

    // ==================== VERIFY OTP / PHONE LOGIN (Firebase phone flow) ====================
    // POST /api/auth/verify-otp
    async verifyOtp(req, res) {
        try {
            const { firebaseIdToken, phone } = req.body;

            if (!firebaseIdToken) {
                return res.status(400).json({
                    success: false,
                    message: 'Firebase ID token is required'
                });
            }

            let user = await UserModel.findByPhone(phone);

            if (!user) {
                const { uuid } = await UserModel.create({
                    firebaseUid: firebaseIdToken.substring(0, 128),
                    phone: phone
                });
                user = await UserModel.findByUuid(uuid);
            }

            await UserModel.update(user.uuid, { isPhoneVerified: true });
            await UserModel.updateLastLogin(user.uuid);

            const token = generateToken(user);

            res.json({
                success: true,
                message: 'Phone verification successful',
                data: {
                    user: {
                        uuid: user.uuid,
                        email: user.email,
                        phone: user.phone,
                        firstName: user.first_name,
                        lastName: user.last_name,
                        isPhoneVerified: true,
                        isNewUser: !user.first_name
                    },
                    token: token
                }
            });

        } catch (error) {
            console.log('Verify OTP error:', error.message);
            res.status(401).json({
                success: false,
                message: 'OTP verification failed',
                error: error.message
            });
        }
    },

    // ==================== FORGOT PASSWORD (SEND OTP VIA NODEMAILER) ====================
    // STEP 1: send OTP
    // POST /api/auth/forgot-password
    async forgotPassword(req, res) {
        try {
            const { email } = req.body;

            if (!email) {
                return res.status(400).json({
                    success: false,
                    message: 'Email is required'
                });
            }

            const user = await UserModel.findByEmail(email);
            if (!user) {
                return res.status(404).json({
                    success: false,
                    message: 'No user found with this email'
                });
            }

            const otp = generateOtp();
            const expiresAt = getExpiryTime();

            await UserModel.update(user.uuid, {
                password_reset_otp: otp,
                password_reset_otp_expires_at: expiresAt,
                can_reset_password: 0    // reset flag
            });

            await sendEmail({
                to: email,
                subject: 'Your password reset OTP',
                text: `Your OTP code is ${otp}. It will expire in 10 minutes.`
            });

            res.json({
                success: true,
                message: 'Password reset OTP sent to your email.'
            });

        } catch (error) {
            console.log('Forgot password error:', error.message);

            res.status(500).json({
                success: false,
                message: 'Failed to send password reset OTP',
                error: error.message
            });
        }
    },

    // ==================== VERIFY FORGOT PASSWORD OTP ====================
    // STEP 2: verify OTP only
    // POST /api/auth/verify-forgot-otp
    async verifyForgotOtp(req, res) {
        try {
            const { email, otp } = req.body;

            if (!email || !otp) {
                return res.status(400).json({
                    success: false,
                    message: 'Email and OTP are required'
                });
            }

            const user = await UserModel.findByEmail(email);
            if (!user) {
                return res.status(404).json({
                    success: false,
                    message: 'User not found'
                });
            }

            if (!user.password_reset_otp || !user.password_reset_otp_expires_at) {
                return res.status(400).json({
                    success: false,
                    message: 'No OTP requested or OTP expired'
                });
            }

            const now = new Date();
            const expiresAt = new Date(user.password_reset_otp_expires_at);

            if (now > expiresAt) {
                return res.status(400).json({
                    success: false,
                    message: 'OTP expired'
                });
            }

            if (user.password_reset_otp !== otp) {
                return res.status(400).json({
                    success: false,
                    message: 'Invalid OTP'
                });
            }

            // Mark OTP as used and allow reset
            await UserModel.update(user.uuid, {
                password_reset_otp: null,
                password_reset_otp_expires_at: null,
                can_reset_password: 1
            });

            res.json({
                success: true,
                message: 'OTP verified. You can now set a new password.'
            });

        } catch (error) {
            console.log('Verify forgot OTP error:', error.message);
            res.status(500).json({
                success: false,
                message: 'Failed to verify OTP',
                error: error.message
            });
        }
    },

    // ==================== SET NEW PASSWORD AFTER FORGOT FLOW ====================
    // STEP 3: only new password
    // POST /api/auth/set-new-password
    async setNewPassword(req, res) {
        try {
            const { email, newPassword } = req.body;

            if (!email || !newPassword) {
                return res.status(400).json({
                    success: false,
                    message: 'Email and newPassword are required'
                });
            }

            const user = await UserModel.findByEmail(email);
            if (!user) {
                return res.status(404).json({
                    success: false,
                    message: 'User not found'
                });
            }

            if (!user.can_reset_password) {
                return res.status(400).json({
                    success: false,
                    message: 'OTP not verified or reset not allowed'
                });
            }

            // Here you should actually update password in Firebase from frontend
            // Backend only clears the flag so this flow is one-time.
            await UserModel.update(user.uuid, {
                can_reset_password: 0
            });

            res.json({
                success: true,
                message: 'New password accepted. Please update it in Firebase/front-end.'
            });

        } catch (error) {
            console.log('Set new password error:', error.message);
            res.status(500).json({
                success: false,
                message: 'Failed to set new password',
                error: error.message
            });
        }
    },

    // ==================== SEND EMAIL OTP (manual) ====================
    // POST /api/auth/send-email-otp
    async sendEmailOtp(req, res) {
        try {
            const { email } = req.body;

            if (!email) {
                return res.status(400).json({
                    success: false,
                    message: 'Email is required'
                });
            }

            const user = await UserModel.findByEmail(email);
            if (!user) {
                return res.status(404).json({
                    success: false,
                    message: 'User not found'
                });
            }

            const otp = generateOtp();
            const expiresAt = getExpiryTime();

            await UserModel.update(user.uuid, {
                email_otp: otp,
                email_otp_expires_at: expiresAt
            });

            await sendEmail({
                to: email,
                subject: 'Your verification code',
                text: `Your OTP code is ${otp}. It will expire in 10 minutes.`
            });

            res.json({
                success: true,
                message: 'Email OTP sent successfully'
            });

        } catch (error) {
            console.log('Send email OTP error:', error.message);
            res.status(500).json({
                success: false,
                message: 'Failed to send email OTP',
                error: error.message
            });
        }
    },

    // ==================== VERIFY EMAIL OTP ====================
    // POST /api/auth/verify-email-otp
    async verifyEmailOtp(req, res) {
        try {
            const { email, otp } = req.body;

            if (!email || !otp) {
                return res.status(400).json({
                    success: false,
                    message: 'Email and OTP are required'
                });
            }

            const user = await UserModel.findByEmail(email);
            if (!user) {
                return res.status(404).json({
                    success: false,
                    message: 'User not found'
                });
            }

            if (!user.email_otp || !user.email_otp_expires_at) {
                return res.status(400).json({
                    success: false,
                    message: 'No OTP requested or OTP expired'
                });
            }

            const now = new Date();
            const expiresAt = new Date(user.email_otp_expires_at);

            if (now > expiresAt) {
                return res.status(400).json({
                    success: false,
                    message: 'OTP expired'
                });
            }

            if (user.email_otp !== otp) {
                return res.status(400).json({
                    success: false,
                    message: 'Invalid OTP'
                });
            }

            await UserModel.update(user.uuid, {
                is_email_verified: 1,
                email_otp: null,
                email_otp_expires_at: null
            });

            res.json({
                success: true,
                message: 'Registration successful. Email verified.'
            });

        } catch (error) {
            console.log('Verify email OTP error:', error.message);
            res.status(500).json({
                success: false,
                message: 'Failed to verify email OTP',
                error: error.message
            });
        }
    },

    // ==================== VERIFY PHONE OTP (our own OTP) ====================
    // POST /api/auth/verify-phone-otp
    async verifyPhoneOtp(req, res) {
        try {
            const { phone, otp } = req.body;

            if (!phone || !otp) {
                return res.status(400).json({
                    success: false,
                    message: 'Phone and OTP are required'
                });
            }

            const user = await UserModel.findByPhone(phone);
            if (!user) {
                return res.status(404).json({
                    success: false,
                    message: 'User not found'
                });
            }

            if (!user.phone_otp || !user.phone_otp_expires_at) {
                return res.status(400).json({
                    success: false,
                    message: 'No OTP requested or OTP expired'
                });
            }

            const now = new Date();
            const expiresAt = new Date(user.phone_otp_expires_at);

            if (now > expiresAt) {
                return res.status(400).json({
                    success: false,
                    message: 'OTP expired'
                });
            }

            if (user.phone_otp !== otp) {
                return res.status(400).json({
                    success: false,
                    message: 'Invalid OTP'
                });
            }

            await UserModel.update(user.uuid, {
                is_phone_verified: 1,
                phone_otp: null,
                phone_otp_expires_at: null
            });

            res.json({
                success: true,
                message: 'Phone OTP verified successfully'
            });

        } catch (error) {
            console.log('Verify phone OTP error:', error.message);
            res.status(500).json({
                success: false,
                message: 'Failed to verify phone OTP',
                error: error.message
            });
        }
    },

    // ==================== RESEND VERIFICATION EMAIL ====================
    // POST /api/auth/resend-verification
    async resendVerification(req, res) {
        try {
            const currentUser = auth.currentUser;

            if (!currentUser) {
                return res.status(401).json({
                    success: false,
                    message: 'No user logged in'
                });
            }

            await sendEmailVerification(currentUser);

            res.json({
                success: true,
                message: 'Verification email sent'
            });

        } catch (error) {
            console.log('Resend verification error:', error.message);
            res.status(500).json({
                success: false,
                message: 'Failed to send verification email',
                error: error.message
            });
        }
    },

    // ==================== LOGOUT ====================
    // POST /api/auth/logout
    async logout(req, res) {
        try {
            await signOut(auth);

            res.json({
                success: true,
                message: 'Logged out successfully'
            });

        } catch (error) {
            console.log('Logout error:', error.message);
            res.status(500).json({
                success: false,
                message: 'Logout failed',
                error: error.message
            });
        }
    },

    // ==================== GET CURRENT USER ====================
    // GET /api/auth/me
    async getCurrentUser(req, res) {
        try {
            const user = req.user;

            res.json({
                success: true,
                message: 'User retrieved',
                data: {
                    uuid: user.uuid,
                    email: user.email,
                    phone: user.phone,
                    firstName: user.first_name,
                    lastName: user.last_name,
                    profileImage: user.profile_image,
                    dateOfBirth: user.date_of_birth,
                    gender: user.gender,
                    isEmailVerified: user.is_email_verified,
                    isPhoneVerified: user.is_phone_verified,
                    createdAt: user.created_at
                }
            });

        } catch (error) {
            console.log('Get current user error:', error.message);
            res.status(500).json({
                success: false,
                message: 'Failed to get user',
                error: error.message
            });
        }
    }
};

module.exports = authController;
